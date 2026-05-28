export type ValidationLevel = 'error' | 'warning' | 'info';

export type ValidationMessage = {
  level: ValidationLevel;
  code: string;
  message: string;
  field?: string;
  rowNumber?: number;
};

export type MappingRow = {
  rowNumber: number;
  values: Record<string, string>;
};

export type ParsedMapping = {
  rows: MappingRow[];
  headers: string[];
  messages: ValidationMessage[];
};

export type AnalysisResult = {
  placeholders: string[];
  mappings: MappingRow[];
  unusedMappings: string[];
  messages: ValidationMessage[];
};
