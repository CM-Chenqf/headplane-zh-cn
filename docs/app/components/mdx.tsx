import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";

import Architecture from "@/components/architecture";
import { CalloutContainer, CalloutDescription, CalloutTitle } from "@/components/callout";
import DynamicCodeBlock from "@/components/dynamic-code-block";
import Figure from "@/components/figure";
import { Reference, Release, ReleaseList, ReleaseSection } from "@/components/release";
import { useDocsLocale } from "@/lib/use-locale";

export function useMDXComponents(components?: MDXComponents) {
  const { href } = useDocsLocale();
  const Anchor = defaultMdxComponents.a;
  return {
    ...defaultMdxComponents,
    a: (props) => <Anchor {...props} href={props.href ? href(props.href) : props.href} />,
    pre: (props) => (
      <CodeBlock {...props} className="border-line bg-subtle my-5 rounded-lg">
        <Pre>{props.children}</Pre>
      </CodeBlock>
    ),
    Architecture,
    CalloutContainer,
    CalloutTitle,
    CalloutDescription,
    DynamicCodeBlock,
    Figure,
    Release,
    ReleaseList,
    ReleaseSection,
    Reference,
    ...components,
  } satisfies MDXComponents;
}

declare global {
  type MDXProvidedComponents = ReturnType<typeof useMDXComponents>;
}
