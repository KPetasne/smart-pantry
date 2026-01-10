import { query } from './db';

export interface SearchAnalytics {
  id: number;
  ingredients: string[];
  timestamp: Date;
}

/**
 * Track a search query for analytics
 */
export async function trackSearch(ingredients: string[]): Promise<void> {
  try {
    await query(
      'INSERT INTO search_analytics (ingredients) VALUES ($1::jsonb)',
      [JSON.stringify(ingredients)]
    );
  } catch (error) {
    // Don't throw - analytics failures shouldn't break the app
    console.error('Error tracking search analytics:', error);
  }
}

/**
 * Get most searched ingredient combinations
 */
export async function getPopularSearches(limit: number = 10): Promise<SearchAnalytics[]> {
  try {
    const results = await query<SearchAnalytics>(
      `SELECT id, ingredients, timestamp 
       FROM search_analytics 
       ORDER BY timestamp DESC 
       LIMIT $1`,
      [limit]
    );
    return results;
  } catch (error) {
    console.error('Error fetching popular searches:', error);
    return [];
  }
}

/**
 * Get search statistics
 */
export async function getSearchStats(): Promise<{
  totalSearches: number;
  uniqueCombinations: number;
  cacheHitRate?: number;
}> {
  try {
    const totalResult = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM search_analytics'
    );
    const totalSearches = parseInt(totalResult[0]?.count || '0');

    const uniqueResult = await query<{ count: string }>(
      'SELECT COUNT(DISTINCT ingredients::text) as count FROM search_analytics'
    );
    const uniqueCombinations = parseInt(uniqueResult[0]?.count || '0');

    return {
      totalSearches,
      uniqueCombinations,
    };
  } catch (error) {
    console.error('Error fetching search stats:', error);
    return {
      totalSearches: 0,
      uniqueCombinations: 0,
    };
  }
}
