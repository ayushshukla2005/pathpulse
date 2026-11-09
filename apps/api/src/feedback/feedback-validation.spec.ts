import { validate } from "class-validator";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";

describe("CreateFeedbackDto Validation", () => {
  it("passes validation for valid feedback message", async () => {
    const dto = new CreateFeedbackDto();
    dto.message = "This entrance has a high threshold preventing wheelchair access.";
    dto.category = "ACCESSIBILITY";

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it("fails validation when message is shorter than 5 characters", async () => {
    const dto = new CreateFeedbackDto();
    dto.message = "Bad";

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]?.property).toBe("message");
  });

  it("fails validation when message exceeds 2000 characters", async () => {
    const dto = new CreateFeedbackDto();
    dto.message = "A".repeat(2001);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]?.property).toBe("message");
  });

  it("allows honeypot field string for downstream silent rejection", async () => {
    const dto = new CreateFeedbackDto();
    dto.message = "Legitimate feedback text that happens to have honeypot set by bot";
    dto.honeypot = "http://spam.org";

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
