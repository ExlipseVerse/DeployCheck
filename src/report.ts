import pc from "picocolors";
import type { ScanReport } from "./scanner.js";

export function printReport(report: ScanReport): void {
  console.log(pc.bold(`\nScanned: ${report.root}`));
  console.log(`Environment files: ${report.envFiles.length}`);

  for (const file of report.envFiles) {
    console.log(`  ${file.path}: ${file.keys.length} keys`);
  }

  if (report.findings.length === 0) {
    console.log(pc.green("\n✓ No findings"));
    return;
  }

  console.log(pc.yellow(`\n${report.findings.length} finding(s):`));

  for (const finding of report.findings) {
    console.log(
      `${pc.yellow("⚠")} ${finding.file} → ${finding.key}: ${finding.message}`,
    );
  }
}