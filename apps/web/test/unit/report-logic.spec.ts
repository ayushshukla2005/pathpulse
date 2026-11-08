import { describe, expect, it } from "vitest";
import {
  getFileExtensionFromMime,
  isValidEvidenceMimeType,
  isValidReportCategory,
  MAX_DESCRIPTION_LENGTH,
  MIN_DESCRIPTION_LENGTH,
  REPORT_CATEGORY_LABELS,
  REPORT_STATUS_LABELS,
  validateEvidenceFile,
  validateReportDescription,
} from "@pathpulse/validation";

describe("Report Validation Logic", () => {
  it("validates report category correctly", () => {
    expect(isValidReportCategory("BROKEN_LIFT")).toBe(true);
    expect(isValidReportCategory("BLOCKED_RAMP")).toBe(true);
    expect(isValidReportCategory("INACCESSIBLE_ENTRANCE")).toBe(true);
    expect(isValidReportCategory("OTHER")).toBe(true);
    expect(isValidReportCategory("INVALID_CATEGORY")).toBe(false);
    expect(isValidReportCategory("")).toBe(false);
  });

  it("provides user-friendly category labels", () => {
    expect(REPORT_CATEGORY_LABELS.BROKEN_LIFT).toBe("Broken lift or elevator");
    expect(REPORT_CATEGORY_LABELS.BLOCKED_RAMP).toBe("Blocked ramp or pathway");
    expect(REPORT_CATEGORY_LABELS.INACCESSIBLE_ENTRANCE).toBe("Inaccessible entrance or door");
    expect(REPORT_CATEGORY_LABELS.OTHER).toBe("Other accessibility barrier");
  });

  it("provides text status labels and explanations without color-only cues", () => {
    expect(REPORT_STATUS_LABELS.SUBMITTED.label).toBe("Submitted");
    expect(REPORT_STATUS_LABELS.SUBMITTED.explanation).toContain("queued for verification");
    expect(REPORT_STATUS_LABELS.VERIFIED.label).toBe("Verified");
  });

  it("validates description length constraints", () => {
    const tooShort = validateReportDescription("Too short");
    expect(tooShort.isValid).toBe(false);
    expect(tooShort.message).toContain(`at least ${MIN_DESCRIPTION_LENGTH} characters`);

    const exactMin = validateReportDescription("1234567890");
    expect(exactMin.isValid).toBe(true);
    expect(exactMin.trimmed).toBe("1234567890");

    const validWithSpaces = validateReportDescription(
      "   This is a valid accessibility report description.   ",
    );
    expect(validWithSpaces.isValid).toBe(true);
    expect(validWithSpaces.trimmed).toBe("This is a valid accessibility report description.");

    const tooLong = validateReportDescription("a".repeat(MAX_DESCRIPTION_LENGTH + 1));
    expect(tooLong.isValid).toBe(false);
    expect(tooLong.message).toContain(`cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`);
  });

  it("validates allowed evidence MIME types", () => {
    expect(isValidEvidenceMimeType("image/jpeg")).toBe(true);
    expect(isValidEvidenceMimeType("image/png")).toBe(true);
    expect(isValidEvidenceMimeType("image/webp")).toBe(true);
    expect(isValidEvidenceMimeType("image/gif")).toBe(false);
    expect(isValidEvidenceMimeType("application/pdf")).toBe(false);
    expect(isValidEvidenceMimeType("text/html")).toBe(false);
  });

  it("validates evidence file size thresholds", () => {
    const tooSmall = validateEvidenceFile({ type: "image/jpeg", size: 500 });
    expect(tooSmall.isValid).toBe(false);
    expect(tooSmall.message).toContain("Minimum size is 1 KB");

    const exactMin = validateEvidenceFile({ type: "image/jpeg", size: 1024 });
    expect(exactMin.isValid).toBe(true);

    const validNormal = validateEvidenceFile({ type: "image/png", size: 2 * 1024 * 1024 });
    expect(validNormal.isValid).toBe(true);

    const tooBig = validateEvidenceFile({ type: "image/webp", size: 6 * 1024 * 1024 });
    expect(tooBig.isValid).toBe(false);
    expect(tooBig.message).toContain("exceeds 5 MB limit");

    const wrongType = validateEvidenceFile({ type: "image/gif", size: 2048 });
    expect(wrongType.isValid).toBe(false);
    expect(wrongType.message).toContain("Unsupported file type");
  });

  it("maps MIME types to file extensions safely", () => {
    expect(getFileExtensionFromMime("image/jpeg")).toBe("jpg");
    expect(getFileExtensionFromMime("image/png")).toBe("png");
    expect(getFileExtensionFromMime("image/webp")).toBe("webp");
    expect(getFileExtensionFromMime("unknown/mime")).toBe("bin");
  });
});
