# AGENTS.md

## Project overview

This project is a JavaScript Docker application with a browser-based UI for transforming XML files.

The application should allow a user to:

1. Upload or paste XML content.
2. Upload an Excel or CSV mapping file.
3. Detect placeholder variables in the XML using the `${variable_name}` pattern.
4. Replace those placeholders with values from the uploaded mapping file.
5. Preview the transformed XML.
6. Download the updated XML.
7. See validation errors before generating output.

The app should run locally in Docker and expose a web UI on a localhost port that is not commonly used. Prefer port `5179` unless a future requirement changes it.

## Core behavior

### Variable replacement

- Variables use this exact placeholder format:

  ```text
  ${variable_name}
  ```

- Placeholder names should support letters, numbers, and underscores.
- Treat placeholder names as case-sensitive unless explicitly changed by the user.
- Never replace partial matches outside the `${...}` format.
- Preserve XML formatting as much as possible.
- Preserve XML declaration, comments, namespaces, CDATA sections, and attributes.
- If a variable exists in the XML but not in the uploaded mapping file, report it clearly and do not silently remove it.
- If a mapping file contains variables that are not used in the XML, show them as unused mappings but do not fail the transformation.
- Do not mutate the original uploaded XML content. Always generate transformed output separately.

### Mapping file expectations

Support both CSV and Excel files.

Preferred mapping columns:

```text
variable_name,value
```

Also accept these common aliases when reasonable:

```text
variable,value
name,value
key,value
placeholder,value
```

Rules:

- Trim whitespace around column headers.
- Trim whitespace around `variable_name`.
- Preserve whitespace in `value` unless the user explicitly requests trimming.
- Empty replacement values are valid but should trigger a warning.
- Duplicate variables should be flagged as validation errors unless the values are identical.
- CSV parsing must handle quoted values, commas inside quoted values, and line breaks inside quoted fields.
- Excel parsing should support `.xlsx` by default.

## Recommended technology

Use JavaScript or TypeScript. Prefer TypeScript for maintainability if the project is being scaffolded from scratch.

Recommended stack:

- Runtime/package manager: Node.js with `npm`, `pnpm`, or `yarn`; prefer `pnpm` if no package manager exists yet.
- Web UI: Vite + React.
- Backend/API: Express, Fastify, or Hono.
- XML handling:
  - Use a parser only when structural XML validation is needed.
  - For placeholder replacement, operate on the XML text so formatting and unsupported XML features are preserved.
- CSV parsing: use a production-ready CSV parser such as `papaparse` or `csv-parse`.
- Excel parsing: use a maintained library such as `xlsx`.
- Testing: Vitest.
- Linting/formatting: ESLint + Prettier.

## Expected project structure

Prefer a structure similar to this:

```text
.
├── AGENTS.md
├── README.md
├── Dockerfile
├── docker-compose.yml
├── package.json
├── src
│   ├── server
│   │   ├── index.ts
│   │   ├── routes
│   │   └── services
│   │       ├── mappingParser.ts
│   │       ├── xmlPlaceholderScanner.ts
│   │       ├── xmlTransformer.ts
│   │       └── validation.ts
│   ├── client
│   │   ├── App.tsx
│   │   ├── components
│   │   └── api
│   └── shared
│       └── types.ts
├── tests
│   ├── mappingParser.test.ts
│   ├── xmlPlaceholderScanner.test.ts
│   ├── xmlTransformer.test.ts
│   └── validation.test.ts
└── uploads
    └── .gitkeep
```

If the existing project uses a different structure, follow the existing structure instead of forcing this one.

## Docker requirements

The application must run in Docker.

Recommended behavior:

- Web UI should be available at:

  ```text
  http://localhost:5179
  ```

- Container should not require host-level global installs.
- Use a non-root user in the final container image when practical.
- Do not bake uploaded files or generated XML outputs into the image.
- Use bind mounts or temporary container storage for local development.
- Keep the Docker image small and reproducible.

Preferred `docker-compose.yml` behavior:

```yaml
services:
  xml-variable-replacer:
    build: .
    ports:
      - "5179:5179"
    environment:
      - NODE_ENV=development
      - PORT=5179
    volumes:
      - .:/app
      - /app/node_modules
```

When changing Docker configuration, update the README commands as well.

## Setup commands

Use the commands that match the package manager already present in the repo.

If using `pnpm`:

```bash
pnpm install
pnpm dev
pnpm test
pnpm lint
pnpm typecheck
```

If using Docker:

```bash
docker compose up --build
```

The app should then be available at:

```text
http://localhost:5179
```

## Development workflow

Before making changes:

1. Inspect the existing project structure.
2. Read `package.json`.
3. Check whether the project uses JavaScript or TypeScript.
4. Follow existing naming, formatting, and testing patterns.
5. Avoid large rewrites unless the user explicitly asks for one.

When implementing a feature:

1. Add or update focused tests first when practical.
2. Keep XML scanning, mapping parsing, validation, and transformation logic separated.
3. Keep UI components small and readable.
4. Add clear error messages for user-facing validation failures.
5. Update README usage instructions when behavior changes.

## Code style

- Prefer small, pure functions for transformation logic.
- Keep parsing and replacement logic out of React components.
- Use descriptive names such as `extractPlaceholders`, `parseMappingFile`, `validateMappings`, and `replaceXmlVariables`.
- Avoid clever regex-only solutions for CSV or Excel parsing. Use libraries.
- Use regex only for detecting placeholders in XML text.
- Avoid silent failure. Return structured validation results.
- Prefer explicit return types in TypeScript.
- Keep comments useful and professional. Explain why something exists, not what every obvious line does.

