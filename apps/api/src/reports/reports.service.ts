import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { EvidenceStatus, Prisma, ReportCategory, ReportStatus, UserRole } from "@prisma/client";
import { randomBytes, randomUUID } from "crypto";
import { AiSuggestionItem } from "@pathpulse/shared-types";
import { AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { PrismaService } from "../database/prisma.service";
import { CreateEvidenceDto } from "./dto/create-evidence.dto";
import { CreateReportDto } from "./dto/create-report.dto";
import { FindOrgReportsDto } from "./dto/find-org-reports.dto";
import { FindReportsDto } from "./dto/find-reports.dto";
import { generateEvidenceObjectKey } from "./object-key.util";
import { StorageService } from "./storage.service";

export interface SanitizedEvidence {
  id: string;
  report_id: string;
  content_type: string;
  size_bytes: number;
  status: EvidenceStatus;
  created_at: Date | string;
  updated_at: Date | string;
  presigned_url?: string;
}

export interface SanitizedReport {
  id: string;
  tracking_code: string;
  user_id: string;
  venue_id: string | null;
  facility_id: string | null;
  category: ReportCategory;
  title: string | null;
  description: string;
  status: ReportStatus;
  latitude: number | null;
  longitude: number | null;
  created_at: Date | string;
  updated_at: Date | string;
  evidence: SanitizedEvidence[];
  aiSuggestions?: AiSuggestionItem[];
  venue?: { id: string; name: string } | null;
  facility?: { id: string; name: string } | null;
}

export interface PaginatedReports {
  data: SanitizedReport[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateEvidenceResult {
  evidenceId: string;
  uploadUrl: string;
  expiresInSeconds: number;
}

export interface CompleteEvidenceResult {
  evidenceId: string;
  status: EvidenceStatus;
  verified: boolean;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    @InjectQueue("report-ai-processing") private readonly aiQueue?: Queue,
  ) {}

  generateTrackingCode(): string {
    const year = new Date().getFullYear();
    const hex = randomBytes(3).toString("hex").toUpperCase();
    return `PP-${year}-${hex}`;
  }

  async createReport(dto: CreateReportDto, user: AuthenticatedUser): Promise<SanitizedReport> {
    if (!dto.venueId && !dto.facilityId) {
      throw new BadRequestException("Either venueId or facilityId must be provided");
    }

    let venueId = dto.venueId;
    let facilityName: string | null = null;
    let venueName: string | null = null;

    if (dto.facilityId) {
      const facility = await this.prisma.facility.findUnique({
        where: { id: dto.facilityId },
        select: { id: true, name: true, venue_id: true },
      });
      if (!facility) {
        throw new NotFoundException(`Facility "${dto.facilityId}" not found`);
      }
      facilityName = facility.name;
      if (!venueId) {
        venueId = facility.venue_id;
      } else if (venueId !== facility.venue_id) {
        throw new BadRequestException(
          `Facility "${dto.facilityId}" does not belong to venue "${venueId}"`,
        );
      }
    }

    if (venueId) {
      const venue = await this.prisma.venue.findUnique({
        where: { id: venueId },
        select: { id: true, name: true },
      });
      if (!venue) {
        throw new NotFoundException(`Venue "${venueId}" not found`);
      }
      venueName = venue.name;
    }

    let trackingCode = this.generateTrackingCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      const existing = await this.prisma.issueReport.findUnique({
        where: { tracking_code: trackingCode },
        select: { id: true },
      });
      if (!existing) {
        isUnique = true;
      } else {
        trackingCode = this.generateTrackingCode();
        attempts++;
      }
    }

    const report = await this.prisma.issueReport.create({
      data: {
        tracking_code: trackingCode,
        user_id: user.id,
        venue_id: venueId,
        facility_id: dto.facilityId,
        category: dto.category,
        description: dto.description.trim(),
        status: ReportStatus.SUBMITTED,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
      include: {
        evidence: true,
      },
    });

    try {
      if (this.aiQueue && typeof this.aiQueue.add === "function") {
        await this.aiQueue.add(
          "classify-report",
          {
            reportId: report.id,
            description: report.description,
          },
          {
            attempts: 3,
            backoff: { type: "exponential", delay: 1000 },
            removeOnComplete: true,
          },
        );
      }
    } catch (queueError) {
      this.logger.warn(`Failed to enqueue AI classification job: ${queueError}`);
    }

    return {
      id: report.id,
      tracking_code: report.tracking_code,
      user_id: report.user_id,
      venue_id: report.venue_id,
      facility_id: report.facility_id,
      category: report.category,
      title: report.title,
      description: report.description,
      status: report.status,
      latitude: report.latitude,
      longitude: report.longitude,
      created_at: report.created_at,
      updated_at: report.updated_at,
      evidence: [],
      venue: venueId && venueName ? { id: venueId, name: venueName } : null,
      facility: dto.facilityId && facilityName ? { id: dto.facilityId, name: facilityName } : null,
    };
  }

  async getMyReports(user: AuthenticatedUser, query: FindReportsDto): Promise<PaginatedReports> {
    const page = query.page > 0 ? query.page : 1;
    const limit = query.limit > 0 && query.limit <= 100 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      this.prisma.issueReport.findMany({
        where: { user_id: user.id },
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
        include: {
          evidence: true,
          venue: { select: { id: true, name: true } },
          facility: { select: { id: true, name: true } },
        },
      }),
      this.prisma.issueReport.count({
        where: { user_id: user.id },
      }),
    ]);

    const data: SanitizedReport[] = reports.map((r) => ({
      id: r.id,
      tracking_code: r.tracking_code,
      user_id: r.user_id,
      venue_id: r.venue_id,
      facility_id: r.facility_id,
      category: r.category,
      title: r.title,
      description: r.description,
      status: r.status,
      latitude: r.latitude,
      longitude: r.longitude,
      created_at: r.created_at,
      updated_at: r.updated_at,
      evidence: r.evidence.map((ev) => ({
        id: ev.id,
        report_id: ev.report_id,
        content_type: ev.content_type,
        size_bytes: ev.size_bytes,
        status: ev.status,
        created_at: ev.created_at,
        updated_at: ev.updated_at,
      })),
      venue: r.venue,
      facility: r.facility,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getReportById(id: string, user: AuthenticatedUser): Promise<SanitizedReport> {
    let whereClause: Prisma.IssueReportWhereInput;

    if (user.role === UserRole.SUPER_ADMIN) {
      whereClause = { id };
    } else if (user.role === UserRole.ORGANIZATION_ADMIN) {
      whereClause = {
        id,
        OR: [
          { user_id: user.id },
          {
            venue: {
              organization: {
                members: {
                  some: {
                    user_id: user.id,
                    role: UserRole.ORGANIZATION_ADMIN,
                  },
                },
              },
            },
          },
        ],
      };
    } else {
      whereClause = {
        id,
        user_id: user.id,
      };
    }

    const report = await this.prisma.issueReport.findFirst({
      where: whereClause,
      include: {
        evidence: true,
        ai_suggestions: true,
        venue: {
          select: {
            id: true,
            name: true,
            organization_id: true,
          },
        },
        facility: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException(`Report "${id}" not found`);
    }

    const isOrgAdminOrSuper =
      user.role === UserRole.SUPER_ADMIN ||
      (user.role === UserRole.ORGANIZATION_ADMIN && report.user_id !== user.id);

    const sanitizedEvidence: SanitizedEvidence[] = await Promise.all(
      report.evidence.map(async (ev) => {
        let presignedUrl: string | undefined;
        if (isOrgAdminOrSuper && ev.status === EvidenceStatus.RECEIVED) {
          presignedUrl = await this.storageService.getPresignedGetUrl(ev.object_key, 300);
        }
        return {
          id: ev.id,
          report_id: ev.report_id,
          content_type: ev.content_type,
          size_bytes: ev.size_bytes,
          status: ev.status,
          created_at: ev.created_at,
          updated_at: ev.updated_at,
          presigned_url: presignedUrl,
        };
      }),
    );

    return {
      id: report.id,
      tracking_code: report.tracking_code,
      user_id: report.user_id,
      venue_id: report.venue_id,
      facility_id: report.facility_id,
      category: report.category,
      title: report.title,
      description: report.description,
      status: report.status,
      latitude: report.latitude,
      longitude: report.longitude,
      created_at: report.created_at,
      updated_at: report.updated_at,
      evidence: sanitizedEvidence,
      aiSuggestions: (
        (
          report as {
            ai_suggestions?: Array<{
              id: string;
              report_id: string;
              kind: string;
              payload: unknown;
              model_version: string;
              requires_human_verification: boolean;
              created_at: Date;
            }>;
          }
        ).ai_suggestions ?? []
      ).map((s) => ({
        id: s.id,
        reportId: s.report_id,
        kind: s.kind as "CLASSIFICATION" | "DUPLICATE_SCORES" | "SUMMARY",
        payload: s.payload as Record<string, unknown>,
        modelVersion: s.model_version,
        requiresHumanVerification: true as const,
        createdAt: s.created_at instanceof Date ? s.created_at.toISOString() : String(s.created_at),
      })),
      venue: report.venue ? { id: report.venue.id, name: report.venue.name } : null,
      facility: report.facility,
    };
  }

  async getOrganizationReports(
    orgId: string,
    user: AuthenticatedUser,
    query: FindOrgReportsDto,
  ): Promise<PaginatedReports> {
    if (user.role !== UserRole.SUPER_ADMIN) {
      const membership = await this.prisma.organizationMember.findUnique({
        where: {
          organization_id_user_id: {
            organization_id: orgId,
            user_id: user.id,
          },
        },
      });

      if (!membership || membership.role !== UserRole.ORGANIZATION_ADMIN) {
        throw new ForbiddenException("You do not have administrative access to this organization");
      }
    }

    const page = query.page > 0 ? query.page : 1;
    const limit = query.limit > 0 && query.limit <= 100 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const where: Prisma.IssueReportWhereInput = {
      venue: { organization_id: orgId },
      ...(query.status ? { status: query.status } : {}),
    };

    const [reports, total] = await Promise.all([
      this.prisma.issueReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
        include: {
          evidence: true,
          venue: { select: { id: true, name: true } },
          facility: { select: { id: true, name: true } },
        },
      }),
      this.prisma.issueReport.count({ where }),
    ]);

    const data: SanitizedReport[] = reports.map((r) => ({
      id: r.id,
      tracking_code: r.tracking_code,
      user_id: r.user_id,
      venue_id: r.venue_id,
      facility_id: r.facility_id,
      category: r.category,
      title: r.title,
      description: r.description,
      status: r.status,
      latitude: r.latitude,
      longitude: r.longitude,
      created_at: r.created_at,
      updated_at: r.updated_at,
      evidence: r.evidence.map((ev) => ({
        id: ev.id,
        report_id: ev.report_id,
        content_type: ev.content_type,
        size_bytes: ev.size_bytes,
        status: ev.status,
        created_at: ev.created_at,
        updated_at: ev.updated_at,
      })),
      venue: r.venue,
      facility: r.facility,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createEvidence(
    reportId: string,
    dto: CreateEvidenceDto,
    user: AuthenticatedUser,
  ): Promise<CreateEvidenceResult> {
    const report = await this.prisma.issueReport.findFirst({
      where: {
        id: reportId,
        user_id: user.id,
      },
      select: { id: true },
    });

    if (!report) {
      throw new NotFoundException(`Report "${reportId}" not found`);
    }

    const evidenceId = randomUUID();
    const objectKey = generateEvidenceObjectKey(reportId, evidenceId, dto.contentType);

    await this.prisma.$transaction(async (tx) => {
      const activeEvidenceCount = await tx.evidence.count({
        where: {
          report_id: reportId,
          status: { not: EvidenceStatus.REJECTED },
        },
      });

      if (activeEvidenceCount >= 5) {
        throw new BadRequestException("Maximum 5 evidence items allowed per report");
      }

      await tx.evidence.create({
        data: {
          id: evidenceId,
          report_id: reportId,
          object_key: objectKey,
          content_type: dto.contentType,
          size_bytes: dto.sizeBytes,
          status: EvidenceStatus.PENDING_UPLOAD,
        },
      });
    });

    const uploadUrl = await this.storageService.getPresignedPutUrl(
      objectKey,
      dto.contentType,
      dto.sizeBytes,
    );

    return {
      evidenceId,
      uploadUrl,
      expiresInSeconds: 900,
    };
  }

  async completeEvidence(
    evidenceId: string,
    user: AuthenticatedUser,
  ): Promise<CompleteEvidenceResult> {
    const evidence = await this.prisma.evidence.findFirst({
      where: {
        id: evidenceId,
        report: {
          user_id: user.id,
        },
      },
      include: {
        report: {
          select: {
            id: true,
            user_id: true,
          },
        },
      },
    });

    if (!evidence) {
      throw new NotFoundException(`Evidence "${evidenceId}" not found`);
    }

    if (evidence.status === EvidenceStatus.RECEIVED) {
      return {
        evidenceId: evidence.id,
        status: EvidenceStatus.RECEIVED,
        verified: true,
      };
    }

    const header = await this.storageService.headObject(evidence.object_key);

    if (!header) {
      await this.prisma.evidence.update({
        where: { id: evidenceId },
        data: { status: EvidenceStatus.REJECTED },
      });
      throw new UnprocessableEntityException("Uploaded evidence object does not exist in storage");
    }

    if (
      header.contentLength !== evidence.size_bytes ||
      header.contentType !== evidence.content_type
    ) {
      await Promise.all([
        this.prisma.evidence.update({
          where: { id: evidenceId },
          data: { status: EvidenceStatus.REJECTED },
        }),
        this.storageService.deleteObject(evidence.object_key),
      ]);

      throw new UnprocessableEntityException(
        `Uploaded object verification failed. Expected size: ${evidence.size_bytes}, got: ${header.contentLength}. Expected type: ${evidence.content_type}, got: ${header.contentType}.`,
      );
    }

    await this.prisma.evidence.update({
      where: { id: evidenceId },
      data: { status: EvidenceStatus.RECEIVED },
    });

    return {
      evidenceId: evidence.id,
      status: EvidenceStatus.RECEIVED,
      verified: true,
    };
  }
}
