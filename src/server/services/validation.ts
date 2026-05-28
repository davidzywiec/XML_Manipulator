import type { AnalysisResult, MappingRow, ValidationMessage } from '../../shared/types';
import { extractPlaceholders } from './xmlPlaceholderScanner';

export function analyzeXmlAndMappings(
  xmlText: string,
  mappings: MappingRow[],
  parserMessages: ValidationMessage[] = [],
): AnalysisResult {
  const messages = [...parserMessages];

  if (!xmlText.trim()) {
    messages.push({
      level: 'error',
      code: 'EMPTY_XML',
      message: 'XML input is empty.',
    });
  }

  const placeholders = extractPlaceholders(xmlText);
  const mappingKeys = new Set(mappings.flatMap((row) => Object.keys(row.values)));

  placeholders.forEach((placeholder) => {
    const hasEveryRowMapped = mappings.length > 0 && mappings.every((row) => placeholder in row.values);
    if (!hasEveryRowMapped) {
      messages.push({
        level: 'error',
        code: 'MISSING_MAPPING',
        message: `No mapping value was found for "${placeholder}".`,
        field: placeholder,
      });
    }
  });

  const unusedMappings = [...mappingKeys].filter((key) => !placeholders.includes(key));
  unusedMappings.forEach((key) => {
    messages.push({
      level: 'info',
      code: 'UNUSED_MAPPING',
      message: `Mapping "${key}" is not used in the XML template.`,
      field: key,
    });
  });

  return { placeholders, mappings, unusedMappings, messages };
}

export function hasBlockingErrors(messages: ValidationMessage[]): boolean {
  return messages.some((message) => message.level === 'error');
}
