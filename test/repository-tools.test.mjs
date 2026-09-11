// SPDX-FileCopyrightText: 2026 Tsuyomi Contributors
// SPDX-License-Identifier: AGPL-3.0-only

import assert from 'node:assert/strict';
import { execFile as execFileCallback } from 'node:child_process';
import { createPrivateKey, createPublicKey, generateKeyPairSync, verify } from 'node:crypto';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import test from 'node:test';
import { canonicalize, ed25519PublicKeyBytes, sha256 } from '../tools/repository-format.mjs';

const execFile = promisify(execFileCallback);
const packager = new URL('../tools/package-hxp.mjs', import.meta.url);
const catalogGenerator = new URL('../tools/generate-catalog.mjs', import.meta.url);

const readStoredZip = (archive) => {
  const entries = new Map();
  let offset = 0;
  while (archive.readUInt32LE(offset) === 0x04034b50) {
    const method = archive.readUInt16LE(offset + 8);
    assert.equal(method, 0, 'test archive uses stored ZIP entries');
    const size = archive.readUInt32LE(offset + 22);
    const nameLength = archive.readUInt16LE(offset + 26);
    const extraLength = archive.readUInt16LE(offset + 28);
    const nameOffset = offset + 30;
    const contentOffset = nameOffset + nameLength + extraLength;
    entries.set(archive.subarray(nameOffset, nameOffset + nameLength).toString('utf8'), archive.subarray(contentOffset, contentOffset + size));
    offset = contentOffset + size;
  }
  return entries;
};

const command = async (script, argumentsList, cwd) => execFile(process.execPath, [fileURLToPath(script), ...argumentsList], { cwd });

const freshEd25519Key = () => generateKeyPairSync('ed25519').privateKey.export({ type: 'pkcs8', format: 'pem' });

test('production HXP packager derives deterministic integrity and a verifiable signature from an explicit key', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'tsuyomi-hxp-tool-'));
  const privateKeyPath = join(directory, 'publisher.pem');
  const entryPath = join(directory, 'index.mjs');
  const assetPath = join(directory, 'title.txt');
  const manifestPath = join(directory, 'manifest-template.json');
  const firstOutput = join(directory, 'first.hxp');
  const secondOutput = join(directory, 'second.hxp');
  const privateKeyPem = freshEd25519Key();
  await Promise.all([
    writeFile(privateKeyPath, privateKeyPem),
    writeFile(entryPath, 'export default { id: "fixture" };\n'),
    writeFile(assetPath, 'deterministic asset\n'),
    writeFile(manifestPath, JSON.stringify({
      format: 'tsuyomi-hxp',
      manifestVersion: 1,
      id: 'org.tsuyomi.toolfixture',
      version: '1.0.0',
      entry: 'index.mjs',
      signing: { algorithm: 'Ed25519', keyId: 'tool-test-publisher', signatureFile: 'signature.ed25519' },
      capabilities: { network: { origins: [] } },
    })),
  ]);
  const commonArguments = [
    '--manifest', manifestPath,
    '--private-key', privateKeyPath,
    '--file', `assets/title.txt=${assetPath}`,
    '--file', `index.mjs=${entryPath}`,
  ];
  await command(packager, [...commonArguments, '--output', firstOutput], directory);
  await command(packager, [...commonArguments, '--output', secondOutput], directory);

  const [firstArchive, secondArchive] = await Promise.all([readFile(firstOutput), readFile(secondOutput)]);
  assert.deepEqual(firstArchive, secondArchive, 'unchanged inputs must produce byte-identical HXP archives');
  const entries = readStoredZip(firstArchive);
  const manifestBytes = entries.get('manifest.json');
  const signature = entries.get('signature.ed25519');
  assert.ok(manifestBytes);
  assert.ok(signature);
  const manifest = JSON.parse(manifestBytes.toString('utf8'));
  assert.deepEqual(Object.keys(manifest.integrity.files), ['assets/title.txt', 'index.mjs']);
  assert.equal(manifest.integrity.files['index.mjs'], sha256(await readFile(entryPath)));
  assert.equal(manifest.integrity.contentDigest, sha256(Buffer.from(canonicalize(manifest.integrity.files), 'utf8')));
  const publicKey = createPublicKey(privateKeyPem);
  assert.equal(verify(null, Buffer.concat([
    Buffer.from('tsuyomi-hxp-v1\0', 'ascii'),
    Buffer.from(canonicalize(manifest), 'utf8'),
    Buffer.from([0]),
    Buffer.from(manifest.integrity.contentDigest, 'ascii'),
  ]), publicKey, signature), true);
});

