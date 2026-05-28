import { describe, expect, it } from 'vitest';
import { extractPlaceholders } from '../src/server/services/xmlPlaceholderScanner';

describe('extractPlaceholders', () => {
  it('extracts supported placeholders only', () => {
    const xml = '<x>${project_name} ${PROJECT_ID} ${project-name} ${ project_name } $project_name</x>';
    expect(extractPlaceholders(xml)).toEqual(['project_name', 'PROJECT_ID']);
  });

  it('deduplicates repeated placeholders', () => {
    expect(extractPlaceholders('<x>${name}</x><y>${name}</y>')).toEqual(['name']);
  });
});
