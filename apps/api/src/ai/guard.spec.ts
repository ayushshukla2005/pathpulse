import * as fs from "fs";
import * as path from "path";

describe("AI Guard: Autonomous Status Mutation Prevention", () => {
  const workflowDir = path.resolve(__dirname, "../reports/workflow");
  const facilitiesDir = path.resolve(__dirname, "../facilities");

  function getTsFiles(dir: string): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results = results.concat(getTsFiles(fullPath));
      } else if (file.endsWith(".ts") && !file.endsWith(".spec.ts")) {
        results.push(fullPath);
      }
    }
    return results;
  }

  it("should confirm workflow mutation logic never references ai_suggestions for state changes", () => {
    const files = getTsFiles(workflowDir);
    const mutatingFiles = files.filter(
      (f) => f.endsWith("state-machine.ts") || f.endsWith("allowed-actions.ts"),
    );

    expect(mutatingFiles.length).toBeGreaterThan(0);

    for (const file of mutatingFiles) {
      const content = fs.readFileSync(file, "utf8");
      const hasAiSuggestionMutation =
        content.includes("ai_suggestions") ||
        content.includes("aiSuggestion") ||
        content.includes("AiSuggestion");

      expect(hasAiSuggestionMutation).toBe(false);
    }
  });

  it("should confirm facilities status mutation logic never references ai_suggestions", () => {
    const files = getTsFiles(facilitiesDir);
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      const hasAiReference =
        content.includes("ai_suggestions") ||
        content.includes("aiSuggestion") ||
        content.includes("AiSuggestion");

      expect(hasAiReference).toBe(false);
    }
  });

  it("should assert state machine transitions depend strictly on actor role and allowed actions table", () => {
    const stateMachinePath = path.join(workflowDir, "state-machine.ts");
    const content = fs.readFileSync(stateMachinePath, "utf8");

    expect(content).not.toContain("aiSuggestion");
    expect(content).not.toContain("aiClient");
    expect(content).toContain("TRANSITION_RULES");
  });
});
