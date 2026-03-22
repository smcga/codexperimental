import { bitplaneWipeTransition } from "./bitplaneWipeTransition";
import { cameraPunchThroughTransition } from "./cameraPunchThroughTransition";
import { fadeTransition } from "./fade";
import { flashTransition } from "./flash";
import { irisTransition } from "./iris";
import { shatterTransition } from "./shatterTransition";
import { signalCollapseTransition } from "./signalCollapse";
import { slideDownTransition } from "./slideDown";
import { slideLeftTransition } from "./slideLeft";
import { slideRightTransition } from "./slideRight";
import { slideUpTransition } from "./slideUp";
import { wipeTransition } from "./wipe";

export type { MobileTransitionDrawContext, TransitionDefinition, TransitionDrawContext, TransitionRendererApi } from "./types";

export const transitionDefinitions = [
  fadeTransition,
  wipeTransition,
  slideLeftTransition,
  slideRightTransition,
  slideUpTransition,
  slideDownTransition,
  irisTransition,
  flashTransition,
  shatterTransition,
  signalCollapseTransition,
  cameraPunchThroughTransition,
  bitplaneWipeTransition
] as const;

export type TransitionType = (typeof transitionDefinitions)[number]["key"];

export const transitionKeys: TransitionType[] = transitionDefinitions.map((definition) => definition.key);

export const transitionRegistry: Readonly<Record<TransitionType, (typeof transitionDefinitions)[number]>> = Object.freeze(
  Object.fromEntries(transitionDefinitions.map((definition) => [definition.key, definition])) as Record<
    TransitionType,
    (typeof transitionDefinitions)[number]
  >
);

export const transitionOptions = transitionDefinitions
  .filter((definition) => definition.visibleInValidator)
  .map((definition) => ({ value: definition.key, label: definition.label }));

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function buildTransitionOptionMarkup(options?: { includeAuto?: boolean; autoLabel?: string }): string {
  const includeAuto = options?.includeAuto ?? false;
  const autoLabel = options?.autoLabel ?? "Auto";
  const markup = transitionOptions.map(
    (option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`
  );
  if (includeAuto) {
    markup.unshift(`<option value="auto">${escapeHtml(autoLabel)}</option>`);
  }
  return markup.join("");
}
