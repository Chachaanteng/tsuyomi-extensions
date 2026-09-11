<!-- SPDX-FileCopyrightText: 2026 Tsuyomi Contributors -->
<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Tsuyomi Extensions

Standalone TypeScript ES-module source extensions, deterministic signed `.hxp`
packaging, and offline signed catalog generation for Tsuyomi. The current Wenku8
source ID remains `org.tsuyomi.wenku8` with Host API compatibility
`[1.2.0, 2.0.0)`.

Extensions receive only platform-neutral Host APIs: constrained HTTP, encoding,
source-scoped cookies, controlled Web login, and isolated storage. They cannot
access Android framework APIs, arbitrary files, or unrestricted network
destinations. No CI test depends on a live content site; recorded fixtures are
sanitized.

## License and provenance

The independently maintained extension implementation, tests, and repository
tooling are **AGPL-3.0-only**. This repository was extracted from Apache-2.0
material; the original Apache grants, notices, and filtered history remain
preserved and are not revoked. Read [LICENSE](LICENSE),
[NOTICE](NOTICE), [EXTRACTION_PROVENANCE.md](EXTRACTION_PROVENANCE.md), and
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) together.

The Android host and platform-neutral protocol are deliberately outside this
repository and remain Apache-2.0. This checkout has no sibling-checkout
requirement.

## Local verification

```sh
npm ci
npm test
npm run package:fixture
```

The fixture command alone may rewrite the committed fixture archive and digest;
CI rejects a mismatch. The deterministic fixture publisher key is public and
**test-only**. Its private seed exists only in `tools/build-fixture.mjs`;
production tooling retains only the public value needed to reject that key.

## Production HXP packaging

`package:hxp` never creates, selects, persists, or defaults a key. Supply a
custodian-owned Ed25519 PKCS#8 PEM/DER key, a JSON manifest template without an
`integrity` field, and every archive file explicitly:

```sh
npm run package:hxp -- \
  --manifest path/to/manifest-template.json \
  --private-key path/to/publisher.pkcs8.pem \
  --file index.mjs=dist/modules/example/index.mjs \
  --file assets/icon.svg=assets/icon.svg \
  --output out/example.hxp
```

The template supplies normal HXP fields including `entry` and `signing`; the
tool derives `integrity.files`, `contentDigest`, a canonical manifest, and the
detached Ed25519 signature. It uses fixed ZIP metadata and refuses to overwrite
an existing artifact. A generated HXP is not a release.

## Offline catalog generation

`catalog:generate` emits the exact `tsuyomi-repository` v1 envelope. Its input
is the unsigned `signed` body with these keys:

```json
{
  "repositoryId": "org.tsuyomi.extensions",
  "sequence": 1,
  "issuedAt": "2026-09-11T00:00:00Z",
  "expiresAt": "2026-09-12T00:00:00Z",
  "publishers": [{ "keyId": "publisher-v1", "publicKey": "base64-raw-ed25519-public-key" }],
  "packages": [],
  "revocations": { "publisherFingerprints": [], "packageDigests": [] }
}
```

The generator derives and writes each publisher's lowercase SHA-256 hex
`fingerprint`, enforces catalog bounds and HTTPS/no-credentials/no-fragment
URLs, and signs `ASCII("tsuyomi-repository-v1\\0") + UTF8(JCS(signed))` with an
explicit root key:

```sh
npm run catalog:generate -- \
  --input path/to/catalog-input.json \
  --private-key path/to/repository-root.pkcs8.pem \
  --key-id repository-root-v1 \
  --now 2026-09-11T00:00:00Z \
  --output out/index-v1.json
```

`--now` is explicit so the validity check is reproducible. The command only
writes a local file and refuses an existing output. It does not publish an
index, create a release, or configure a production root in an application.
