import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import Callout from "~/components/callout";
import { LocaleProvider } from "~/i18n/provider";

test("dismissible callout exposes the close action in the selected language", () => {
  const render = (locale: "en" | "zh-CN") =>
    renderToStaticMarkup(
      createElement(LocaleProvider, {
        locale,
        children: createElement(Callout, { isDismissable: true, children: "Message" }),
      }),
    );
  expect(render("zh-CN")).toContain('aria-label="关闭提示"');
  expect(render("en")).toContain('aria-label="Dismiss"');
});
