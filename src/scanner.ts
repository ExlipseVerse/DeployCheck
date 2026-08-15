import pc from 'picocolors'
import fg from 'fast-glob'
import { config, DotenvConfigOutput } from 'dotenv';
import * as p from 'path';
import chalk from 'chalk'

const envTypes = [
    ".env",
    ".env.production",
    ".env.example"
]

export async function scan(path: string) {
    console.log(`${pc.bold("Scanning: ")} ${pc.dim(path)}`);
    const entries: string[] = await fg([`${path}/**/*.env`, `${path}/**/.env.*`], {dot: true, ignore: ['**/node_modules/**']});
    const report:Record<string, string[]> = {};
    const missing = [];
    for (let i of entries) {
        const envType = p.basename(i)
        let env: DotenvConfigOutput = config({path: i});
        if (env.error) {
            throw env.error
        }

        if (env.parsed) {
            for (const[key,value] of Object.entries(env.parsed)) {
                report[envType].push(key);
                if (!value && envType != ".env.example") {
                    console.log(`${key} dosent have a value`)
                    missing.push(key)
                }
            }
        }
    }

    console.log(report)
}