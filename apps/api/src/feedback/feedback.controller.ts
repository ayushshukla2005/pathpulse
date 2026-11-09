import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AuthenticatedUser, CurrentUser } from "../common/decorators/current-user.decorator";
import { Public } from "../common/decorators/public.decorator";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";
import { FeedbackService, FeedbackSubmissionResult } from "./feedback.service";

@Controller("feedback")
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async submitFeedback(
    @Body() dto: CreateFeedbackDto,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<FeedbackSubmissionResult> {
    return this.feedbackService.submitFeedback(dto, user?.id);
  }
}
