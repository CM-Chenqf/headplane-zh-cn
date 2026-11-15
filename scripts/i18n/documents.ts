import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function readDocumentSource(root: string, path: string) {
  const text = readFileSync(resolve(root, path), "utf8");
  // Git materializes this upstream symlink as target text with core.symlinks=false.
  // Review its rendered source on both platforms, without changing the symlink.
  if (path === "docs/CHANGELOG.md" && text.trim() === "./../CHANGELOG.md")
    return readFileSync(resolve(root, "CHANGELOG.md"), "utf8");
  return text;
}
