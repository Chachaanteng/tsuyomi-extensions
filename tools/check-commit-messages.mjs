// SPDX-FileCopyrightText: 2026 Tsuyomi Contributors
// SPDX-License-Identifier: AGPL-3.0-only

// GitHub counts every `Co-authored-by:` trailer as a contributor, so publishing
// a commit that credits an automated agent permanently adds that account to the
// repository contributor list. Rewriting public history is the only way back, so
// the trailer is rejected before it can reach main.

import { execFileSync } from 'node:child_process';

const forbidden = [
  { label: 'automated co-author trailer', pattern: /^co-authored-by:[^\n]*commandcode/im },
];

const [base = '', head = 'HEAD'] = process.argv.slice(2);
const range = base === '' || /^0+$/.test(base) ? head : `${base}..${head}`;

let output;
try {
  output = execFileSync('git', ['log', '-z', '--format=%H%x00%B', range], { encoding: 'utf8' });
} catch (error) {
  console.error(`cannot read commit messages for ${range}: ${error.message}`);
  process.exit(1);
}

const fields = output.split('\0');
const violations = [];
for (let index = 0; index + 1 < fields.length; index += 2) {
  const revision = fields[index].trim();
  const message = fields[index + 1];
  for (const { label, pattern } of forbidden) {
    if (pattern.test(message)) violations.push(`${revision.slice(0, 12)}: ${label}`);
  }
}

if (violations.length > 0) {
  console.error(`Refusing automated attribution in ${range}:`);
  for (const violation of violations) console.error(`  ${violation}`);
  console.error('Rewrite the commits to drop the trailer before merging.');
  process.exit(1);
}

console.log(`Commit messages in ${range} carry no automated attribution.`);
