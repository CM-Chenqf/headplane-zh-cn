import { createCookie } from "react-router";

import { isLocale, type Locale, negotiateLocale } from "./locale";

const localeCookie = createCookie("headplane_locale", {
  httpOnly: true,
  maxAge: 365 * 24 * 60 * 60,
  path: "/",
  sameSite: "lax",
});

export async function getLocale(request: Request): Promise<Locale> {
  try {
    const saved: unknown = await localeCookie.parse(request.headers.get("Cookie"));
    if (isLocale(saved)) return saved;
  } catch {
    // A damaged preference cookie must never prevent signing in.
  }
  return negotiateLocale(request.headers.get("Accept-Language"));
}

export function setLocale(locale: Locale) {
  return localeCookie.serialize(locale);
}
