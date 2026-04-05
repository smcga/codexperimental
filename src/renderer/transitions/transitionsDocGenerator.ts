import { transitionDefinitions } from "./index";

export type TransitionDocItem = {
  key: string;
  label: string;
  visibleInEditor: boolean;
  hasMobileRenderer: boolean;
  hasStateBuilder: boolean;
};

export type GeneratedTransitionsDoc = {
  markdown: string;
  transitions: TransitionDocItem[];
};

const boolText = (value: boolean): string => (value ? "yes" : "no");

const transitionHeading = (key: string): string => `transition-${key.replaceAll(/[^a-zA-Z0-9]+/g, "-")}`;

export function getDocumentedTransitions(): TransitionDocItem[] {
  return transitionDefinitions.map((definition) => ({
    key: definition.key,
    label: definition.label,
    visibleInEditor: definition.visibleInValidator,
    hasMobileRenderer: typeof definition.drawMobile === "function",
    hasStateBuilder: typeof definition.createState === "function"
  }));
}

export function generateTransitionsDoc(): GeneratedTransitionsDoc {
  const transitions = getDocumentedTransitions();
  const lines: string[] = [];

  lines.push("# Transitions Reference", "");
  lines.push("Generated from `src/renderer/transitions/index.ts`.", "");
  lines.push(`Total transitions: **${transitions.length}**.`, "");

  lines.push("## Table of contents", "");
  for (const transition of transitions) {
    lines.push(`- [Transition: ${transition.key}](#${transitionHeading(transition.key)})`);
  }
  lines.push("");

  lines.push("## Transition matrix", "");
  lines.push("| Key | Label | Visible in editor/debug selectors | Mobile renderer | State builder |", "| --- | --- | --- | --- | --- |");
  for (const transition of transitions) {
    lines.push(
      `| \`${transition.key}\` | ${transition.label} | ${boolText(transition.visibleInEditor)} | ${boolText(transition.hasMobileRenderer)} | ${boolText(transition.hasStateBuilder)} |`
    );
  }
  lines.push("");

  lines.push("## Transitions", "");
  for (const transition of transitions) {
    lines.push(`### Transition: ${transition.key}`, "");
    lines.push(`- **Label:** ${transition.label}`);
    lines.push(`- **Visible in editor/debug selectors:** ${boolText(transition.visibleInEditor)}`);
    lines.push(`- **Has mobile renderer:** ${boolText(transition.hasMobileRenderer)}`);
    lines.push(`- **Has state builder:** ${boolText(transition.hasStateBuilder)}`);
    lines.push("");
  }

  return {
    markdown: lines.join("\n"),
    transitions
  };
}
