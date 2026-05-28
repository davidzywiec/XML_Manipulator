export const PLACEHOLDER_PATTERN = /\$\{([A-Za-z0-9_]+)\}/g;

export function extractPlaceholders(xmlText: string): string[] {
  const placeholders = new Set<string>();
  for (const match of xmlText.matchAll(PLACEHOLDER_PATTERN)) {
    placeholders.add(match[1]);
  }
  return [...placeholders];
}

export function hasPlaceholder(text: string): boolean {
  PLACEHOLDER_PATTERN.lastIndex = 0;
  return PLACEHOLDER_PATTERN.test(text);
}
