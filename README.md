# XML Manipulator

Local-first web UI for generating XML entries from an XML template and a CSV or Excel mapping file.

## Prerequisites

- Node.js 18+ for local development.
- Docker Desktop for containerized usage.

## Run Locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5179
```

## Run With Docker

```bash
docker compose up --build
```

Open:

```text
http://localhost:5179
```

The compose file runs the built production container. For live local development, use `npm run dev`.

## Mapping Formats

Row-based template generation supports CSV/TXT files with headers that match placeholders. Pipe-delimited files are detected automatically.

```csv
${code}|${name}|${path}
dddp|Design & Delivery - Design & Planning|/Overhead/Design & Delivery - Design & Planning
```

The app also accepts variable/value mappings:

```csv
variable_name,value
code,dddp
name,Design & Delivery
path,/Overhead/Design & Delivery
```

Excel `.xlsx` files are supported using the first worksheet.

## Example XML Template

```xml
<instance instanceCode="${code}" objectCode="custom_object">
  <CustomInformation>
    <ColumnValue name="name">${name}</ColumnValue>
    <ColumnValue name="path">${path}</ColumnValue>
  </CustomInformation>
</instance>
```

Use **Show Sample Entry** to preview the first generated XML entry. Use **Generate XML** to create one XML entry for every mapping row, then download the result.

## Validation

The app reports missing mappings, unused mappings, empty values, missing variable names, unsupported file types, empty files, CSV parse errors, and Excel files without usable worksheets.

Replacement values are XML-escaped before insertion. XML text is not executed, external entities are not resolved, and uploaded files stay in the browser/container runtime.

## Checks

```bash
npm run test
npm run lint
npm run typecheck
```

## Known Limitations

- Structural XML validation is not enabled yet.
- Replacement values are escaped uniformly, including attribute and text contexts.
- Large files are processed in the browser, so very large spreadsheets may need a server-side parser later.
