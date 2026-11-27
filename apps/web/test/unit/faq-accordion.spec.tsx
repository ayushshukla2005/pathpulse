import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FaqAccordion, type FaqItem } from "@/components/contact/faq-accordion";

const TEST_ITEMS: FaqItem[] = [
  {
    id: "compliance",
    question: "Does PathPulse certify venue accessibility?",
    answer: "No. PathPulse provides navigational assistance, not certification.",
  },
  {
    id: "routing",
    question: "How are step-free routes calculated?",
    answer: "Step-free routes strictly omit stairs and use confirmed facilities.",
  },
];

describe("FaqAccordion Component", () => {
  it("renders all accordion questions with initial collapsed state", () => {
    render(<FaqAccordion items={TEST_ITEMS} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);

    expect(buttons[0]).toHaveAttribute("aria-expanded", "false");
    expect(buttons[0]).toHaveAttribute("aria-controls", "faq-panel-compliance");

    expect(buttons[1]).toHaveAttribute("aria-expanded", "false");
    expect(buttons[1]).toHaveAttribute("aria-controls", "faq-panel-routing");

    const compliancePanel = document.getElementById("faq-panel-compliance");
    expect(compliancePanel).toBeInTheDocument();
    expect(compliancePanel).toHaveAttribute("role", "region");
    expect(compliancePanel).toHaveAttribute("aria-labelledby", "faq-trigger-compliance");
    expect(compliancePanel).toHaveAttribute("hidden");
  });

  it("toggles panel expansion on button click", () => {
    render(<FaqAccordion items={TEST_ITEMS} />);

    const button = screen.getByRole("button", {
      name: /Does PathPulse certify venue accessibility\?/i,
    });
    const panel = document.getElementById("faq-panel-compliance");

    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(panel).toHaveAttribute("hidden");

    fireEvent.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(panel).not.toHaveAttribute("hidden");
    expect(panel).toHaveTextContent("No. PathPulse provides navigational assistance");

    fireEvent.click(button);

    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(panel).toHaveAttribute("hidden");
  });

  it("toggles panel expansion on Enter key press", () => {
    render(<FaqAccordion items={TEST_ITEMS} />);

    const button = screen.getByRole("button", {
      name: /How are step-free routes calculated\?/i,
    });
    const panel = document.getElementById("faq-panel-routing");

    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(panel).toHaveAttribute("hidden");

    fireEvent.keyDown(button, { key: "Enter" });

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(panel).not.toHaveAttribute("hidden");
    expect(panel).toHaveTextContent("Step-free routes strictly omit stairs");

    fireEvent.keyDown(button, { key: "Enter" });

    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(panel).toHaveAttribute("hidden");
  });

  it("toggles panel expansion on Space key press", () => {
    render(<FaqAccordion items={TEST_ITEMS} />);

    const button = screen.getByRole("button", {
      name: /Does PathPulse certify venue accessibility\?/i,
    });
    const panel = document.getElementById("faq-panel-compliance");

    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(panel).toHaveAttribute("hidden");

    fireEvent.keyDown(button, { key: " " });

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(panel).not.toHaveAttribute("hidden");

    fireEvent.keyDown(button, { key: " " });

    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(panel).toHaveAttribute("hidden");
  });

  it("does not toggle panel on other keys such as ArrowDown or Tab", () => {
    render(<FaqAccordion items={TEST_ITEMS} />);

    const button = screen.getByRole("button", {
      name: /Does PathPulse certify venue accessibility\?/i,
    });
    const panel = document.getElementById("faq-panel-compliance");

    fireEvent.keyDown(button, { key: "ArrowDown" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(panel).toHaveAttribute("hidden");

    fireEvent.keyDown(button, { key: "Tab" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(panel).toHaveAttribute("hidden");
  });
});
