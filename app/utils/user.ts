import { defaultLocale, type Locale } from "~/i18n/locale";
import { translate } from "~/i18n/messages";
import type { User } from "~/types/User";

export function getUserDisplayName(user: User, locale: Locale = defaultLocale): string {
  if (user.name === "tagged-devices") {
    return translate(locale, "machines.tagOwned");
  }

  return user.name || user.displayName || user.email || user.id;
}

export function sortUsersByDisplayName(users: User[]): User[] {
  return users.toSorted((a, b) => getUserDisplayName(a).localeCompare(getUserDisplayName(b)));
}

// Mirrors Headscale's `util.ValidateUsername` (hscontrol/util/dns.go): a name has
// to start with a letter and may only contain letters, numbers, `-`, `.`, `_` and
// at most one `@` (`\p{L}`/`\p{Nd}` match Go's `unicode.IsLetter`/`IsDigit`).
// The trailing `@` is ours: Headscale strips it when resolving a
// username in an ACL policy, so a user whose name ends in `@` is created fine but
// can never be matched by a rule.
export const USERNAME_PATTERN = String.raw`\p{L}[\p{L}\p{Nd}._\-]*(@[\p{L}\p{Nd}._\-]+)?`;

export const USERNAME_RULE = translate("en", "users.validation.usernameRule");

const usernameRegex = new RegExp(`^${USERNAME_PATTERN}$`, "u");

// Returns an error message when the username is not usable in Headscale.
export function validateUsername(name: string, locale: Locale = defaultLocale): string | undefined {
  if (name.length < 2 || !usernameRegex.test(name)) {
    return translate(locale, "users.validation.usernameRule");
  }
}
