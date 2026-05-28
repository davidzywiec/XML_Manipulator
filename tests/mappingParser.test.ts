import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { parseCsvMapping, parseExcelMapping } from '../src/server/services/mappingParser';

describe('parseCsvMapping', () => {
  it('parses pipe-delimited row mappings with placeholder headers', () => {
    const parsed = parseCsvMapping('${code}|${name}\na|Alpha\nb|Beta');
    expect(parsed.headers).toEqual(['code', 'name']);
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0].values).toEqual({ code: 'a', name: 'Alpha' });
  });

  it('handles quoted commas and line breaks in CSV values', () => {
    const parsed = parseCsvMapping('variable_name,value\nname,"Alpha, Beta"\ndescription,"Line 1\nLine 2"');
    expect(parsed.rows[0].values).toEqual({
      name: 'Alpha, Beta',
      description: 'Line 1\nLine 2',
    });
  });

  it('warns for empty replacement values', () => {
    const parsed = parseCsvMapping('variable_name,value\nname,');
    expect(parsed.messages).toContainEqual(
      expect.objectContaining({ level: 'warning', code: 'EMPTY_VALUE', field: 'name' }),
    );
  });

  it('flags duplicate variable rows with different values', () => {
    const parsed = parseCsvMapping('variable_name,value\nname,Alpha\nname,Beta');
    expect(parsed.messages).toContainEqual(
      expect.objectContaining({ level: 'error', code: 'DUPLICATE_MAPPING', field: 'name' }),
    );
  });
});

describe('parseExcelMapping', () => {
  it('parses xlsx mappings', async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Mappings');
    worksheet.addRows([
      ['variable_name', 'value'],
      ['code', 'abc'],
      ['name', 'Alpha'],
    ]);
    const data = await workbook.xlsx.writeBuffer();

    const parsed = await parseExcelMapping(data);
    expect(parsed.rows[0].values).toEqual({ code: 'abc', name: 'Alpha' });
  });
});
