import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { expect, test } from "vitest";

import { useDocsDestination } from "../../../docs/app/lib/use-locale";

function DestinationLink() {
  return createElement("a", { href: useDocsDestination() }, "Read");
}

function initialLink(path: string) {
  return renderToString(
    createElement(MemoryRouter, { initialEntries: [path] }, createElement(DestinationLink)),
  );
}

test("static navigation links match the first hydrated render before applying the visitor's query and section", () => {
  const prerendered = initialLink("/zh-CN/features/ssh/");
  const visitor = initialLink("/zh-CN/features/ssh?from=upgrade#requirements");
  expect(visitor).toBe(prerendered);
  expect(visitor).toContain('href="/zh-CN/features/ssh"');
  expect(initialLink("/?from=upgrade#intro")).toBe(initialLink("/"));
});
