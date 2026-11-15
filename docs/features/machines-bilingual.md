---
title: Machines in the bilingual 0.8 release line
description: Manage devices in English or Simplified Chinese on the community-maintained 0.8 branch.
---

# Machines in the bilingual 0.8 release line

[简体中文](/zh-CN/features/machines-bilingual)

This guide applies to the unofficial `CM-Chenqf/headplane-zh-cn` fork of [tale/headplane](https://github.com/tale/headplane), on `release/0.8`. It describes the original 0.8 interface. Other business modules and the complete documentation are still being adapted; this is not a complete Chinese release. See [language and maintenance](/features/language).

## Choose a language

Use the language button in the dashboard header. The machine list, details, filters, menus, registration and management dialogs, validation messages, local action results, status badges and dates follow English or Simplified Chinese. Language changes keep the current URL, search query and filter values.

Device names, owners, ACL tags, IP addresses, domain names, keys, versions and reported operating-system names retain their original values. Commands and protocol names such as SSH, IPv4 and IPv6 remain unchanged. Missing machine information is shown as “Unknown” or “未知”.

## Find and inspect a machine

Open **Machines**. Search by device name or IP address, filter by user, tag, connection status or route type, and sort by name, address, version or last seen. Filters keep the original query identifiers, such as `online` and `exit-node`; their visible labels are translated. The version column is conditional on Agent availability, as in upstream 0.8.

Open a device name to inspect its owner, routing, identifiers, addresses, creation and expiry times. Agent information, when available, includes operating-system and Tailscale versions, endpoints and connectivity details. The language selection controls absolute and relative date formatting. The relative-time calculation retains the 0.8 minute, hour, day and 30-day-month thresholds.

Use the address menu to copy an IP address or MagicDNS name. Copy success and failure notices follow the interface language. MagicDNS names and copied values are not translated.

## Register a device

1. Select **Add Device → Register Machine Key**.
2. Run the command shown in the dialog on the device:

   ```bash
   tailscale up --login-server=<headscale-public-url>
   ```

3. Paste the registration URL or full `hskey-authreq-...` key printed by the command.
4. Select the owner and confirm registration.

The server URL comes from the existing Headscale configuration. The selected owner is sent as the original username, as required by the 0.8 registration API. An API key or pre-auth key is not a device registration key. Invalid input is rejected before registration.

**Generate Pre-auth Key** opens the existing Settings page. That module is outside this stage and may still display English.

## Manage a device

The row menu or **Machine Settings** contains the existing actions. Available controls continue to follow permissions, the device state and the connected Headscale version.

| Action                       | Behavior                                                                                                                                                                   |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Edit machine name            | Keep a valid DNS label, up to 63 characters, using letters, numbers and hyphens, starting and ending with a letter or number. MagicDNS notices explain which name changes. |
| Enable or disable key expiry | Shown only when the existing Headscale capability supports it. The success message describes the selected setting.                                                         |
| Edit route settings          | Approve or revoke advertised subnet routes and exit-node use. The device must advertise the routes first.                                                                  |
| Edit ACL tags                | Add or remove the original `tag:...` values. Undeclared `tagOwners` entries show a translated warning linking to Access Control.                                           |
| Change owner                 | Shown only on Headscale versions that support the existing owner-change API.                                                                                               |
| Expire                       | Disconnect the device until it authenticates again, using the original expiry operation.                                                                                   |
| Remove                       | Remove the device from the network after confirmation. Rejoining requires authentication on the device.                                                                    |

The ACL tag dialog does not flag all tags as undeclared when the policy cannot be read. A Headscale rejection retains HTTP status and original diagnostic details alongside the translated explanation. Original API errors remain available for troubleshooting.

The SSH entry keeps its original connection behavior. Browser SSH itself will be localized in a later stage. Language support does not grant access to operations that the current role cannot perform.

## Maintenance and publication

The completed machine sources and this English/Chinese document pair are included in the release line's translation checks. When upstream changes them, review the wording and actual behavior together before recording a new review fingerprint.

Run `pnpm i18n:check`, `pnpm test:unit`, `pnpm typecheck` and `pnpm docs:build`; route and action changes also require the existing integration tests. The root and `/0.8/` archived VitePress builds remain separate from `main`'s newer documentation toolchain.

The complete-release guard remains blocked while other modules and publication acceptance are pending. This stage does not publish a Docker image or deploy the documentation site. Existing screenshots remain upstream English-interface illustrations, not screenshots of this localized release.
