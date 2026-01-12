/**
 * Calculate Levenshtein distance between two strings
 * Returns a value from 0 to 1, where 1 means identical strings
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  const matrix: number[][] = [];
  
  // Initialize first column
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  
  // Initialize first row
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill the matrix
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2[i - 1] === s1[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  const maxLength = Math.max(s1.length, s2.length);
  const distance = matrix[s2.length][s1.length];
  
  return 1 - distance / maxLength;
}

/**
 * Check if two recipe titles are similar enough to be considered duplicates
 * @param title1 First title
 * @param title2 Second title
 * @param threshold Similarity threshold (0.8 = 80% similar)
 */
export function areSimilar(title1: string, title2: string, threshold: number = 0.8): boolean {
  return calculateSimilarity(title1, title2) >= threshold;
}
