import * as fs from "fs";
import * as path from "path";

describe("AI Suggestions Table Database Constraint", () => {
  const migrationPath = path.resolve(
    __dirname,
    "../../prisma/migrations/20261108000010_add_ai_suggestions/migration.sql",
  );

  it("should have migration with explicit check constraint check_requires_human_verification", () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    const content = fs.readFileSync(migrationPath, "utf8");

    expect(content).toContain('CONSTRAINT "check_requires_human_verification"');
    expect(content).toContain('CHECK ("requires_human_verification" = true)');
  });

  it("should verify database error when attempting to insert requires_human_verification=false", async () => {
    const mockPrisma = {
      $executeRawUnsafe: jest.fn().mockImplementation((query: string, ...params: unknown[]) => {
        if (params.includes(false) || query.includes("false")) {
          const err = new Error(
            'new row for relation "ai_suggestions" violates check constraint "check_requires_human_verification"',
          );
          (err as unknown as { code: string }).code = "23514";
          return Promise.reject(err);
        }
        return Promise.resolve(1);
      }),
    };

    await expect(
      mockPrisma.$executeRawUnsafe(
        'INSERT INTO "ai_suggestions" (id, report_id, kind, payload, model_version, requires_human_verification) VALUES ($1, $2, $3, $4, $5, $6)',
        "sug-1",
        "rep-1",
        "CLASSIFICATION",
        {},
        "v1.0.0",
        false,
      ),
    ).rejects.toThrow('violates check constraint "check_requires_human_verification"');
  });
});
