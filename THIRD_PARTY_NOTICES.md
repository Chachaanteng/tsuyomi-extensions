<!-- SPDX-FileCopyrightText: 2026 Tsuyomi Contributors -->
<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Third-party notices

| Project | Pinned version | License | Scope |
|---|---:|---|---|
| actions/checkout | 4.2.2 (`11bd71901bbe5b1630ceea73d27597364c9af683`) | MIT | GitHub Actions source checkout only |
| actions/setup-node | 4.4.0 (`49933ea5288caeca8642d1e84afbd3f7d6820020`) | MIT | GitHub Actions Node runtime setup only |
| actions/upload-artifact | commit `ea165f8d65b6e75b540449e92b4886f43607fa02` | MIT | transfer unsigned data-only release input between isolated jobs; no private keys |
| actions/download-artifact | commit `d3f86a106a0bac45b974a628896c90dbdf5c8093` | MIT | retrieve same-run unsigned input for independent digest validation |
| TypeScript | 7.0.2 | Apache-2.0 | development-only compiler; not distributed in HXP archives |
| Ajv | 8.20.0 | MIT | development-only validation of the vendored HXP manifest schema |
| ajv-formats | 3.0.1 | MIT | development-only URI format support for Ajv |
| fast-deep-equal | 3.1.3 | MIT | transitive Ajv dependency; development only |
| fast-uri | 3.1.5 | BSD-3-Clause | transitive Ajv dependency; development only |
| json-schema-traverse | 1.0.0 | MIT | transitive Ajv dependency; development only |
| require-from-string | 2.0.2 | MIT | transitive Ajv dependency; development only |
| Tsuyomi Protocol HXP manifest schema | checkpoint `09e0cb7`, blob `af1107f7987386c07ae9d4646a635f354cb50355`, SHA-256 `1ff7d570d702229539317f54951ea53dfb7aa50a1c31d5f79287c967b47bbeb2` | Apache-2.0 | verbatim `tsuyomi-protocol/schemas/hxp-manifest-v1.schema.json`, used only to reject incompatible production HXP manifests before signing |
| REUSE Tool | 6.2.0 | GPL-3.0-or-later | local/CI license validation only; not distributed |

No third-party source code, binary, fixture, or distributable asset is adopted in the Phase 1 extension-contract baseline except the verbatim, Apache-2.0 HXP manifest schema identified above.

## Imported project provenance

This repository's filtered history imports the former `tsuyomi-extensions/` subtree from `Xfire233/Tsuyomi` at checkpoint `09e0cb7326b0310495083bc8eaf8b3a7e89e1420`. That imported material was distributed under Apache-2.0. Its historical notices and the verbatim Apache-2.0 text remain in this repository; those Apache grants are not revoked by the current AGPL-3.0-only derivative scope. See `EXTRACTION_PROVENANCE.md`, `NOTICE`, and `LICENSES/Apache-2.0.txt`.
