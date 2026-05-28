import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { parseCsvMapping, parseExcelMapping } from '../server/services/mappingParser';
import { createXmlEntries, replaceXmlVariables } from '../server/services/xmlTransformer';
import { analyzeXmlAndMappings, hasBlockingErrors } from '../server/services/validation';
import type { MappingRow, ParsedMapping, ValidationMessage } from '../shared/types';

const defaultTemplate = `<instance instanceCode="\${code}" objectCode="custom_object">
  <CustomInformation>
    <ColumnValue name="name">\${name}</ColumnValue>
    <ColumnValue name="path">\${path}</ColumnValue>
  </CustomInformation>
</instance>`;

const defaultCsv = `\${code}|\${name}|\${path}
dddp|Design & Delivery - Design & Planning|/Overhead/Design & Delivery - Design & Planning
ddeo|Design & Delivery - Executive Office|/Overhead/Design & Delivery - Executive Office`;

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

function downloadXml(xml: string): void {
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'generated-xml.xml';
  link.click();
  URL.revokeObjectURL(url);
}

function levelLabel(level: ValidationMessage['level']): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export default function App(): JSX.Element {
  const [xmlText, setXmlText] = useState(defaultTemplate);
  const [mappingText, setMappingText] = useState(defaultCsv);
  const [parsedMapping, setParsedMapping] = useState<ParsedMapping>(() => parseCsvMapping(defaultCsv));
  const [fileMessage, setFileMessage] = useState<string>('Sample pipe-delimited mapping loaded.');
  const [sampleXml, setSampleXml] = useState('');
  const [generatedXml, setGeneratedXml] = useState('');

  const analysis = useMemo(
    () => analyzeXmlAndMappings(xmlText, parsedMapping.rows, parsedMapping.messages),
    [xmlText, parsedMapping],
  );
  const canGenerate = analysis.placeholders.length > 0 && !hasBlockingErrors(analysis.messages);

  async function handleXmlFile(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) return;
    setXmlText(await readFileAsText(file));
    setSampleXml('');
    setGeneratedXml('');
  }

  async function handleMappingFile(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.csv') || lowerName.endsWith('.txt')) {
      const text = await readFileAsText(file);
      setMappingText(text);
      setParsedMapping(parseCsvMapping(text));
      setFileMessage(`Loaded ${file.name}.`);
    } else if (lowerName.endsWith('.xlsx')) {
      const buffer = await readFileAsArrayBuffer(file);
      setMappingText('');
      setParsedMapping(await parseExcelMapping(buffer));
      setFileMessage(`Loaded ${file.name}.`);
    } else {
      setParsedMapping({
        rows: [],
        headers: [],
        messages: [
          {
            level: 'error',
            code: 'UNSUPPORTED_FILE_TYPE',
            message: 'Use a CSV, TXT, or XLSX mapping file.',
          },
        ],
      });
      setFileMessage(`Unsupported file type: ${file.name}`);
    }
    setSampleXml('');
    setGeneratedXml('');
  }

  function handleMappingTextChange(value: string): void {
    setMappingText(value);
    setParsedMapping(parseCsvMapping(value));
    setFileMessage('Mapping text updated.');
    setSampleXml('');
    setGeneratedXml('');
  }

  function showSampleEntry(): void {
    const firstRow = parsedMapping.rows[0];
    setSampleXml(firstRow ? replaceXmlVariables(xmlText, firstRow.values) : '');
  }

  function generateAllEntries(): void {
    setGeneratedXml(createXmlEntries(xmlText, parsedMapping.rows));
  }

  return (
    <main className="appShell">
      <header className="topBar">
        <div>
          <h1>XML Manipulator</h1>
          <p>Load an XML template and a CSV or Excel mapping file, preview entries, then download generated XML.</p>
        </div>
        <button type="button" className="secondaryButton" onClick={() => window.location.reload()}>
          Reset
        </button>
      </header>

      <section className="workspaceGrid">
        <section className="panel inputPanel">
          <div className="panelHeader">
            <h2>XML Template</h2>
            <label className="fileButton">
              Load XML
              <input type="file" accept=".xml,text/xml" onChange={handleXmlFile} />
            </label>
          </div>
          <textarea
            aria-label="XML template input"
            value={xmlText}
            onChange={(event) => {
              setXmlText(event.target.value);
              setSampleXml('');
              setGeneratedXml('');
            }}
            spellCheck={false}
          />
        </section>

        <section className="panel inputPanel">
          <div className="panelHeader">
            <h2>Mapping Data</h2>
            <label className="fileButton">
              Load CSV/XLSX
              <input type="file" accept=".csv,.txt,.xlsx" onChange={handleMappingFile} />
            </label>
          </div>
          <textarea
            aria-label="CSV mapping input"
            value={mappingText}
            onChange={(event) => handleMappingTextChange(event.target.value)}
            placeholder="Paste CSV data here. Pipe-delimited files are detected automatically."
            spellCheck={false}
          />
          <p className="muted">{fileMessage}</p>
        </section>
      </section>

      <section className="statusGrid">
        <section className="panel">
          <h2>Detected Placeholders</h2>
          <div className="chipList">
            {analysis.placeholders.length ? (
              analysis.placeholders.map((placeholder) => <span key={placeholder}>{placeholder}</span>)
            ) : (
              <p className="muted">No placeholders found.</p>
            )}
          </div>
        </section>

        <section className="panel">
          <h2>Validation</h2>
          <div className="messageList">
            {analysis.messages.length ? (
              analysis.messages.map((message, index) => (
                <div className={`message ${message.level}`} key={`${message.code}-${index}`}>
                  <strong>{levelLabel(message.level)}</strong>
                  <span>{message.message}</span>
                </div>
              ))
            ) : (
              <div className="message success">
                <strong>Ready</strong>
                <span>No validation issues found.</span>
              </div>
            )}
          </div>
        </section>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <h2>Mapping Preview</h2>
          <span className="muted">{parsedMapping.rows.length} row(s)</span>
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Row</th>
                {parsedMapping.headers.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parsedMapping.rows.slice(0, 20).map((row: MappingRow) => (
                <tr key={row.rowNumber}>
                  <td>{row.rowNumber}</td>
                  {parsedMapping.headers.map((header) => (
                    <td key={header}>{row.values[header]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="actionBand">
        <button type="button" onClick={showSampleEntry} disabled={!canGenerate}>
          Show Sample Entry
        </button>
        <button type="button" onClick={generateAllEntries} disabled={!canGenerate}>
          Generate XML
        </button>
        <button type="button" className="secondaryButton" onClick={() => downloadXml(generatedXml)} disabled={!generatedXml}>
          Download XML
        </button>
      </section>

      <section className="workspaceGrid outputGrid">
        <section className="panel">
          <h2>Sample Entry</h2>
          <pre>{sampleXml || 'Click "Show Sample Entry" to preview the first generated XML entry.'}</pre>
        </section>
        <section className="panel">
          <h2>Generated XML</h2>
          <pre>{generatedXml || 'Generated XML will appear here.'}</pre>
        </section>
      </section>
    </main>
  );
}
