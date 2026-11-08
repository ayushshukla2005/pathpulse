import { NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { EvidenceStatus, UserRole } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { ReportsService } from "../reports.service";
import { StorageService } from "../storage.service";

describe("Evidence Verification Step", () => {
  let reportsService: ReportsService;
  let prisma: Partial<PrismaService>;
  let storageService: Partial<StorageService>;

  const reporterUser = { id: "user-1", role: UserRole.USER };
  const otherUser = { id: "user-2", role: UserRole.USER };
  const evidenceId = "e1111111-1111-1111-1111-111111111111";
  const objectKey = "reports/r1/e1.jpg";

  const baseEvidence = {
    id: evidenceId,
    report_id: "report-1",
    object_key: objectKey,
    content_type: "image/jpeg",
    size_bytes: 2048,
    status: EvidenceStatus.PENDING_UPLOAD,
    created_at: new Date(),
    updated_at: new Date(),
    report: {
      id: "report-1",
      user_id: "user-1",
    },
  };

  let updateEvidenceMock: jest.Mock;
  let deleteObjectMock: jest.Mock;

  beforeEach(() => {
    updateEvidenceMock = jest.fn().mockResolvedValue({});
    deleteObjectMock = jest.fn().mockResolvedValue(undefined);

    prisma = {
      evidence: {
        findFirst: jest.fn().mockImplementation(({ where }) => {
          if (where.id === evidenceId && where.report?.user_id === reporterUser.id) {
            return Promise.resolve({ ...baseEvidence });
          }
          return Promise.resolve(null);
        }),
        update: updateEvidenceMock,
      } as unknown as PrismaService["evidence"],
    };

    storageService = {
      headObject: jest.fn(),
      deleteObject: deleteObjectMock,
      getPresignedPutUrl: jest.fn(),
      getPresignedGetUrl: jest.fn(),
    };

    reportsService = new ReportsService(prisma as PrismaService, storageService as StorageService);
  });

  it("should mark evidence as RECEIVED when ContentLength and ContentType match", async () => {
    (storageService.headObject as jest.Mock).mockResolvedValue({
      contentLength: 2048,
      contentType: "image/jpeg",
    });

    const result = await reportsService.completeEvidence(evidenceId, reporterUser);

    expect(result.status).toBe(EvidenceStatus.RECEIVED);
    expect(result.verified).toBe(true);
    expect(updateEvidenceMock).toHaveBeenCalledWith({
      where: { id: evidenceId },
      data: { status: EvidenceStatus.RECEIVED },
    });
    expect(deleteObjectMock).not.toHaveBeenCalled();
  });

  it("should reject and throw 422 when object does not exist in storage", async () => {
    (storageService.headObject as jest.Mock).mockResolvedValue(null);

    await expect(reportsService.completeEvidence(evidenceId, reporterUser)).rejects.toThrow(
      UnprocessableEntityException,
    );

    expect(updateEvidenceMock).toHaveBeenCalledWith({
      where: { id: evidenceId },
      data: { status: EvidenceStatus.REJECTED },
    });
    expect(deleteObjectMock).not.toHaveBeenCalled();
  });

  it("should reject, delete object from storage, and throw 422 when ContentLength does not match", async () => {
    (storageService.headObject as jest.Mock).mockResolvedValue({
      contentLength: 9999,
      contentType: "image/jpeg",
    });

    await expect(reportsService.completeEvidence(evidenceId, reporterUser)).rejects.toThrow(
      UnprocessableEntityException,
    );

    expect(updateEvidenceMock).toHaveBeenCalledWith({
      where: { id: evidenceId },
      data: { status: EvidenceStatus.REJECTED },
    });
    expect(deleteObjectMock).toHaveBeenCalledWith(objectKey);
  });

  it("should reject, delete object from storage, and throw 422 when ContentType does not match", async () => {
    (storageService.headObject as jest.Mock).mockResolvedValue({
      contentLength: 2048,
      contentType: "text/plain",
    });

    await expect(reportsService.completeEvidence(evidenceId, reporterUser)).rejects.toThrow(
      UnprocessableEntityException,
    );

    expect(updateEvidenceMock).toHaveBeenCalledWith({
      where: { id: evidenceId },
      data: { status: EvidenceStatus.REJECTED },
    });
    expect(deleteObjectMock).toHaveBeenCalledWith(objectKey);
  });

  it("should return 404 when requester is not the report owner", async () => {
    await expect(reportsService.completeEvidence(evidenceId, otherUser)).rejects.toThrow(
      NotFoundException,
    );

    expect(updateEvidenceMock).not.toHaveBeenCalled();
    expect(deleteObjectMock).not.toHaveBeenCalled();
  });
});
