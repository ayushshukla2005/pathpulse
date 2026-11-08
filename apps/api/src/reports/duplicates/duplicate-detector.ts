import { ReportCategory, ReportStatus } from "../workflow/types";

export interface CandidateReport {
  id: string;
  trackingCode: string;
  venueId: string | null;
  facilityId: string | null;
  category: ReportCategory;
  title: string | null;
  description: string;
  status: ReportStatus;
  createdAt: Date | string;
}

export interface DuplicateSuggestion {
  candidateId: string;
  trackingCode: string;
  title: string | null;
  similarity: number;
  status: ReportStatus;
  createdAt: string;
}

export interface DuplicateOptions {
  threshold?: number;
  windowDays?: number;
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "he",
  "in",
  "is",
  "it",
  "its",
  "of",
  "on",
  "that",
  "the",
  "to",
  "was",
  "were",
  "will",
  "with",
]);

export function tokenizeText(text: string): Set<string> {
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const words = normalized.split(/\s+/).filter((word) => word.length > 2 && !STOP_WORDS.has(word));
  return new Set(words);
}

export function computeJaccardSimilarity(textA: string, textB: string): number {
  const setA = tokenizeText(textA);
  const setB = tokenizeText(textB);

  if (setA.size === 0 && setB.size === 0) {
    return 0;
  }

  let intersectionCount = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersectionCount += 1;
    }
  }

  const unionCount = setA.size + setB.size - intersectionCount;
  if (unionCount === 0) {
    return 0;
  }

  return Number((intersectionCount / unionCount).toFixed(4));
}

export function findDuplicateCandidates(
  targetReport: CandidateReport,
  openReports: CandidateReport[],
  options?: DuplicateOptions,
): DuplicateSuggestion[] {
  const threshold = options?.threshold ?? 0.5;
  const windowDays = options?.windowDays ?? 30;
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  const targetTime = new Date(targetReport.createdAt).getTime();
  const targetFullText = `${targetReport.title ?? ""} ${targetReport.description}`;

  const suggestions: DuplicateSuggestion[] = [];

  for (const candidate of openReports) {
    if (candidate.id === targetReport.id) {
      continue;
    }

    if (candidate.status === "CLOSED" || candidate.status === "REJECTED") {
      continue;
    }

    if (candidate.category !== targetReport.category) {
      continue;
    }

    const matchesFacility =
      targetReport.facilityId !== null &&
      candidate.facilityId !== null &&
      targetReport.facilityId === candidate.facilityId;

    const matchesVenue =
      targetReport.venueId !== null &&
      candidate.venueId !== null &&
      targetReport.venueId === candidate.venueId;

    if (!matchesFacility && !matchesVenue) {
      continue;
    }

    const candidateTime = new Date(candidate.createdAt).getTime();
    if (Math.abs(targetTime - candidateTime) > windowMs) {
      continue;
    }

    const candidateFullText = `${candidate.title ?? ""} ${candidate.description}`;
    const similarity = computeJaccardSimilarity(targetFullText, candidateFullText);

    if (similarity >= threshold) {
      suggestions.push({
        candidateId: candidate.id,
        trackingCode: candidate.trackingCode,
        title: candidate.title,
        similarity,
        status: candidate.status,
        createdAt: new Date(candidate.createdAt).toISOString(),
      });
    }
  }

  suggestions.sort((a, b) => b.similarity - a.similarity);
  return suggestions;
}
