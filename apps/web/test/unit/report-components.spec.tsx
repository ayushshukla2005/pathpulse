import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReportForm } from "@/components/reports/report-form";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/api/venues", () => ({
  getVenues: vi.fn().mockResolvedValue([
    {
      id: "v-test-1",
      name: "Main Campus Library",
      category: "EDUCATION",
      facilities: [
        {
          id: "fac-1",
          name: "Main Elevator",
          facility_type: "ELEVATOR",
        },
      ],
    },
  ]),
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("Report Barrier Components", () => {
  it("renders form elements with proper labels and accessible roles", async () => {
    renderWithClient(<ReportForm />);

    expect(screen.getByLabelText(/Barrier Category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Venue/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description of Barrier/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Latitude/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Longitude/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Photographs/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Submit Barrier Report/i })).toBeInTheDocument();
  });

  it("updates character count when typing description", () => {
    renderWithClient(<ReportForm />);

    const textarea = screen.getByLabelText(/Description of Barrier/i);
    expect(screen.getByText(/0 \/ 1000/i)).toBeInTheDocument();

    fireEvent.change(textarea, {
      target: { value: "Elevator buttons are completely non-responsive." },
    });

    expect(screen.getByText(/47 \/ 1000/i)).toBeInTheDocument();
  });

  it("prevents selecting more than 5 photographs", () => {
    renderWithClient(<ReportForm />);

    const fileInput = screen.getByLabelText(/Photographs/i);
    const mockFiles = Array.from({ length: 6 }, (_, i) => ({
      name: `photo-${i}.jpg`,
      size: 5000,
      type: "image/jpeg",
    })) as unknown as FileList;

    fireEvent.change(fileInput, { target: { files: mockFiles } });

    const matches = screen.getAllByText(/maximum of 5 photographs/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("rejects unsupported file extensions before submission", () => {
    renderWithClient(<ReportForm />);

    const fileInput = screen.getByLabelText(/Photographs/i);
    const unsupportedFile = [
      {
        name: "document.pdf",
        size: 5000,
        type: "application/pdf",
      },
    ] as unknown as FileList;

    fireEvent.change(fileInput, { target: { files: unsupportedFile } });

    const matches = screen.getAllByText(/not an accepted format/i);
    expect(matches.length).toBeGreaterThan(0);
  });
});
