<!-- SPDX-FileCopyrightText: 2026 Tsuyomi Contributors -->
<!-- SPDX-License-Identifier: AGPL-3.0-only -->

# Contributing

- Extensions are TypeScript ES modules packaged as signed `.hxp` archives; APK-based extensions are out of scope.
- Add every domain, cookie scope, controlled WebView request, and storage requirement to the manifest.
- Do not automate CAPTCHA, Cloudflare, or anti-bot verification. The host may only let the user complete these flows in a controlled WebView.
- Use sanitized fixtures, never credentials, cookies, copyrighted chapter payloads, or live-site CI dependencies.
- Record every third-party adoption in `THIRD_PARTY_NOTICES.md`.
- Use SemVer and update `CHANGELOG.md`; every package/tool change records the compatible protocol version and deterministic artifact digest.
- Dependency changes must update lock state, `THIRD_PARTY_NOTICES.md`, REUSE metadata, and package verification evidence together.
- Bind each package to an explicit reviewed Host API/protocol revision; never test against an unpinned sibling checkout or `latest` contract.
- Run `npm ci` and `npm test`. Contributor CI also regenerates the AGPL test fixture automatically; do not commit regenerated fixture binaries or SHA files just to satisfy CI, and never alter the pinned historical host replay fixture. The fixture's public key is test-only and production tools reject it.
- `npm run release:prepare -- --revision <40-lowercase-hex-commit> --output <release-input.json>` builds an unsigned, data-only release input from reviewed sources and compiled files. It does not sign, package, publish, or authorize a release; the protected publisher workflow alone supplies production keys. A manually imported local HXP must be made with `package:hxp` and an explicit non-fixture custodian key, and is not a published release.
