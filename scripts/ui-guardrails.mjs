/** Theme switches must repaint immediately; only geometric transitions are allowed. */
export function hasThemeColorTransition(source) {
  return /\btransition-(?:all|colors)\b|(?<![\w-])transition(?=[\s"'`])|\btransition(?:-property)?\s*:\s*(?:all\b|color\b|background\b|border\b|box-shadow\b|fill\b|stroke\b|\d)/.test(
    source,
  );
}
