// The normal JSX rule covers rendered text. This rule also catches common
// indirect UI messages without treating every server diagnostic as UI prose.
const messageProperties = new Set([
  "label",
  "title",
  "description",
  "message",
  "placeholder",
  "emptyText",
]);

function rawText(node) {
  if (node?.type === "Literal" && typeof node.value === "string") return node.value;
  if (node?.type === "TemplateLiteral")
    return node.quasis.map((part) => part.value.cooked ?? part.value.raw).join("");
  return "";
}

export default {
  meta: { name: "headplane-i18n" },
  rules: {
    "no-raw-messages": {
      meta: {
        type: "problem",
        schema: [],
        messages: {
          raw: "Translate user-visible messages or record an exact, justified exception.",
        },
      },
      create(context) {
        const report = (node) => {
          if (/[a-z]/i.test(rawText(node))) context.report({ node, messageId: "raw" });
        };
        return {
          Property(node) {
            if (
              !context.filename.replaceAll("\\", "/").includes("/app/server/") &&
              !node.computed &&
              messageProperties.has(node.key.name ?? node.key.value)
            )
              report(node.value);
          },
          NewExpression(node) {
            if (node.callee.type === "Identifier" && node.callee.name === "ActionError")
              report(node.arguments[0]);
          },
          CallExpression(node) {
            if (
              node.callee.type === "Identifier" &&
              ["toast", "data400", "data403", "data404"].includes(node.callee.name)
            )
              report(node.arguments[0]);
          },
        };
      },
    },
  },
};
