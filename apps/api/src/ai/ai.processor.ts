import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { PrismaService } from "../database/prisma.service";
import { AiClientService } from "./ai-client.service";

export interface AiClassificationJobData {
  reportId: string;
  description: string;
}

@Processor("report-ai-processing")
export class AiProcessor extends WorkerHost {
  private readonly logger = new Logger(AiProcessor.name);

  constructor(
    private readonly aiClient: AiClientService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<AiClassificationJobData>): Promise<void> {
    const { reportId, description } = job.data;
    const textLength = description ? description.length : 0;
    const startTime = Date.now();

    this.logger.log(
      `processing_ai_job jobId=${job.id} reportId=${reportId} textLength=${textLength}`,
    );

    const report = await this.prisma.issueReport.findUnique({
      where: { id: reportId },
      select: { id: true, category: true, status: true },
    });

    if (!report) {
      this.logger.warn(`ai_job_report_not_found jobId=${job.id} reportId=${reportId}`);
      return;
    }

    const classification = await this.aiClient.classifyReport({ description });

    if (!classification) {
      this.logger.warn(
        `ai_classification_unavailable jobId=${job.id} reportId=${reportId} durationMs=${Date.now() - startTime}`,
      );
      return;
    }

    await this.prisma.aiSuggestion.create({
      data: {
        report_id: reportId,
        kind: "CLASSIFICATION",
        payload: {
          category: classification.category,
          severity: classification.severity,
          confidence: classification.confidence,
        },
        model_version: classification.modelVersion,
        requires_human_verification: true,
      },
    });

    this.logger.log(
      `ai_suggestion_stored jobId=${job.id} reportId=${reportId} modelVersion=${classification.modelVersion} durationMs=${Date.now() - startTime}`,
    );
  }
}
