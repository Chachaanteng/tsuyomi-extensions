// SPDX-FileCopyrightText: 2026 Tsuyomi Contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { sign } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import {
  assertArchivePath,
  assertExactKeys,
  assertObject,
  assertString,
  canonicalize,
  ed25519PublicKeyBytes,
  parseJsonWithUniqueKeys,
  readEd25519PrivateKey,
  sha256,
  zipStore,
} from './repository-format.mjs';

const FIXTURE_PUBLIC_KEY_BASE64 = 'ebVWLo/mVPlAeLES6KmLp5AfhTrmlb7X4OORC60ElmQ=';
const MAX_PACKAGE_BYTES = 16 * 1024 * 1024;
const KEY_ID = /^[a-z0-9][a-z0-9._-]{0,63}$/;

const usage = `Usage:
  node tools/package-hxp.mjs --manifest <template.json> --private-key <pkcs8.pem|der>
    --output <extension.hxp> --file <archive-path=source-path> [--file ...]

The manifest template supplies the normal HXP fields, including \"entry\" and
\"signing\". This command derives integrity.files, contentDigest, and the detached
Ed25519 signature. It refuses the public deterministic test-fixture key and never
creates or selects a signing key.`;
const archivePathCompare = (left, right) => (left < right ? -1 : left > right ? 1 : 0);

const fail = (message) => {
  throw new Error(message);
};

const parseArguments = (argumentsList) => {
  const options = { files: [] };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === '--help') {
      process.stdout.write(`${usage}\n`);
      process.exit(0);
    }
    if (!['--manifest', '--private-key', '--output', '--file'].includes(argument)) fail(`Unknown option ${argument}`);
    const value = argumentsList[index + 1];
    if (value === undefined || value.startsWith('--')) fail(`${argument} requires a value`);
    index += 1;
    if (argument === '--file') options.files.push(value);
    else if (options[argument] !== undefined) fail(`${argument} may only be supplied once`);
    else options[argument] = value;
  }
  for (const required of ['--manifest', '--private-key', '--output']) {
    if (options[required] === undefined) fail(`${required} is required`);
  }
  if (options.files.length === 0) fail('At least one --file is required');
  return options;
};

const readRequired = async (path, label) => {
  try {
    return await readFile(resolve(path));
  } catch (error) {
    fail(`Cannot read ${label} ${path}: ${error.code ?? error.message}`);
  }
};

const parseFileMapping = async (specification) => {
  const separator = specification.indexOf('=');
  if (separator <= 0 || separator === specification.length - 1) fail(`Invalid --file mapping ${JSON.stringify(specification)}; use archive-path=source-path`);
  const archivePath = assertArchivePath(specification.slice(0, separator), '--file archive path');
  const sourcePath = specification.slice(separator + 1);
  return [archivePath, await readRequired(sourcePath, `file for ${archivePath}`)];
};

const options = parseArguments(process.argv.slice(2));
const templateBytes = await readRequired(options['--manifest'], 'manifest template');
const template = parseJsonWithUniqueKeys(templateBytes.toString('utf8'), 'HXP manifest template');
assertObject(template, 'HXP manifest template');
if (Object.hasOwn(template, 'integrity')) fail('HXP manifest template must not provide integrity; packaging derives it from --file inputs');
assertExactKeys(template.signing, ['algorithm', 'keyId', 'signatureFile'], 'HXP manifest template.signing');
if (template.format !== 'tsuyomi-hxp') fail('HXP manifest template format must be tsuyomi-hxp');
if (template.manifestVersion !== 1) fail('HXP manifest template manifestVersion must be 1');
const entryPath = assertArchivePath(template.entry, 'HXP manifest template.entry');
if (template.signing.algorithm !== 'Ed25519') fail('HXP manifest template.signing.algorithm must be Ed25519');
assertString(template.signing.keyId, 'HXP manifest template.signing.keyId', { min: 1, max: 64, pattern: KEY_ID });
if (template.signing.signatureFile !== 'signature.ed25519') fail('HXP manifest template.signing.signatureFile must be signature.ed25519');

const files = await Promise.all(options.files.map(parseFileMapping));
const fileEntries = new Map();
for (const [archivePath, bytes] of files) {
  if (archivePath === 'manifest.json' || archivePath === 'signature.ed25519') fail(`${archivePath} is reserved by the HXP format`);
  if (fileEntries.has(archivePath)) fail(`Duplicate --file archive path ${archivePath}`);
  fileEntries.set(archivePath, bytes);
}
if (!fileEntries.has(entryPath)) fail(`HXP entry ${entryPath} is not supplied by --file`);

const privateKey = readEd25519PrivateKey(await readRequired(options['--private-key'], 'private key'));
if (ed25519PublicKeyBytes(privateKey).toString('base64') === FIXTURE_PUBLIC_KEY_BASE64) {
  fail('The deterministic public test-fixture key is forbidden for production HXP packaging');
}

const integrityFiles = Object.fromEntries([...fileEntries.entries()]
  .sort(([left], [right]) => archivePathCompare(left, right))
  .map(([archivePath, bytes]) => [archivePath, sha256(bytes)]));
const contentDigest = sha256(Buffer.from(canonicalize(integrityFiles), 'utf8'));
const manifest = {
  ...template,
  integrity: {
    algorithm: 'sha256',
    contentDigest,
    files: integrityFiles,
  },
};
const canonicalManifest = Buffer.from(canonicalize(manifest), 'utf8');
const signature = sign(null, Buffer.concat([
  Buffer.from('tsuyomi-hxp-v1\0', 'ascii'),
  canonicalManifest,
  Buffer.from([0]),
  Buffer.from(contentDigest, 'ascii'),
]), privateKey);
if (signature.length !== 64) fail('Ed25519 did not return a 64-byte signature');

const archive = zipStore([
  ['manifest.json', canonicalManifest],
  ...[...fileEntries.entries()].sort(([left], [right]) => archivePathCompare(left, right)),
  ['signature.ed25519', signature],
]);
if (archive.length > MAX_PACKAGE_BYTES) fail(`HXP archive exceeds ${MAX_PACKAGE_BYTES} bytes`);
const output = resolve(options['--output']);
await mkdir(dirname(output), { recursive: true });
try {
  await writeFile(output, archive, { flag: 'wx' });
} catch (error) {
  if (error.code === 'EEXIST') fail(`Refusing to overwrite existing output ${output}`);
  throw error;
}
process.stdout.write(`${sha256(archive)}  ${output}\n`);
