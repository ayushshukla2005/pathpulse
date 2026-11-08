import * as fs from "fs";
import * as path from "path";

describe("AI Service Logging Safety: Zero Raw Text Leakage", () => {
  const aiDir = path.resolve(__dirname);
  const pythonAppDir = path.resolve(__dirname, "../../../ai-service/app");

  it("should confirm TypeScript AiClientService never logs description text", () => {
    const clientPath = path.join(aiDir, "ai-client.service.ts");
    const content = fs.readFileSync(clientPath, "utf8");

    expect(content).not.toMatch(/this\.logger\.(log|warn|error)\([^)]*input\.description/);
    expect(content).not.toMatch(/this\.logger\.(log|warn|error)\([^)]*payload\.description/);
    expect(content).toContain("textLength");
    expect(content).toContain("requestId");
  });

  it("should confirm TypeScript AiProcessor never logs description text", () => {
    const processorPath = path.join(aiDir, "ai.processor.ts");
    const content = fs.readFileSync(processorPath, "utf8");

    expect(content).not.toMatch(/this\.logger\.(log|warn|error)\([^)]*description\b[^=]/);
    expect(content).toContain("textLength");
    expect(content).toContain("jobId");
  });

  it("should confirm Python FastAPI main.py never logs description text in full", () => {
    const pythonMainPath = path.join(pythonAppDir, "main.py");
    const content = fs.readFileSync(pythonMainPath, "utf8");

    expect(content).not.toMatch(/logger\.(info|warning|error)\([^)]*payload\.description/);
    expect(content).toContain("text_length");
    expect(content).toContain("req_id");
  });
});
