# Users, roles and account linking

[简体中文](/zh-CN/features/users-bilingual)

This guide covers the **0.8 release line** of the community-maintained `CM-Chenqf/headplane-zh-cn` fork, based on [tale/headplane](https://github.com/tale/headplane). This is not an official Chinese release of Headplane, Headscale or Tailscale. The upstream MIT license and copyright notices are retained. Localization of other modules and publication acceptance are still in progress; see [language and maintenance](/features/language).

## Two kinds of user

**Headplane accounts** are local sign-in identities with roles and an optional linked Headscale user. **Headscale users** own devices and are returned by the Headscale API. Creating a Headscale user does not create a Headplane login identity or grant a role.

The Users page lists Headplane accounts first, including role, last login, linked identity, device status and policy groups. Headscale users not linked to a local account appear separately. If Headscale is unavailable, an error appears while local Headplane accounts remain visible; device information and the unlinked list are unavailable.

Names, email addresses, identifiers, group names and raw API diagnostics retain their original values in both languages. Dates use the selected interface language. API-key sessions retain their upstream permission behavior.

## Create, rename and delete

1. Open **Users** with an account allowed to manage users and choose **Add user**.
2. Enter a username and optionally a display name and email address. Usernames require at least two characters, begin with a Unicode letter and allow letters, decimal digits, dots, hyphens and underscores. At most one `@` is allowed and it cannot be the final character. Chinese letters are supported by the existing rule.
3. Confirm to create the Headscale user. The user remains in the unlinked list until linked to a Headplane account. Automatic matching depends on the original authentication configuration and matching identity information; account creation alone does not guarantee a match.

The menu for an unlinked Headscale user offers rename and delete when permitted. OIDC-managed Headscale users cannot be renamed here. Renaming does not update ACL policy references to the old username; review those references separately.

Delete or reassign every owned device before deleting a user. Deletion cannot be undone. Deleting a linked Headscale user removes the association from local Headplane accounts but does not delete those login accounts. An externally authenticated user can be recreated by the identity provider on a later sign-in. Self-deletion is not offered in the account menu.

## Roles and ownership

Role names are translated for display; the stored role identifiers and capabilities are unchanged. The following table describes the original 0.8 capability definitions, rather than the roles of the hosted Tailscale service.

<div class="users-role-table" role="region" aria-label="Role capability comparison" tabindex="0">

| Role identifier | Console | Device / user writes | Policy / network writes | Other capabilities                                                                        |
| --------------- | ------- | -------------------- | ----------------------- | ----------------------------------------------------------------------------------------- |
| `owner`         | Yes     | Yes                  | Yes                     | Full administration and ownership transfer                                                |
| `admin`         | Yes     | Yes                  | Yes                     | Full administration except ownership transfer                                             |
| `network_admin` | Yes     | No                   | Yes                     | Reads devices/users/features, generates auth keys, uses tags and manages tailnet settings |
| `it_admin`      | Yes     | Yes                  | No                      | Reads policy/network, manages features and IAM, generates auth keys                       |
| `auditor`       | Yes     | No                   | No                      | Reads policy/network/features/devices/users; generates own auth keys                      |
| `viewer`        | Yes     | No                   | No                      | Reads devices/users; generates own auth keys                                              |
| `member`        | No      | No                   | No                      | Member download page after authentication                                                 |

</div>

<style scoped>
.users-role-table { overflow-x: auto; }
.users-role-table :deep(table) { min-width: 44rem; }
</style>

The role action is disabled for an unlinked account. Opening the owner's role dialog shows a notice instead of the role selector. Only the current owner can transfer ownership to another account. Transfer promotes the selected account to owner and demotes the current owner to admin; treat it as a consequential operation.

## Link accounts

An administrator can select **Link Headscale user** or **Change linked user** from a Headplane account menu. Choices include unclaimed Headscale users and that account's current association; users claimed by other accounts are excluded. A concurrent claim returns a conflict instead of taking over another account's association.

For self-service linking, the 0.8 entry point is the **home page after sign-in**, not a separate `/link` route. If automatic matching fails and unclaimed users exist, the home page asks for a Headscale user and submits the selection before returning home. Select only the identity belonging to the signed-in person. The picker has no skip button. If the expected identity is absent, contact an administrator and review matching email addresses in Headscale and SSO.

## Edit policy groups

The group action requires both user-management and policy-write capabilities and a writable policy. File-backed or unreadable policy hides the action. Choose existing suggestions or enter a valid `group:` name. Removing a token changes membership for this user; it does not rename the group or change user identifiers.

Groups are stored in the ACL policy's `groups` section. **Saving rewrites the policy and removes HuJSON comments.** Keep a backup and review the warning before confirming. A read-only response explains the existing requirement to use `policy.mode: database` in Headscale. Group names and original parser/API diagnostic details remain readable. This stage does not translate the separate Access Control editor.

## Members without console access

After authentication, a linked account without console access sees a page with its linked Headscale username, the Linux installation command and Tailscale downloads for Windows, macOS, iOS and Android. An unlinked account may see a prompt to ask an administrator, according to the original OIDC configuration. Console access still requires an appropriate role.

The 0.8 page provides downloads and installation guidance. It does not generate a deployment-specific `tailscale up` command; follow the deployment's existing Headscale connection instructions. Download URLs, platform/version labels and the Linux command are unchanged. Upstream screenshots elsewhere in these docs remain English examples until the documentation stage is complete.

## Verification and maintenance

Check both languages, invalid usernames and emails, required selections, role restrictions, claimed-user filtering and comment warnings. Switching language updates local validation messages without replacing form drafts. The API integration suite runs the user actions against this release line's existing Headscale version matrix; it uses real Headscale and real in-memory authentication data.

Run `pnpm i18n:check`, `pnpm test:unit`, `pnpm typecheck`, `pnpm lint` and `pnpm docs:build`. Integration tests require the project's Docker environment. Root and `/0.8/` documentation archives are checked separately. Passing this module's checks does not approve a complete localization release, Docker publication.
