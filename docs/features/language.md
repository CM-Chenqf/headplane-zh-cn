# Language and release-line maintenance

[简体中文](/zh-CN/features/language)

This page describes the community-maintained `CM-Chenqf/headplane-zh-cn` fork's **0.8 release line**, based on [tale/headplane](https://github.com/tale/headplane) 0.8.2. It is not an official Chinese release of Headplane, Headscale, or Tailscale. The upstream MIT license and original copyright notices are retained. This line keeps its original interface, VitePress documentation, configuration, permissions and compatibility requirements. It does not include the newer interface or features from `main`.

## Current scope

Language preferences, API-key sign-in and its errors, SSO configuration and sign-in notices, sign-out, shared navigation, theme labels, connection banners, copy controls, dialog buttons and shared error explanations support English and Simplified Chinese.

[Machines](/features/machines-bilingual) also supports bilingual lists, details, filters, management dialogs, validation and action results, badges and dates. Device values, commands, permissions and Headscale capability checks retain the original behavior.

[Users, roles and account linking](/features/users-bilingual) also supports bilingual account lists, creation and management dialogs, policy groups, ownership transfer, the home-page account picker and member downloads. Local form errors follow the selected language while keeping drafts; original identifiers, permissions and API diagnostics are preserved.

[Access Control and policy editors](/features/acls) now also support bilingual rules, SSH rules, hosts, tags and groups, notices, parse explanations and editor controls. Drafts and original policy values are preserved when switching languages.

[DNS](/features/dns), [Settings](/features/settings) and [Browser SSH](/features/ssh) now also support both languages. Every VitePress page has a Chinese counterpart, including installation, configuration, SSO, NixOS options, architecture and the complete historical changelog. Navigation, local search and language switching work at the root and under /0.8/. Translation coverage is complete; Docker runtime and publication acceptance are still pending. This development branch is not a published bilingual release.

## Choose the interface language

Use the language button in the sign-in, signed-out or dashboard header. A first visit follows `Accept-Language`; supported choices are English and Simplified Chinese. Other Chinese language variants use Simplified Chinese, and unsupported languages fall back to English.

The `headplane_locale` browser cookie saves the selection for one year. Clearing it restores browser-language detection. The preference applies before and after sign-in. It does not change the account, authentication cookie, role, Headscale configuration, other browsers or the return URL. The language endpoint accepts only a single supported locale over POST and does not accept redirect destinations.

Commands, API fields, configuration keys, product names, user-provided values and original server diagnostics retain their spelling. Chinese error explanations keep the original diagnostic data visible. Application documentation buttons continue to open the upstream English site until the maintained site is deployed. The complete translated sources can be built locally or downloaded from Actions artifacts.

## Check and review changes

Run the release line's checks with its own Node and pnpm requirements:

```bash
pnpm i18n:check
pnpm test:unit
pnpm typecheck
pnpm docs:build
```

`i18n:check` validates only the completed files and document pairs listed in `.github/i18n/scope.json`. It also checks the actual message catalogs, placeholders, hardcoded messages and per-entry review fingerprints. Static checks are accompanied by full source/document coverage and browser review. They do **not** approve Docker runtime or publication acceptance, which are printed separately as pending.

Review changed English and Chinese together, format first, then record only reviewed entries:

```bash
pnpm i18n:review --message login.welcome
pnpm i18n:review --file docs/features/language.md
pnpm i18n:review --file app/layout/header.tsx
pnpm i18n:check
```

Options can be repeated. Document pairs use the English path. The check never updates records; reviewing one entry does not approve others. Technical exceptions require an exact key or file and code text plus a reason. The initial `--initialize` option refuses to overwrite an existing baseline.

Static scanning cannot prove translation quality or trace every dynamic message, third-party component or remote terminal output. Check both language flows and review the actual upstream diff. Keep maintenance work on `stable` separate from `main`; merge upstream release-line updates and adapt translations to this line's behavior.

## Publication status

Container CI has passed, but first-release acceptance remains incomplete, so `pnpm i18n:release` currently fails. The tag-triggered release workflow also checks this status before publishing. Do not clear the pending list or mark the scope complete merely to pass a build.

Release documentation builds keep the upstream root and `/0.8/` archive formats. Branch builds only save temporary Actions artifacts. Formal releases attach bilingual snapshots after acceptance; a docs-only push does not create a release or overwrite earlier attachments. Read the source, run `pnpm docs:dev` locally, or download the matching Release snapshot and serve it over HTTP. No hosted documentation site or hosting credentials are required.

## Fixed maintenance branches and release history

The community fork uses two permanent branches: `main` follows upstream development, and `stable` follows the newest published upstream stable tag. A new upstream version upgrades `stable`; it does not need a new branch. Compatibility and build tools follow the corresponding upstream version.

Community releases use tags such as `v0.8.2-zh.1`. Each published revision retains its source, English/Chinese documentation snapshots, both multi-architecture image digests and checksums in GitHub Releases. Full image tags match the GitHub Release tag; tags such as `v0.8.2-zh.1` and `v0.8.2-zh.1-shell` are never reused; `latest`, `0.8` and their shell aliases may move. Documentation corrections require a new community revision, preserving earlier attachments. Temporary PR branches are removed after merge.

This is an unofficial community fork, not an official Chinese edition. The upstream MIT license and attribution remain intact. See `.github/FORK_SETUP.zh-CN.md` for acceptance gates and the release procedure.
