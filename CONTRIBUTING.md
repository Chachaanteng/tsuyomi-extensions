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
- Run `npm test` and `npm run package:fixture`; built production `.hxp`, private keys, live cookies, dumps, and unknown root files are forbidden. The fixture's public key is test-only and production tools reject it.
