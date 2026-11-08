import { BadRequestException } from "@nestjs/common";
import { generateEvidenceObjectKey } from "../object-key.util";

describe("generateEvidenceObjectKey", () => {
  const validReportId = "123e4567-e89b-12d3-a456-426614174000";
  const validEvidenceId = "987fcdeb-51a2-43d7-9012-345678901234";

  it("should generate correct key with jpg extension for image/jpeg", () => {
    const key = generateEvidenceObjectKey(validReportId, validEvidenceId, "image/jpeg");
    expect(key).toBe(`reports/${validReportId}/${validEvidenceId}.jpg`);
  });

  it("should generate correct key with png extension for image/png", () => {
    const key = generateEvidenceObjectKey(validReportId, validEvidenceId, "image/png");
    expect(key).toBe(`reports/${validReportId}/${validEvidenceId}.png`);
  });

  it("should generate correct key with webp extension for image/webp", () => {
    const key = generateEvidenceObjectKey(validReportId, validEvidenceId, "image/webp");
    expect(key).toBe(`reports/${validReportId}/${validEvidenceId}.webp`);
  });

  it("should reject directory traversal in report ID", () => {
    expect(() =>
      generateEvidenceObjectKey("../../../etc/passwd", validEvidenceId, "image/jpeg"),
    ).toThrow(BadRequestException);
  });

  it("should reject user-controlled special characters in evidence ID", () => {
    expect(() =>
      generateEvidenceObjectKey(validReportId, "malicious/uuid;rm -rf", "image/png"),
    ).toThrow(BadRequestException);
  });

  it("should reject non-UUID formatted strings", () => {
    expect(() => generateEvidenceObjectKey("not-a-uuid", validEvidenceId, "image/webp")).toThrow(
      BadRequestException,
    );
    expect(() => generateEvidenceObjectKey(validReportId, "also-not-a-uuid", "image/webp")).toThrow(
      BadRequestException,
    );
  });

  it("should reject unsupported MIME types", () => {
    expect(() => generateEvidenceObjectKey(validReportId, validEvidenceId, "image/gif")).toThrow(
      BadRequestException,
    );
    expect(() =>
      generateEvidenceObjectKey(validReportId, validEvidenceId, "application/pdf"),
    ).toThrow(BadRequestException);
    expect(() => generateEvidenceObjectKey(validReportId, validEvidenceId, "text/html")).toThrow(
      BadRequestException,
    );
  });
});
