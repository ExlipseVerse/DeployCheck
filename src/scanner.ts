import fg from "fast-glob";
import { parse } from "dotenv";
import path from "node:path";
import { readFile } from "node:fs/promises";

export type EnvFile = {
  path: string;
  name: string;
  keys: string[];
};

export type Finding = {
  severity: "error" | "warning" | "info";
  type: "empty-value" | "duplicate-key" | "not-found" | "missing-key" | "extra-key" | "example-only";
  file?: string;
  key?: string;
  message: string;
};

export type ScanReport = {
  root: string;
  envFiles: EnvFile[];
  findings: Finding[];
};

const ENV_FILE_PATTERNS = [
  ".env",
  ".env.*",
];

const IGNORE = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/.next/**",
  "**/coverage/**",
];

// //.env
// .env.local
// .env.development
// .env.development.local
// .env.production
// .env.production.local
// .env.example
// .env.template

export async function scan(root: string) {
    const absPath = path.resolve(root); // resolves the path for example . (src/root) to an actual full path like home/ff/fehf

    //finding for env file in the absPath
    const files = await fg(ENV_FILE_PATTERNS, {
        cwd: absPath,
        dot: true,
        onlyFiles: true,
        ignore: IGNORE,
    });

    //storing list of env files and finding location
    const envFiles: EnvFile[] = [];
    const findings: Finding[] = [];

    //checking if the example/temp env file exists
    const exampleExist = files.includes(".env.example") || files.includes(".env.template");

    //if not exists
    if (!exampleExist) {
        //we loop through the files 
        for (const file of files) {

            //get the envFiles other than example or temp and store it and return for report
            const absFile = path.join(absPath, file);
            const src = await readFile(absFile, "utf8");
            const parsed = parse(src);

            envFiles.push({
                path: file,
                name: path.basename(file),
                keys: Object.keys(parsed),
            });
        }

        findings.push({
            type: "not-found",
            severity: "warning",
            message: `example environment files dosent exist`,
        })

        return {
            root: absPath,
            envFiles,
            findings,
        };
    }

    //reference/temp files first so we get exampleKeys before checking actual files
    const exampleKeys: string[] = [];
    const actualFiles: string[] = [];

    //we go through files after making sure the example/temp exists
    for (const file of files) {
        //we check if teh file is example/temp file
        if (isTemplateFile(file)) {
            const absFile = path.join(absPath, file);
            const src = await readFile(absFile, "utf8");
            const parsed = parse(src);
            const keys = Object.keys(parsed);
            
            //we parse it and store the temp/example in envFIles
            envFiles.push({
                path: file,
                name: path.basename(file),
                keys,
            });

            //we loop through keys to and store the keys for later checking
            for (const key of keys) {
                exampleKeys.push(key);
            }
        } else {
            //otherwise we store the actual keeys of files other than example/temp keys
            actualFiles.push(file);
        }
    }

    //we create a set for storing the keys found in actual
    const foundInActual = new Set<string>();


    //we loop throught the actual files not the example/temp etc
    for (const file of actualFiles) {
        const absFile = path.join(absPath, file);
        const src = await readFile(absFile, "utf8");
        const parsed = parse(src);
        const keys = Object.keys(parsed);

        //we store the actual envFiles
        envFiles.push({
            path: file,
            name: path.basename(file),
            keys,
        });
        //and there keys
        for (const key of keys) {
            foundInActual.add(key);
        }

        // we check if example key has any missing keys 
        for (const key of exampleKeys) {
            if (!keys.includes(key)) {

                //if not we set it as missing finding
                findings.push({
                    type: "missing-key",
                    severity: "error",
                    file,
                    key,
                    message: `${file} is missing ${key} from the example`,
                });
            }
        }

        //we will loop throguh the actual keys and check if the actual key have the keys same as example keys
        for (const key of keys) {
            if (!exampleKeys.includes(key)) {
                //if not we set is as extra key finding 
                findings.push({
                    type: "extra-key",
                    severity: "warning",
                    file,
                    key,
                    message: `${file} contains ${key}, which is not in the example`,
                });
            }
        }

        //empty values dont report these on template files since placeholders are expected
        for (const [key, value] of Object.entries(parsed)) {
            if (value.trim() === "") {
                findings.push({
                    type: "empty-value",
                    severity: "warning",
                    file,
                    key,
                    message: `${file} has an empty ${key}`,
                });
            }
        }

        //duplicate keys inside the same file parse already collapses these so we read the raw lines instead
        const rawKeys = extractKeys(src); //we extract keys
        const seen = new Map<string, number>(); //we create a dict for seen
        for (const key of rawKeys) {
            seen.set(key, (seen.get(key) ?? 0) + 1);
        }
        for (const [key, count] of seen) {
            if (count > 1) {
                findings.push({
                    type: "duplicate-key",
                    severity: "error",
                    file,
                    key,
                    message: `${file} defines ${key} more than once`,
                });
            }
        }
    }

    //example contains a key missing everywhere only report if there is atleast one actual file to compare against
    if (actualFiles.length > 0) {
        for (const key of exampleKeys) {
            if (!foundInActual.has(key)) {
                findings.push({
                    type: "example-only",
                    severity: "warning",
                    key,
                    message: `${key} exists in the example but was not found in any actual environment file`,
                });
            }
        }
    }

    return {
        root: absPath,
        envFiles,
        findings,
    };
}

//this only check if the there is a file with the name
function isTemplateFile(file: string): boolean {
  const name = path.basename(file);
  return name === ".env.example" || name === ".env.template";
}

//reads raw key lines from src used for duplicatekey detection since parse collapses dupes
function extractKeys(src: string): string[] {
  const keys: string[] = [];
  for (const line of src.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([\w.-]+)\s*=/);
    if (match) keys.push(match[1]);
  }
  return keys;
}