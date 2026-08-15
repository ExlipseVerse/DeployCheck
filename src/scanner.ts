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
  type: "empty-value" | "duplicate-key";
  file: string;
  key: string;
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


//compare example env with the produciton and just env
// function compare(exampleKeys: string[], productionKeys: string[], normalKeys: string[]) {
//     const examCopy = []
//     for (let i of exampleKeys) {
//         console.log(i)
//         const examKey = i
//         const exist = []
//         for (let j of productionKeys) {
//             if (j == i) {
//                 examCopy.push(j)
//             }
//         }
//         for (let j of normalKeys) {
//             if (j == i) {
//                 examCopy.push(j)
//             }
//         }
//     }

//     console.log(examCopy)
// }

export async function scan(root: string) {
    const absPath = path.resolve(root); // resolves the path for example . (src/root) to an actual full path like home/ff/fehf
    
    //finding for env file in the absPath
    const files = await fg(ENV_FILE_PATTERNS, {
        cwd: absPath,
        dot: true,
        onlyFiles: true,
        ignore: IGNORE,
    });

    //storing list of env files and finding, locations.
    const envFiles: EnvFile[] = [];
    const findings: Finding[] = [];
    const keyLocations = new Map<string, string[]>();
    
    for (const file of files) {
        const absFile = path.join(absPath, file); // joins the abs path with the env file
        const src = await readFile(absFile, "utf8");
        const parsed = parse(src); // parsing source returns a dict containing the key/value

        //extracting keys
        const keys = Object.keys(parsed);

        //storing the extracted key and info
        envFiles.push({
            path: file,
            name: path.basename(file),
            keys,
        });
        
        // looping through a env file getting key/value
        for (const [key, value] of Object.entries(parsed)) {
            const locs = keyLocations.get(key) ?? []; //trying to get value from the dict but if nothing exists it return undefine so we make an empty array
            locs.push(file); // we push the file in the empty array
            keyLocations.set(key, locs); // then save it

            if (value.trim() === "" && !isTemplateFile(file)) { //checking if the value is empty and not from .env.example or template
                //then we push the finding if missing
                findings.push({
                    type: "empty-value",
                    file: file,
                    key,
                    message: `${key} is empty`,
                });
            }
        }
    }

    // amother for loop to get key and locations for finding duplicates
    for (const [key, locations] of keyLocations) {
        // only if the locations are greaeter than one meaning a 'duplicate'
        if (locations.length > 1) { 
            // we push the duplicate in finding
            findings.push({
                type: "duplicate-key",
                file: locations.join(", "),
                key,
                message: `appears in multiple environment files`,
            });
        }
    }


    //return all the data for report
    return {
        root: absPath,
        envFiles,
        findings,
    };
}

function isTemplateFile(file: string): boolean {
  const name = path.basename(file);
  return name === ".env.example" || name === ".env.template";
}