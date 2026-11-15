# DNS on the 0.8 release line

Use the language control to switch between English and Simplified Chinese. The DNS page includes the tailnet base domain, nameservers, split DNS, DNS records, search domains and Magic DNS. Existing values and configuration keys are not translated.

## Requirements

Reading requires a readable Headscale configuration and the original network-read permission. Changes require a writable configuration and network-write permission. Keep the [Docker](/install/docker#network-management) or [native integration](/install/native-mode#network-management) configuration for this release line. A read-only or restricted page remains non-editable.

## Names and records

Renaming the tailnet can interrupt existing device access. A nameserver accepts an IPv4 or IPv6 address; split DNS additionally uses the configured domain suffix. Duplicate nameserver and record notices follow the interface language without discarding an open form. DNS records keep the original A/AAAA types and IP values; use a valid address for the selected type. External record files still follow the original mounted paths and restart behavior.

## Search domains and Magic DNS

The tailnet domain appears first when Magic DNS is enabled. This old release's search-domain drag preview changes the local order only; it does not persist a reordered list to Headscale. Adding or removing a domain still submits the original action. The language adaptation does not add a new reorder API.

## Applying changes

Changes use the existing Headscale configuration and integration hooks. The 0.8 release line does not gain main's newer restart workflow or DNS validation rules. Check the Headscale service after making changes. English and Chinese send the same action IDs, domain names, IP addresses and record types.
