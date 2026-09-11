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

## Publication boundary

This source repository contains build inputs and offline signing tools only.
It contains no production signing key, released HXP asset, published catalog
index, catalog branch, or release claim. Producing or publishing a formal
package/catalog requires a separately supplied key and an explicit release
approval.