## Placeholder detection guidance

Use a clear placeholder-matching expression similar to:

```ts
const PLACEHOLDER_PATTERN = /\$\{([A-Za-z0-9_]+)\}/g
```

Expected behavior:

- `${project_name}` should match `project_name`.
- `${PROJECT_ID}` should match `PROJECT_ID`.
- `${project-name}` should not match unless requirements are expanded.
- `${ project_name }` should not match unless requirements are expanded.
- `$project_name` should not match.
- `{{project_name}}` should not match.

If placeholder rules change, update tests before updating implementation.

## Validation requirements

The app should validate and report:

- Invalid XML when XML validation is enabled.
- Missing mappings for placeholders found in the XML.
- Duplicate mapping rows.
- Mapping rows with missing variable names.
- Unsupported file types.
- Empty uploaded files.
- Excel files with no usable worksheet.
- CSV files with no usable headers.
- Replacement values that may break XML syntax.

Important: replacement values inserted into XML text may need XML escaping depending on where they are inserted. If the placeholder is inside an XML text node or attribute, ensure the replacement does not create invalid XML. When uncertain, warn the user and provide a preview rather than silently generating invalid XML.

## Testing instructions

Add or update tests for any changed behavior.

Minimum test coverage should include:

- Extracting placeholders from XML text.
- Replacing one placeholder.
- Replacing multiple placeholders.
- Replacing repeated placeholders.
- Preserving unknown placeholders when validation fails.
- Detecting missing mappings.
- Detecting unused mappings.
- Detecting duplicate mapping rows.
- Parsing CSV mappings.
- Parsing Excel mappings.
- Handling empty values.
- Handling XML attributes with placeholders.
- Handling XML text nodes with placeholders.
- Handling CDATA without corrupting content.

Run these checks before considering work complete:

```bash
pnpm test
pnpm lint
pnpm typecheck
```

If the repo does not have these scripts, add them or document the available equivalent commands.

## UI requirements

The web UI should be simple and local-first.

Recommended UI sections:

1. XML input/upload.
2. CSV/Excel mapping upload.
3. Detected placeholders list.
4. Mapping preview table.
5. Validation results.
6. Transformed XML preview.
7. Download button.

UI behavior:

- Show clear success and error states.
- Never upload data to an external service.
- Keep all processing local to the app/container unless the user explicitly requests otherwise.
- Do not require authentication for localhost development.
- Use accessible labels for file inputs and buttons.
- Make large XML previews scrollable.
- Do not freeze the browser on large files; consider server-side parsing or web workers if needed.

## Security considerations

This app handles user-provided XML and spreadsheet files. Treat all input as untrusted.

Requirements:

- Do not execute XML content.
- Do not resolve external XML entities.
- Disable XXE behavior in XML parsers.
- Do not make network calls based on XML content.
- Do not evaluate replacement values as code.
- Do not use `eval`, `new Function`, or shell execution for user-provided values.
- Limit upload size.
- Store uploads only temporarily.
- Avoid logging full XML or mapping contents unless explicitly needed for debugging.
- Sanitize any values rendered in the browser.
- Never expose the app beyond localhost by default.

## Error handling

Prefer structured error responses from the backend:

```ts
type ValidationMessage = {
  level: 'error' | 'warning' | 'info'
  code: string
  message: string
  field?: string
  rowNumber?: number
}
```

Examples:

- `MISSING_MAPPING`
- `DUPLICATE_MAPPING`
- `UNUSED_MAPPING`
- `INVALID_XML`
- `UNSUPPORTED_FILE_TYPE`
- `EMPTY_FILE`
- `INVALID_PLACEHOLDER`

User-facing messages should be specific and actionable.

## API guidance

If building an API, prefer endpoints similar to:

```text
POST /api/analyze
POST /api/transform
GET /api/health
```

Expected `/api/analyze` behavior:

- Accept XML plus CSV/Excel mapping file.
- Return detected placeholders, parsed mappings, and validation messages.
- Do not transform if validation errors exist.

Expected `/api/transform` behavior:

- Accept XML plus validated mappings.
- Return transformed XML and warnings.

Expected `/api/health` behavior:

- Return application status and version.

## File handling

- Do not commit uploaded XML, CSV, Excel, or generated output files.
- Add upload/output folders to `.gitignore`.
- Keep a `.gitkeep` file only if the folder must exist in git.
- Prefer streaming or memory-safe file handling for larger files.
- Clean up temporary files after processing.

## README expectations

When creating or changing this project, keep the README updated with:

- What the app does.
- Required prerequisites.
- Local setup commands.
- Docker setup commands.
- Localhost URL and port.
- Expected CSV/Excel format.
- Example XML input.
- Example mapping file.
- Known limitations.
- Security notes for XML handling.

## Pull request guidance

Before finishing a task:

1. Summarize what changed.
2. List tests run.
3. Note any tests not run and why.
4. Mention any new limitations or follow-up work.
5. Confirm Docker still starts successfully when Docker files were changed.

Suggested PR title format:

```text
[xml-variable-replacer] Add <short description>
```

## Agent behavior rules

- Follow explicit user instructions first.
- Follow the nearest `AGENTS.md` file when working in nested folders.
- Do not introduce unrelated frameworks or services.
- Do not connect to external APIs unless the user asks.
- Do not change the public placeholder format without user approval.
- Do not remove validation to make tests pass.
- Prefer incremental, reviewable changes.
- Leave the project in a runnable state.
