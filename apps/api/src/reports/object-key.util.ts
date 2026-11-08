import { BadRequestException } from "@nestjs/common";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MIME_EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function generateEvidenceObjectKey(
  reportId: string,
  evidenceId: string,
  mimeType: string,
): string {
  if (!UUID_REGEX.test(reportId)) {
    throw new BadRequestException("Invalid report ID format for object key");
  }

  if (!UUID_REGEX.test(evidenceId)) {
    throw new BadRequestException("Invalid evidence ID format for object key");
  }

  const extension = MIME_EXTENSION_MAP[mimeType];
  if (!extension) {
    throw new BadRequestException(`Unsupported MIME type: ${mimeType}`);
  }

  const cleanReportId = reportId.toLowerCase().trim();
  const cleanEvidenceId = evidenceId.toLowerCase().trim();

  return `reports/${cleanReportId}/${cleanEvidenceId}.${extension}`;
}
