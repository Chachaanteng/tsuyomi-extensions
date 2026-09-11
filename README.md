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

The template supplies all required HXP fields except `integrity`; the tool derives `integrity.files`, `contentDigest`, a canonical manifest, and the detached Ed25519 signature. Before signing, it validates that completed manifest against the pinned Apache-2.0 `schemas/hxp-manifest-v1.schema.json` (provenance in `EXTRACTION_PROVENANCE.md`) and applies the Android host's capability-policy admission rules, including canonical origin containment and remote-library operation constraints. It rejects entries over 8 MiB, more than 256 total archive files, manifests over 128 KiB, and archives over 16 MiB; it uses fixed ZIP metadata and refuses to overwrite an existing artifact. A generated HXP is not a release.

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

## Automated official distribution

`main` contains reviewed source and tests. Versioned `.hxp` files and the exact
corresponding source archive are GitHub Release attachments, not generated
commits in `main`. Tags use `<source-id>-v<version>` and packages use
`<source-id>-<version>.hxp`. The `repository` branch owns `index-v1.json` at
`https://raw.githubusercontent.com/Chachaanteng/tsuyomi-extensions/repository/index-v1.json`.
This is the intended endpoint, not a claim that production distribution is live.
The host reads that signed index, never GitHub's latest-release listing.

The release workflow builds and tests without production keys, uploads a
data-only input bundle, then starts a clean signing runner. That runner checks
out an explicitly pinned signing-tool commit, installs its locked dependencies
with lifecycle scripts disabled and only then receives the required secrets.
It never executes extension code or scripts from the input bundle. Signing-tool,
workflow and dependency changes require code-owner review and a deliberate
update of the pinned tool revision; merging a tool change does not silently
replace the privileged signer.

Once first activation has been separately authorized, reviewing and merging a
release change into protected `main` is the routine publication approval. No
second per-release deployment reviewer is required. Contributors supply a
reviewed version in release metadata; changed package content without an
increased version fails rather than silently replacing an asset. Documentation
commits do not trigger package publication. Existing byte-identical attachments
may be reused on retry, but modified or mismatched attachments fail closed.
Uploaded bytes are verified before the catalog points at them. The existing
catalog signature and repository identity are checked; package bindings,
publisher history and revocations are retained. Existing-branch publication
uses GitHub's atomic expected-head commit operation rather than a racy
read-then-force-push. Initial branch creation is separately gated.

The daily renewal check uses only the root private key, renews when at most
seven days remain, and signs a fourteen-day validity window without rebuilding
unchanged packages. Publication and renewal share one non-cancelling concurrency
group. A failed build/publication/renewal creates or comments on the repository's
distribution-attention issue with the run URL. Enable Actions failure
notifications as well: GitHub schedules are best effort and public-repository
schedules can be disabled after inactivity; a job that never starts cannot
create its own failure issue. Catalog expiration blocks new repository installs,
not independently trusted installed sources or otherwise admissible local imports.

### First activation: custodian-controlled prerequisites

The workflow is disabled unless repository variable
`OFFICIAL_DISTRIBUTION_ENABLED` is exactly `true`. Adding the workflow does not
provision keys, configure GitHub protections or authorize a first publication.
Before enabling it, an explicitly authorized custodian must:

1. Protect `main` with required successful contributor CI, pull-request review
   and code-owner review; restrict bypass/direct pushes. Review `CODEOWNERS`
   against the actual maintainer roster. A sole maintainer cannot approve their
   own PR under GitHub's review rules; arrange a legitimate review author/owner
   flow rather than disabling the boundary silently.
2. Create environment `official-distribution`, restrict deployment to exactly
   `main`, and restrict changes to the environment, workflow and repository
   settings. Routine publication does not add a second required-reviewer gate.
   Restrict repository write access to authorized maintainers, forbid catalog
   force-push/deletion and release-tag replacement, and retain signed-catalog
   verification as the client trust boundary. GitHub rejects its built-in Actions
   integration as an update-ruleset bypass actor unless it is an eligible
   installed app in the ruleset owner; the default GITHUB_TOKEN deployment cannot
   claim an exclusive-bot writer rule. That stronger isolation needs a separately
   installed least-privilege GitHub App, not a broad personal access token.
3. Set `RELEASE_TOOL_REVISION` to the full 40-hex commit of the reviewed signing
   tools. Signing never follows a mutable branch or tag. This revision must
   contain the publication tool and its validated lockfile.
4. Provision distinct Ed25519 keys and recoverable encrypted backups outside
   source control. Configure the environment variables and secrets below;
   public anchors must match the supplied private keys. The publicly known
   deterministic fixture key is forbidden. Environment secrets are readable by
   the signing process, not hardware-isolated keys.
5. Set `ALLOW_INITIAL_PUBLICATION=true` only for the explicitly approved first
   catalog creation. Enable distribution and dispatch `release` on `main`.
   Verify the actual Release/index signatures, source attachment and client
   installation in an isolated environment, then remove the bootstrap flag.
   Existing state may never be silently reset after deletion or corruption.

| Environment setting | Type | Meaning |
|---|---|---|
| `RELEASE_TOOL_REVISION` | Variable | Reviewed full signing-tool commit |
| `REPOSITORY_ROOT_KEY_ID` | Variable | Stable root identity |
| `REPOSITORY_ROOT_PUBLIC_KEY` | Variable | Base64 raw 32-byte Ed25519 root public key |
| `REPOSITORY_ROOT_PRIVATE_KEY` | Secret | Root PKCS#8 PEM; release and renewal only |
| `EXTENSION_PUBLISHER_KEY_ID` | Variable | Stable official publisher identity |
| `EXTENSION_PUBLISHER_PUBLIC_KEY` | Variable | Base64 raw 32-byte publisher public key |
| `EXTENSION_PUBLISHER_PRIVATE_KEY` | Secret | Publisher PKCS#8 PEM; release only |
| `ALLOW_INITIAL_PUBLICATION` | Variable | One-time explicit bootstrap gate |

The host's built-in root public key requires a separately authorized host build;
publication does not change an already installed application. Local `.hxp`
import remains independent and subject to existing signature, compatibility,
revocation and explicit capability-grant checks. Automated maintenance never
authorizes automatic installation or canonical-device deployment.
