import { BadRequestException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { ReportsService } from "../reports.service";
import { StorageService } from "../storage.service";

describe("Evidence Limit & Concurrency Transaction Rules", () => {
  let reportsService: ReportsService;
  let prisma: Partial<PrismaService>;
  let storageService: Partial<StorageService>;

  const reporterUser = { id: "user-1", role: UserRole.USER };
  const reportId = "123e4567-e89b-12d3-a456-426614174000";

  beforeEach(() => {
    storageService = {
      getPresignedPutUrl: jest
        .fn()
        .mockResolvedValue("https://s3.localhost/pathpulse-evidence/reports/r1/e1.jpg?signed"),
    };
  });

  it("should reject the sixth evidence request when 5 active items exist", async () => {
    const txMock = {
      evidence: {
        count: jest.fn().mockResolvedValue(5),
        create: jest.fn(),
      },
    };

    prisma = {
      issueReport: {
        findFirst: jest.fn().mockResolvedValue({ id: reportId, user_id: reporterUser.id }),
      } as unknown as PrismaService["issueReport"],
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(txMock);
      }) as unknown as PrismaService["$transaction"],
    };

    reportsService = new ReportsService(prisma as PrismaService, storageService as StorageService);

    await expect(
      reportsService.createEvidence(
        reportId,
        { contentType: "image/jpeg", sizeBytes: 2048 },
        reporterUser,
      ),
    ).rejects.toThrow(BadRequestException);

    expect(txMock.evidence.create).not.toHaveBeenCalled();
  });

  it("should enforce transaction serialized check so concurrent requests cannot exceed five", async () => {
    let currentEvidenceCount = 4;

    const txMock = {
      evidence: {
        count: jest.fn().mockImplementation(async () => currentEvidenceCount),
        create: jest.fn().mockImplementation(async () => {
          currentEvidenceCount++;
          return {};
        }),
      },
    };

    prisma = {
      issueReport: {
        findFirst: jest.fn().mockResolvedValue({ id: reportId, user_id: reporterUser.id }),
      } as unknown as PrismaService["issueReport"],
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(txMock);
      }) as unknown as PrismaService["$transaction"],
    };

    reportsService = new ReportsService(prisma as PrismaService, storageService as StorageService);

    const firstRequest = reportsService.createEvidence(
      reportId,
      { contentType: "image/png", sizeBytes: 5000 },
      reporterUser,
    );

    const firstResult = await firstRequest;
    expect(firstResult.evidenceId).toBeDefined();
    expect(currentEvidenceCount).toBe(5);

    const secondRequest = reportsService.createEvidence(
      reportId,
      { contentType: "image/webp", sizeBytes: 3000 },
      reporterUser,
    );

    await expect(secondRequest).rejects.toThrow(BadRequestException);
    expect(currentEvidenceCount).toBe(5);
  });
});
