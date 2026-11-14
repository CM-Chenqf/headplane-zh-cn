import { data } from "react-router";

import { isLocale } from "~/i18n/locale";
import { setLocale } from "~/i18n/locale.server";

import type { Route } from "./+types/locale";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    throw data("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
  }
  const form = await request.formData();
  const locale = form.get("locale");
  if (form.getAll("locale").length !== 1 || !isLocale(locale)) {
    throw data("Bad Request", { status: 400 });
  }

  // A fetcher revalidates the root loader without navigating away or touching
  // authentication. No caller-supplied redirect destination is accepted.
  return data({ locale }, { headers: { "Set-Cookie": await setLocale(locale) } });
}