test('catalog generator emits the exact signed repository envelope with derived publisher fingerprints', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'tsuyomi-catalog-tool-'));
  const rootKeyPath = join(directory, 'root.pem');
  const inputPath = join(directory, 'catalog-input.json');
  const firstOutput = join(directory, 'first.json');
  const secondOutput = join(directory, 'second.json');
  const rootPrivateKey = freshEd25519Key();
  const publisherPrivateKey = freshEd25519Key();
  const publisherPublicKey = ed25519PublicKeyBytes(createPrivateKey(publisherPrivateKey)).toString('base64');
  const now = Date.now();
  const issuedAt = new Date(now).toISOString();
  const expiresAt = new Date(now + 60 * 60 * 1000).toISOString();
  await Promise.all([
    writeFile(rootKeyPath, rootPrivateKey),
    writeFile(inputPath, JSON.stringify({
      repositoryId: 'org.tsuyomi.extensions',
      sequence: 1,
      issuedAt,
      expiresAt,
      publishers: [{ keyId: 'catalog-tool-publisher', publicKey: publisherPublicKey }],
      packages: [{
        id: 'org.tsuyomi.wenku8',
        name: 'Wenku8',
        version: '1.0.0',
        summary: 'Tooling verification package',
        language: 'zh-CN',
        license: 'AGPL-3.0-only',
        sourceUrl: 'https://github.com/Chachaanteng/tsuyomi-extensions',
        sourceRevision: '0123456789abcdef0123456789abcdef01234567',
        downloadUrl: 'https://example.test/packages/wenku8.hxp',
        size: 1024,
        sha256: '0'.repeat(64),
        hostApi: { minInclusive: '1.2.0', maxExclusive: '2.0.0' },
        publisherKeyId: 'catalog-tool-publisher',
      }],
      revocations: { publisherFingerprints: [], packageDigests: [] },
    })),
  ]);
  const commonArguments = [
    '--input', inputPath,
    '--private-key', rootKeyPath,
    '--key-id', 'catalog-tool-root',
    '--now', issuedAt,
  ];
  await command(catalogGenerator, [...commonArguments, '--output', firstOutput], directory);
  await command(catalogGenerator, [...commonArguments, '--output', secondOutput], directory);

  const [firstBytes, secondBytes] = await Promise.all([readFile(firstOutput), readFile(secondOutput)]);
  assert.deepEqual(firstBytes, secondBytes, 'unchanged catalog inputs must produce byte-identical signed metadata');
  const envelope = JSON.parse(firstBytes.toString('utf8'));
  assert.deepEqual(Object.keys(envelope).sort(), ['format', 'keyId', 'signature', 'signed', 'version']);
  assert.equal(envelope.format, 'tsuyomi-repository');
  assert.equal(envelope.version, 1);
  assert.equal(envelope.keyId, 'catalog-tool-root');
  assert.equal(envelope.signed.publishers[0].fingerprint, sha256(Buffer.from(publisherPublicKey, 'base64')));
  assert.equal(verify(null, Buffer.concat([
    Buffer.from('tsuyomi-repository-v1\0', 'ascii'),
    Buffer.from(canonicalize(envelope.signed), 'utf8'),
  ]), createPublicKey(rootPrivateKey), Buffer.from(envelope.signature, 'base64')), true);
});
