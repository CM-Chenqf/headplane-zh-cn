# Settings on the 0.8 release line

Settings, pre-auth keys, authentication restrictions and the Headplane Agent support English and Simplified Chinese. The original permissions, filters, version capabilities and request fields remain unchanged.

## Pre-auth keys

Create keys for a Headscale user, or use the original tag-only option where supported. A self-service account is limited to its own user. Keep tag names, the tag: prefix, usernames and generated commands unchanged. Copy a newly created secret immediately; the dialog is not a promise that it can be recovered later.

Expiry is entered in days (1–365,000); the hidden form field submits a raw integer, regardless of locale grouping separators. Reusable and ephemeral are independent options. Expiring a key prevents future device authentication and cannot be undone. Used, expired, active and tag-only filters follow the old release's behavior.

## Authentication restrictions

OIDC restrictions use permitted email domains, groups and users. An empty list permits all values of that type. Existing read/configure-IAM permissions and configuration writability still apply. Original identities and domain suffixes are preserved, and local validation errors switch language while keeping the draft. See [SSO](/features/sso) and [proxy authentication](/features/proxy-auth).

## Headplane Agent

The [Agent](/features/agent) still requires Headscale 0.28+ and headscale.api_key. The page translates disabled, pending approval, healthy, sync time/count and error states. Known diagnostics receive a Chinese explanation; unknown errors and original details remain visible. Changing language does not trigger a sync.
