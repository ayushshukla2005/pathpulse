"use client";

import React, { useState } from "react";
import { submitFeedback } from "@/lib/api/feedback";

export function ContactForm() {
  const [category, setCategory] = useState("GENERAL");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 5) {
      setStatus("error");
      setErrorMessage("Please enter a message of at least 5 characters.");
      return;
    }
    if (message.length > 2000) {
      setStatus("error");
      setErrorMessage("Message cannot exceed 2000 characters.");
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    try {
      await submitFeedback({
        message: message.trim(),
        category,
        honeypot: honeypot.trim() || undefined,
      });
      setStatus("success");
      setMessage("");
      setHoneypot("");
    } catch {
      setStatus("error");
      setErrorMessage("Unable to send feedback at this time. Please try again later.");
    }
  };

  return (
    <div className="rounded-lg border-2 border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
      {status === "success" ? (
        <div
          id="feedback-success-banner"
          role="status"
          aria-live="polite"
          className="rounded-md border border-green-600 bg-green-50 p-6 text-center dark:bg-green-950/40"
        >
          <h2 className="text-xl font-bold text-green-900 dark:text-green-200 mb-2">
            Feedback Received
          </h2>
          <p className="text-sm text-green-800 dark:text-green-300 mb-6">
            Thank you for your feedback. Our team has received your message.
          </p>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]"
          >
            Submit Another Response
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {status === "error" && errorMessage && (
            <div
              role="alert"
              className="rounded-md border border-red-600 bg-red-50 p-4 text-sm text-red-900 dark:bg-red-950/40 dark:text-red-200"
            >
              {errorMessage}
            </div>
          )}

          <div>
            <label
              htmlFor="feedback-category"
              className="block text-sm font-bold text-[var(--foreground)] mb-1"
            >
              Feedback Category
            </label>
            <select
              id="feedback-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border-2 border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]"
            >
              <option value="GENERAL">General Inquiry</option>
              <option value="ACCESSIBILITY">Accessibility Feedback</option>
              <option value="BUG">Technical Bug / Issue</option>
              <option value="SUGGESTION">Feature Suggestion</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="feedback-message"
                className="block text-sm font-bold text-[var(--foreground)]"
              >
                Message <span className="text-red-600">*</span>
              </label>
              <span id="message-counter" className="text-xs text-[var(--muted-foreground)]">
                {message.length} / 2000
              </span>
            </div>
            <p id="message-hint" className="text-xs text-[var(--muted-foreground)] mb-2">
              Minimum 5 characters, maximum 2000 characters.
            </p>
            <textarea
              id="feedback-message"
              name="message"
              rows={5}
              required
              minLength={5}
              maxLength={2000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              aria-describedby="message-hint message-counter"
              className="w-full rounded-md border-2 border-[var(--border)] bg-[var(--background)] p-3 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]"
              placeholder="Describe your feedback, issue, or accessibility recommendation..."
            />
          </div>

          <div
            className="absolute left-[-9999px] top-auto width-[1px] height-[1px] overflow-hidden"
            aria-hidden="true"
          >
            <label htmlFor="website-field">Leave this field blank</label>
            <input
              type="text"
              id="website-field"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full sm:w-auto rounded-md bg-[var(--primary)] px-6 py-2.5 text-base font-bold text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)] cursor-pointer"
          >
            {status === "submitting" ? "Submitting..." : "Send Feedback"}
          </button>
        </form>
      )}
    </div>
  );
}
