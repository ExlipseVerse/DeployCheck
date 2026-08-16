# DeployCheck

Catch environment configuration problems before they break your deployment.

DeployCheck scans your `.env` files and compares real environment files with `.env.example` or `.env.template`.

It can find:

- Missing variables.
- Extra variables.
- Empty values.
- Duplicate variables inside the same file.
- Missing `.env.example` or `.env.template`.

DeployCheck does not print environment values.

## Installation

Run it directly with `npx`:

```bash
npx deploycheck scan
```

Or install it globally:

```bash
npm install -g deploycheck
```

Then run:

```bash
deploycheck scan
```

## Usage

Scan the current project:

```bash
deploycheck scan
```

Scan a specific folder:

```bash
deploycheck scan --path ./apps/web
```

Show help:

```bash
deploycheck --help
```

Show scan help:

```bash
deploycheck scan --help
```

## Example

Suppose your project contains:

```text
.env.example
.env.production
```

`.env.example`:

```env
DATABASE_URL=
JWT_SECRET=
API_URL=
```

`.env.production`:

```env
DATABASE_URL=production-database
JWT_SECRET=production-secret
```

Run:

```bash
npx deploycheck scan
```

You may see:

```text
Environment report

Reference:
  .env.example

.env.production
  ✗ Missing key: API_URL

Summary:
  1 error
  0 warnings
```

## What DeployCheck checks

### Missing keys

If a key exists in `.env.example` but not in another environment file:

```text
✗ .env.production is missing API_URL
```

### Extra keys

If an environment file contains a key that is not listed in `.env.example`:

```text
⚠ .env.production contains ADMIN_SECRET, which is not in .env.example
```

Extra keys are reported as warnings because they may be intentional.

### Empty values

Empty values in actual environment files are reported:

```env
DATABASE_URL=
```

Result:

```text
⚠ .env.production has an empty DATABASE_URL
```

Empty values in `.env.example` are allowed because example files normally contain placeholders.

### Duplicate keys

If one file defines the same key more than once:

```env
API_URL=https://one.example
API_URL=https://two.example
```

DeployCheck reports it:

```text
✗ .env.production defines API_URL more than once
```

A key appearing in different files is not automatically a problem. For example, this is normal:

```text
.env.example       → DATABASE_URL
.env.production    → DATABASE_URL
.env.local         → DATABASE_URL
```

## Supported environment files

DeployCheck can scan files such as:

```text
.env
.env.example
.env.template
.env.local
.env.development
.env.development.local
.env.production
.env.production.local
.env.test
.env.test.local
```

`.env.example` and `.env.template` are treated as reference files.

## Monorepos

For monorepos, scan one application folder at a time:

```bash
npx deploycheck scan --path ./apps/web
```

This helps keep each report focused on one application.

## Ignored folders

DeployCheck ignores common generated and dependency folders, including:

```text
node_modules
.git
dist
build
.next
coverage
```

## Privacy

DeployCheck reports variable names and file names, but does not print environment values.

Never commit real `.env` files or secrets to a public repository.

## Development

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/deploycheck.git
cd deploycheck
```

Install dependencies:

```bash
npm install
```

Run the CLI during development:

```bash
npm run dev -- scan
```

Build the project:

```bash
npm run build
```

Run tests:

```bash
npm test
```

Run the full check:

```bash
npm run check
```

## Project commands

```bash
npm run dev -- scan     # Run from TypeScript source
npm run build           # Compile TypeScript
npm start               # Run compiled JavaScript
npm test                # Run tests once
npm run test:watch      # Run tests in watch mode
npm run check           # Build and run tests
```

## Current status

DeployCheck is an early version focused on environment-file comparison.

Planned improvements may include:

- JSON output.
- Better framework support.
- Source-code variable detection.
- GitHub Actions support.
- Custom required-variable rules.
- Improved monorepo support.

## License

MIT