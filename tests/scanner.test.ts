/// <reference types="node" />
import path from "node:path";
import { describe, expect, it } from "vitest";
import {scan} from "../src/scanner"

describe("scan", () => {
    it("finds enviroment files", async () => {
        const fixture = path.resolve("tests/fixtures/correct-project")
        const report = await scan(fixture);

        expect(report.envFiles.length).toBeGreaterThan(0);
    });
});