import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";

export interface FeedbackSubmissionResult {
  success: boolean;
  message: string;
}

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async submitFeedback(dto: CreateFeedbackDto, userId?: string): Promise<FeedbackSubmissionResult> {
    if (dto.honeypot && dto.honeypot.trim().length > 0) {
      return {
        success: true,
        message: "Thank you for your feedback.",
      };
    }

    await this.prisma.feedback.create({
      data: {
        message: dto.message.trim(),
        category: dto.category?.trim() || "GENERAL",
        user_id: userId || null,
      },
    });

    return {
      success: true,
      message: "Thank you for your feedback. Our team has received your message.",
    };
  }
}
