import type {
  AIScoringPort,
  ContactChannel,
  RiskSegment,
  ScoreDebtInput,
  ScoringResult
} from "@cobrai/ports";

const MODEL_VERSION = "stub-portfolios-1.0";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function segmentFromScore(score: number): RiskSegment {
  if (score < 30) return "critical";
  if (score < 50) return "high";
  if (score < 70) return "medium";
  if (score < 85) return "low";
  return "minimal";
}

function bestChannel(
  score: number,
  hasWhatsapp: boolean
): ContactChannel {
  if (hasWhatsapp) return "whatsapp";
  if (score < 50) return "voice";
  return "email";
}

/** Stub de scoring según fórmula del MVP (etapa 1.1). */
export class StubAIScoringAdapter implements AIScoringPort {
  async scoreDebt(input: ScoreDebtInput): Promise<ScoringResult> {
    const { features } = input;
    const score = Math.round(
      clamp(
        100 - features.aging_days * 0.3 + (features.has_whatsapp ? 15 : 0),
        0,
        100
      )
    );
    const segment = segmentFromScore(score);

    return {
      score,
      segment,
      risk_level: segment,
      best_channel: bestChannel(score, features.has_whatsapp),
      best_contact_time: { days: ["mon", "tue", "wed", "thu", "fri"], hours: "09:00-18:00" },
      confidence: 0.8,
      model_version: MODEL_VERSION
    };
  }
}

export const AI_SCORING_PORT = Symbol("AI_SCORING_PORT");
