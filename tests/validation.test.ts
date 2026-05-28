import { describe, expect, it } from 'vitest';
import { analyzeXmlAndMappings } from '../src/server/services/validation';

describe('analyzeXmlAndMappings', () => {
  it('detects missing mappings', () => {
    const result = analyzeXmlAndMappings('<x>${name}${code}</x>', [
      { rowNumber: 2, values: { name: 'Alpha' } },
    ]);
    expect(result.messages).toContainEqual(
      expect.objectContaining({ level: 'error', code: 'MISSING_MAPPING', field: 'code' }),
    );
  });

  it('detects unused mappings without failing', () => {
    const result = analyzeXmlAndMappings('<x>${name}</x>', [
      { rowNumber: 2, values: { name: 'Alpha', unused: 'ignored' } },
    ]);
    expect(result.unusedMappings).toEqual(['unused']);
    expect(result.messages).toContainEqual(
      expect.objectContaining({ level: 'info', code: 'UNUSED_MAPPING', field: 'unused' }),
    );
  });
});
