// lib/healthCalculations.ts

// This file defines the scoring models for Google Fit data.
export interface BehavioralScores {
  activityScore: number; // Score from 0-100 (100 is good)
  sleepScore: number;    // Score from 0-100 (100 is good)
}

// --- Constants for Scoring ---
// We aim for 7.5 hours of sleep. More or less is penalized.
const HEALTHY_SLEEP_HOURS = 7.5;
// We aim for 8,000 steps. More is great, but 8k is the 100% mark.
const HEALTHY_STEP_COUNT = 8000;
// We'll cap the penalty for sleep deviation at 3 hours (e.g., < 4.5 or > 10.5)
const MAX_SLEEP_DEVIATION = 3.0;

/**
 * Calculates behavioral scores (0-100, where 100 is better) based on average sleep and activity.
 * @param avgSleepHours - The average hours of sleep per night over the last week.
 * @param avgStepCount - The average number of steps per day over the last week.
 * @returns An object containing activityScore and sleepScore.
 */
export const calculateBehavioralScores = (
  avgSleepHours: number,
  avgStepCount: number
): BehavioralScores => {

  // 1. Calculate Activity Score (0-100)
  // Simple percentage of the healthy step count, capped at 100.
  const activityScore = Math.min(100, (avgStepCount / HEALTHY_STEP_COUNT) * 100);

  // 2. Calculate Sleep Score (0-100)
  // This score penalizes deviation from the healthy average.
  const sleepDeviation = Math.abs(avgSleepHours - HEALTHY_SLEEP_HOURS);
  const clampedDeviation = Math.min(sleepDeviation, MAX_SLEEP_DEVIATION);
  // Calculate the "penalty" percentage from 0 to 100
  const sleepPenalty = (clampedDeviation / MAX_SLEEP_DEVIATION) * 100;
  // Final score is 100 minus the penalty.
  const sleepScore = 100 - sleepPenalty;

  return {
    activityScore: Math.round(activityScore),
    sleepScore: Math.round(sleepScore),
  };
};