#!/usr/bin/env node
import { Command } from "commander"; // impport the command cli maker
import { scan } from "./scanner.js";
import { printReport } from "./report.js";
const program = new Command; // create a programm
// defining name decription and version
program
    .name("deploycheck")
    .description("Catch enviroment configuration before deployment")
    .version("0.1.0");
// creating a command named scan 
// uses: scan --path or -p and <path here>
program
    .command("scan")
    .description("scans a project")
    .option("-p, --path <path>", "Project path", ".")
    .action(async (options) => {
    const scanReport = await scan(options.path); // calling scan the actual thing
    printReport(scanReport);
});
// parsing the program the cli
program.parse();
