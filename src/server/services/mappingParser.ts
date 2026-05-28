import Papa from 'papaparse';
import type { MappingRow, ParsedMapping, ValidationMessage } from '../../shared/types';

const VARIABLE_COLUMN_ALIASES = new Set(['variable_name', 'variable', 'name', 'key', 'placeholder']);
const VALUE_COLUMN_ALIASES = new Set(['value']);

function normalizeHeader(header: string): string {
  const trimmed = header.trim();
  const placeholderMatch = /^\$\{([A-Za-z0-9_]+)\}$/.exec(trimmed);
  return placeholderMatch?.[1] ?? trimmed;
}

function isVariableValueShape(headers: string[]): boolean {
  const normalized = headers.map((header) => header.trim().toLowerCase());
  return (
    normalized.some((header) => VARIABLE_COLUMN_ALIASES.has(header)) &&
    normalized.some((header) => VALUE_COLUMN_ALIASES.has(header))
  );
}

function getAliasHeader(headers: string[], aliases: Set<string>): string | undefined {
  return headers.find((header) => aliases.has(header.trim().toLowerCase()));
}

function parseTable(headers: string[], records: Record<string, unknown>[]): ParsedMapping {
  const messages: ValidationMessage[] = [];
  const trimmedHeaders = headers.map((header) => header.trim()).filter(Boolean);

  if (trimmedHeaders.length === 0) {
    return {
      rows: [],
      headers: [],
      messages: [
        {
          level: 'error',
          code: 'NO_USABLE_HEADERS',
          message: 'The mapping file does not contain usable headers.',
        },
      ],
    };
  }

  if (isVariableValueShape(trimmedHeaders)) {
    const variableHeader = getAliasHeader(trimmedHeaders, VARIABLE_COLUMN_ALIASES);
    const valueHeader = getAliasHeader(trimmedHeaders, VALUE_COLUMN_ALIASES);
    const values: Record<string, string> = {};
    const seen = new Map<string, string>();

    records.forEach((record, index) => {
      const rowNumber = index + 2;
      const variableName = String(record[variableHeader ?? ''] ?? '').trim();
      const value = String(record[valueHeader ?? ''] ?? '');

      if (!variableName) {
        messages.push({
          level: 'error',
          code: 'MISSING_VARIABLE_NAME',
          message: 'A mapping row is missing a variable name.',
          rowNumber,
          field: variableHeader,
        });
        return;
      }

      if (seen.has(variableName) && seen.get(variableName) !== value) {
        messages.push({
          level: 'error',
          code: 'DUPLICATE_MAPPING',
          message: `Variable "${variableName}" is mapped to multiple different values.`,
          rowNumber,
          field: variableName,
        });
      }

      if (value === '') {
        messages.push({
          level: 'warning',
          code: 'EMPTY_VALUE',
          message: `Variable "${variableName}" has an empty replacement value.`,
          rowNumber,
          field: variableName,
        });
      }

      seen.set(variableName, value);
      values[normalizeHeader(variableName)] = value;
    });

    return {
      headers: [...Object.keys(values)],
      rows: Object.keys(values).length ? [{ rowNumber: 2, values }] : [],
      messages,
    };
  }

  const normalizedHeaders = trimmedHeaders.map(normalizeHeader);
  const rows: MappingRow[] = records.map((record, index) => {
    const values: Record<string, string> = {};
    trimmedHeaders.forEach((header, headerIndex) => {
      values[normalizedHeaders[headerIndex]] = String(record[header] ?? '');
    });
    return { rowNumber: index + 2, values };
  });

  rows.forEach((row) => {
    normalizedHeaders.forEach((header) => {
      if (!header) {
        messages.push({
          level: 'error',
          code: 'MISSING_VARIABLE_NAME',
          message: 'A mapping column is missing a variable name.',
          rowNumber: row.rowNumber,
        });
      }
      if (row.values[header] === '') {
        messages.push({
          level: 'warning',
          code: 'EMPTY_VALUE',
          message: `Variable "${header}" has an empty replacement value.`,
          rowNumber: row.rowNumber,
          field: header,
        });
      }
    });
  });

  return { rows, headers: normalizedHeaders, messages };
}

function guessDelimiter(csvText: string): string {
  const firstLine = csvText.split(/\r?\n/, 1)[0] ?? '';
  const pipeCount = (firstLine.match(/\|/g) ?? []).length;
  const commaCount = (firstLine.match(/,/g) ?? []).length;
  return pipeCount > commaCount ? '|' : ',';
}

export function parseCsvMapping(csvText: string): ParsedMapping {
  if (!csvText.trim()) {
    return {
      rows: [],
      headers: [],
      messages: [{ level: 'error', code: 'EMPTY_FILE', message: 'The CSV file is empty.' }],
    };
  }

  const result = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: true,
    delimiter: guessDelimiter(csvText),
  });

  const messages: ValidationMessage[] = result.errors.map((error) => ({
    level: 'error',
    code: 'CSV_PARSE_ERROR',
    message: error.message,
    rowNumber: typeof error.row === 'number' ? error.row + 1 : undefined,
  }));

  const fields = result.meta.fields ?? [];
  const parsed = parseTable(fields, result.data);
  return { ...parsed, messages: [...messages, ...parsed.messages] };
}

export async function parseExcelMapping(workbookData: ArrayBuffer): Promise<ParsedMapping> {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.default.Workbook();
  await workbook.xlsx.load(workbookData);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return {
      rows: [],
      headers: [],
      messages: [
        {
          level: 'error',
          code: 'NO_USABLE_WORKSHEET',
          message: 'The Excel file does not contain a usable worksheet.',
        },
      ],
    };
  }

  const firstRow = worksheet.getRow(1);
  const headers = Array.from({ length: firstRow.cellCount }, (_, index) =>
    String(firstRow.getCell(index + 1).value ?? ''),
  );

  const records: Record<string, unknown>[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      record[header] = row.getCell(index + 1).text;
    });
    const hasAnyValue = Object.values(record).some((value) => String(value).length > 0);
    if (hasAnyValue) {
      records.push(record);
    }
  });

  return parseTable(headers, records);
}
