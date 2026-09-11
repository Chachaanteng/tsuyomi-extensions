<!-- SPDX-FileCopyrightText: 2026 Tsuyomi Contributors -->
<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Extraction provenance and license transition

This repository was extracted from the `tsuyomi-extensions/` subtree of
[`Xfire233/Tsuyomi`](https://github.com/Xfire233/Tsuyomi) at the protective
monorepo checkpoint `09e0cb7326b0310495083bc8eaf8b3a7e89e1420` (`2026-09-11T08:27:55+08:00`).

The extraction used Git's filtered-history operation; it did not rewrite the
monorepo:

```text
git -C <monorepo> subtree split --prefix=tsuyomi-extensions 09e0cb7
```

The resulting independent-history tip is
`b6cb6d33e67d7ab56b8af195ab294a75da0ac230`. Its tree
`34d662106a47d4bece6eb359864b78b581b96c16` is identical to the checkpoint's
`tsuyomi-extensions` tree. Imported commits, authorship, and messages remain in
this repository's history.

## License boundary

The independently maintained extension implementation, tests, and repository
packaging/catalog tooling are distributed as **AGPL-3.0-only** from this
transition onward. The Android host and platform-neutral protocol are not part
of this repository and remain Apache-2.0 in their own repositories.

The imported material was previously distributed under Apache-2.0. That grant
is not revoked or erased: its historical notices, commit provenance, and the
verbatim Apache-2.0 text remain available in this repository. `LICENSE` and
`LICENSES/AGPL-3.0-only.txt` state the current collective derivative license;
`LICENSES/Apache-2.0.txt` and `THIRD_PARTY_NOTICES.md` preserve the imported
Apache provenance and notice obligations. No custom license exception is
created by this transition.

## Vendored protocol schema

The production HXP packager validates its completed manifest against the verbatim Apache-2.0 `hxp-manifest-v1.schema.json` copied from `Xfire233/Tsuyomi` checkpoint `09e0cb7`, path `tsuyomi-protocol/schemas/hxp-manifest-v1.schema.json`. The source and vendored Git blob is `af1107f7987386c07ae9d4646a635f354cb50355`; its content SHA-256 is `1ff7d570d702229539317f54951ea53dfb7aa50a1c31d5f79287c967b47bbeb2`. The Apache-2.0 text and notice are retained; this is a pinned compatibility input, not a sibling-directory dependency or a protocol release claim.

## Publication boundary

This source repository contains build inputs, offline signing tools and an
activation-gated automated distribution workflow. No production key is stored
in source. Initial production-key configuration and first activation require
separate authorization. Once activated, maintainer-reviewed release changes
merged into protected main authorize routine automated publication without a
second per-release approval; catalog renewal is automatic. Corresponding
source is bound to the exact released commit and retains both current AGPL
and historical Apache notices. Workflow implementation alone is not evidence
that any signed catalog, catalog branch or formal HXP release is live.
