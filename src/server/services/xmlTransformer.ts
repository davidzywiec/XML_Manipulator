import type { MappingRow } from '../../shared/types';
import { PLACEHOLDER_PATTERN } from './xmlPlaceholderScanner';

export function escapeXmlValue(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function replaceXmlVariables(
  xmlText: string,
  values: Record<string, string>,
  escapeValues = true,
): string {
  return xmlText.replace(PLACEHOLDER_PATTERN, (placeholder, variableName: string) => {
    if (!(variableName in values)) {
      return placeholder;
    }
    const value = values[variableName] ?? '';
    return escapeValues ? escapeXmlValue(value) : value;
  });
}

export function createXmlEntries(
  xmlTemplate: string,
  rows: MappingRow[],
  escapeValues = true,
): string {
  return rows.map((row) => replaceXmlVariables(xmlTemplate, row.values, escapeValues)).join('\n');
}
