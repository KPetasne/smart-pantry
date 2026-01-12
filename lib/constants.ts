/**
 * Application-wide constants
 * Centralized configuration values to avoid magic numbers and improve maintainability
 */

// Rate Limiting
export const RATE_LIMITS = {
  VOTES_PER_HOUR: 5,
  VOTES_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  LOGIN_ATTEMPTS: 5,
  LOGIN_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
} as const;

// Database
export const DB_CONFIG = {
  MAX_POOL_SIZE: 20,
  IDLE_TIMEOUT_MS: 30000, // 30 seconds
  CONNECTION_TIMEOUT_MS: 10000, // 10 seconds
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Recipe Validation
export const RECIPE_LIMITS = {
  MIN_INGREDIENTS: 1,
  MAX_INGREDIENTS: 50,
  MIN_INSTRUCTIONS: 1,
  MAX_INSTRUCTIONS: 50,
  MIN_SERVINGS: 1,
  MAX_SERVINGS: 12,
  MIN_PREP_TIME: 1,
  MAX_PREP_TIME: 480, // 8 hours
  MIN_COOK_TIME: 0,
  MAX_COOK_TIME: 720, // 12 hours
} as const;

// Cache
export const CACHE_TTL = {
  RECIPE_SEARCH: 60 * 60, // 1 hour
  STATS: 5 * 60, // 5 minutes
  ANALYTICS: 60 * 60 * 24, // 24 hours
} as const;

// Admin Scripts
export const SCRIPT_EXECUTION = {
  CLEANUP_TIMEOUT_MS: 60 * 60 * 1000, // 1 hour to cleanup execution logs
  DEFAULT_BATCH_SIZE: 2,
  DEFAULT_TARGET_RECIPES: 20,
} as const;

// Gemini Models
export const GEMINI_MODELS = [
  'gemini-3-pro-preview',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
  'gemini-2.0-flash'
] as const;

export type GeminiModel = typeof GEMINI_MODELS[number];

// Difficulty levels
export const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'] as const;
export type Difficulty = typeof DIFFICULTY_LEVELS[number];

// Supported countries
export const COUNTRIES = [
  'argentina',
  'mexico',
  'italy',
  'spain',
  'usa',
  'peru',
  'japan',
  'china'
] as const;

export type Country = typeof COUNTRIES[number];
