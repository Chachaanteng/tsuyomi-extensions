<!-- SPDX-FileCopyrightText: 2026 Tsuyomi Contributors -->
<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Changelog

## [Unreleased]

### Added

- Extracted the extension subtree into its independent filtered-history repository at monorepo checkpoint `09e0cb7`; the new collective derivative scope is AGPL-3.0-only while historical Apache-2.0 grants and notices remain preserved.
- Added standalone CI, deterministic explicit-key production HXP packaging, and offline signed `tsuyomi-repository` v1 catalog generation. Neither tool creates keys, publishes artifacts, or accepts the public deterministic fixture key.
- Added an activation-gated automated distribution workflow: data-only contributor build inputs, separately pinned protected signing tools, immutable GitHub Release assets, exact-commit corresponding source, authenticated catalog renewal and failed-run issue notification. Production secrets and first publication are not provisioned by this change.
- Activated the protected official catalog and published Wenku8 `0.2.31` with an immutable signed HXP and matching source archive. Routine reviewed release changes now publish through the protected workflow; clients still require explicit installation approval.

### Changed

- Corrected Wenku8 covers so every scraped and derived media URL resolves to the live `https://img.wenku8.com/image/{group}/{book}/{book}s.jpg` picture host: the dead `pic.wenku8.com` legacy rewrite (relative or absolute `/files/article/image/...`) now normalizes onto the image host, and image-free website-collection rows derive their cover through the same resolver. The unreachable `pic.wenku8.com` origin was removed from the network manifest and the illustration allowlist; the external `pic.777743.xyz` illustration host is retained because the live site still serves chapter images from it. Host API compatibility remains `[1.2.0, 2.0.0)`. This is an unreleased source correction, not a signed-artifact replacement.

- Fixed the live GitHub source-archive download returning HTTP415: archive endpoints negotiate the GitHub API media type while the response remains binary. Release-asset downloads retain their octet-stream media type; a local HTTP regression covers the distinction.

- Wenku8 推荐 now parses the source homepage into its source-ordered seasonal, new-book, and member-recommendation sections instead of substituting recommendation-metric toplists; its parsed “这本轻小说真厉害！” year link opens a typed read-only feature destination with separate 文库部门 and 单行本部门 sections. 分类 / 排行 / 完结 and bounded Tag filtering remain available.
- Wenku8 Detail emits a validated optional ISO source update date, and author search uses exact bounded GB18030 transport. Remote target discovery now has a separate signed request; ADD/REMOVE/MOVE parsers bind success to the exact book/target and reject ambiguous or fabricated evidence.
- The historical Apache development fixture at extraction was version `0.2.30`, SHA-256 `36db147337636ddc1b5bb00a979e42bb82e97f419ab374c6a5cb62ce852d6af6`; the independently regenerated AGPL development fixture has its own generated digest. Signed update-check capability requires Host API compatibility `[1.2.0, 2.0.0)`.
- Wenku8 now exports signed read-only `update-check-v2` request and parser operations. It emits exact complete source-order evidence only after closed canonical-directory admission, then emits chapter IDs/titles; baseline, appended, reordered, wrong-identity, challenge, truncated, paginated and partial-directory fixtures prove fail-closed parsing, while Android admission tests cover title correction.
- Fixed live Wenku8 update checks incorrectly rejecting complete dynamic directory pages because they lack a `#list` wrapper. Admit the canonical standalone `table.css` as well as the static directory, require a unique complete table, and continue rejecting ambiguous, wrong-book, paginated or truncated evidence. Sanitized live-shape regression excludes unrelated links and preserves exact chapter ordering.

## [0.1.0] - 2026-08-09

### Added

- Phase 0/1 extension development, security, packaging, and Wenku8 acceptance contracts. Runtime extension code starts in Phase 2.
