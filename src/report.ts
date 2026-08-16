import pc from "picocolors";
import type { ScanReport, Finding } from "./scanner.js";


//da report
export function printReport(report: ScanReport): void {
  console.log(pc.bold("\nEnvironment report"));

  //we get both temp and actual seperated 
  const templateFiles = report.envFiles.filter((f) =>
    f.name === ".env.example" || f.name === ".env.template"
  );
  const actualFiles = report.envFiles.filter((f) =>
    f.name !== ".env.example" && f.name !== ".env.template"
  );

  //we check if there is an not found type that means there is no example
  const noExample = report.findings.find((f) => f.type === "not-found");

  //wee'll do printing a bit
  if (noExample) {
    console.log(pc.yellow(`\n⚠ ${noExample.message}`));
  } else {
    console.log(pc.dim("\nReference:"));
    for (const file of templateFiles) {
      console.log(`  ${file.path}`);
      console.log(pc.dim(`  ${file.keys.length} keys`));
    }
  }

  for (const file of actualFiles) {
    console.log(pc.bold(`\n${file.path}`));

    const fileFindings = report.findings.filter((f) => f.file === file.path);

    printGroup(
      fileFindings.filter((f) => f.type === "missing-key"),
      "Missing key",
      "All example keys are present",
    );

    printGroup(
      fileFindings.filter((f) => f.type === "extra-key"),
      "Extra key",
      "No extra keys",
    );

    printGroup(
      fileFindings.filter((f) => f.type === "empty-value"),
      "Empty key",
      "No empty keys",
    );

    printGroup(
      fileFindings.filter((f) => f.type === "duplicate-key"),
      "Duplicate key",
      "No duplicate keys",
    );
  }

  const exampleOnly = report.findings.filter((f) => f.type === "example-only");
  if (exampleOnly.length > 0) {
    console.log(pc.bold("\nExample only:"));
    for (const finding of exampleOnly) {
      console.log(`  ${pc.yellow("⚠")} ${finding.message}`);
    }
  }

  const errorCount = report.findings.filter((f) => f.severity === "error").length;
  const warningCount = report.findings.filter((f) => f.severity === "warning").length;

  console.log(pc.bold("\nSummary:"));
  if (errorCount === 0 && warningCount === 0) {
    console.log(pc.green("  ✓ No findings"));
  } else {
    if (errorCount > 0) console.log(pc.red(`  ${errorCount} error${errorCount === 1 ? "" : "s"}`));
    if (warningCount > 0) console.log(pc.yellow(`  ${warningCount} warning${warningCount === 1 ? "" : "s"}`));
  }
  console.log("");
}

//prints a finding group for one file or a single line if that group is empty
function printGroup(findings: Finding[], label: string, okMessage: string): void {
  if (findings.length === 0) {
    console.log(`  ${pc.green("✓")} ${okMessage}`);
    return;
  }

  for (const finding of findings) {
    const mark = finding.severity === "error" ? pc.red("✗") : pc.yellow("⚠");
    console.log(`  ${mark} ${label}: ${finding.key}`);
  }
}