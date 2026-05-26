/**
 * ICP Score Calculator for Grain's target market:
 * PSPs, travel wholesalers, cross-border payment companies, FX exposure businesses.
 *
 * Vertical weight (max 50):
 *   PAYMENTS / TREASURY = 50
 *   FINTECH = 40
 *   TRAVEL = 30
 *   SAAS = 20
 *   other = 10
 *
 * Size tier bonus (max 30):
 *   > 10,000 attendees = 30
 *   > 5,000 = 20
 *   > 1,000 = 10
 *   else = 5
 *
 * Max possible score: 80 (normalized to 0-100)
 */

const VERTICAL_WEIGHTS: Record<string, number> = {
  PAYMENTS: 50,
  TREASURY: 50,
  FINTECH: 40,
  TRAVEL: 30,
  SAAS: 20,
};

export function calculateIcpScore(vertical: string, estimatedSize: number): number {
  const verticalWeight = VERTICAL_WEIGHTS[vertical.toUpperCase()] ?? 10;

  let sizeBonus: number;
  if (estimatedSize > 10000) sizeBonus = 30;
  else if (estimatedSize > 5000) sizeBonus = 20;
  else if (estimatedSize > 1000) sizeBonus = 10;
  else sizeBonus = 5;

  const raw = verticalWeight + sizeBonus;
  // Normalize to 0-100 scale (max raw = 80)
  return Math.min(100, Math.round((raw / 80) * 100));
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-grain-gold";
  if (score >= 40) return "text-orange-400";
  return "text-grain-slate";
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return "Top Priority";
  if (score >= 60) return "High Fit";
  if (score >= 40) return "Medium Fit";
  return "Low Fit";
}
