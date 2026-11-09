import { apiClient } from "./client";

export interface CreateFeedbackPayload {
  message: string;
  category?: string;
  honeypot?: string;
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
}

export async function submitFeedback(payload: CreateFeedbackPayload): Promise<FeedbackResponse> {
  return apiClient<FeedbackResponse>("/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
