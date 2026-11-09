import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../database/prisma.service";
import { FeedbackService } from "./feedback.service";

describe("FeedbackService", () => {
  let service: FeedbackService;
  let mockPrisma: {
    feedback: {
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    mockPrisma = {
      feedback: {
        create: jest.fn().mockResolvedValue({
          id: "feed-123",
          message: "A serious barrier exists on level 2",
          category: "ACCESSIBILITY",
          user_id: null,
          created_at: new Date(),
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<FeedbackService>(FeedbackService);
  });

  it("stores feedback with null user_id when anonymous and does not return stored content", async () => {
    const res = await service.submitFeedback({
      message: "A serious barrier exists on level 2",
      category: "ACCESSIBILITY",
    });

    expect(mockPrisma.feedback.create).toHaveBeenCalledWith({
      data: {
        message: "A serious barrier exists on level 2",
        category: "ACCESSIBILITY",
        user_id: null,
      },
    });

    expect(res).toEqual({
      success: true,
      message: "Thank you for your feedback. Our team has received your message.",
    });
    expect((res as unknown as Record<string, unknown>).id).toBeUndefined();
    expect((res as unknown as Record<string, unknown>).message_body).toBeUndefined();
  });

  it("stores feedback with user_id when user is authenticated", async () => {
    const res = await service.submitFeedback(
      {
        message: "Elevator buttons are too high for wheelchair users",
      },
      "user-logged-in-456",
    );

    expect(mockPrisma.feedback.create).toHaveBeenCalledWith({
      data: {
        message: "Elevator buttons are too high for wheelchair users",
        category: "GENERAL",
        user_id: "user-logged-in-456",
      },
    });

    expect(res.success).toBe(true);
  });

  it("silently rejects when honeypot field is filled without calling database", async () => {
    const res = await service.submitFeedback({
      message: "Spam link http://example.com/buy-now",
      honeypot: "https://bot-trap.com",
    });

    expect(mockPrisma.feedback.create).not.toHaveBeenCalled();
    expect(res.success).toBe(true);
  });
});
