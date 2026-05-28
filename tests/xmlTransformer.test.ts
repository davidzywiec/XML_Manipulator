import { describe, expect, it } from 'vitest';
import { createXmlEntries, replaceXmlVariables } from '../src/server/services/xmlTransformer';

describe('replaceXmlVariables', () => {
  it('replaces one placeholder', () => {
    expect(replaceXmlVariables('<x>${name}</x>', { name: 'Design' })).toBe('<x>Design</x>');
  });

  it('replaces multiple and repeated placeholders', () => {
    const xml = '<x code="${code}">${name}-${code}</x>';
    expect(replaceXmlVariables(xml, { code: 'abc', name: 'Alpha' })).toBe('<x code="abc">Alpha-abc</x>');
  });

  it('preserves unknown placeholders', () => {
    expect(replaceXmlVariables('<x>${known}${missing}</x>', { known: 'yes' })).toBe('<x>yes${missing}</x>');
  });

  it('escapes XML-sensitive values', () => {
    expect(replaceXmlVariables('<x attr="${value}">${value}</x>', { value: 'A&B "C" <D>' })).toBe(
      '<x attr="A&amp;B &quot;C&quot; &lt;D&gt;">A&amp;B &quot;C&quot; &lt;D&gt;</x>',
    );
  });

  it('does not corrupt CDATA when no placeholder is present', () => {
    expect(replaceXmlVariables('<x><![CDATA[A & B]]></x>', { name: 'unused' })).toBe(
      '<x><![CDATA[A & B]]></x>',
    );
  });
});

describe('createXmlEntries', () => {
  it('creates an entry for every mapping row', () => {
    const xml = '<x>${code}</x>';
    expect(
      createXmlEntries(xml, [
        { rowNumber: 2, values: { code: 'a' } },
        { rowNumber: 3, values: { code: 'b' } },
      ]),
    ).toBe('<x>a</x>\n<x>b</x>');
  });
});
