import { Item } from '../types';

/**
 * Normalizes text for searching (lowercasing, unicode decomposition, removing zero-width characters).
 */
export function normalizeSearchText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();
}

/**
 * Checks if all characters of query exist in target in sequential order (Subsequence / Fuzzy Char match).
 * e.g., "iphn" -> "iphone", "กป" -> "กระเป๋าสตางค์", "กุญ" -> "พวงกุญแจ"
 */
export function isSubsequenceMatch(query: string, target: string): boolean {
  if (!query || !target) return false;
  let qIdx = 0;
  let tIdx = 0;
  while (qIdx < query.length && tIdx < target.length) {
    if (query[qIdx] === target[tIdx]) {
      qIdx++;
    }
    tIdx++;
  }
  return qIdx === query.length;
}

/**
 * Checks if target matches query using multiple matching strategies:
 * 1. Exact substring
 * 2. Word token match (all words in search term present anywhere)
 * 3. Any token match (at least one significant word matches)
 * 4. Character subsequence (letters match in order)
 */
export function matchItemWithSearch(item: Item, rawQuery: string): { isMatch: boolean; score: number } {
  const query = normalizeSearchText(rawQuery);
  if (!query) return { isMatch: true, score: 0 };

  const title = normalizeSearchText(item.title);
  const desc = normalizeSearchText(item.description);
  const location = normalizeSearchText(item.location);
  const currentLocation = normalizeSearchText(item.currentLocation);
  const category = normalizeSearchText(item.category);
  const authorName = normalizeSearchText(item.authorName);
  const contact = normalizeSearchText(item.contact);

  const combined = `${title} ${category} ${location} ${currentLocation} ${desc} ${authorName} ${contact}`;

  // 1. Direct exact phrase match in title (Highest priority)
  if (title.includes(query)) {
    return { isMatch: true, score: 100 + (title.startsWith(query) ? 50 : 0) };
  }

  // 2. Direct exact phrase match in location or category
  if (location.includes(query) || category.includes(query)) {
    return { isMatch: true, score: 80 };
  }

  // 3. Direct exact phrase match in description or other fields
  if (combined.includes(query)) {
    return { isMatch: true, score: 70 };
  }

  // 4. Token-based matching (e.g. user typed "บัตร แดง" or "airpod ดำ")
  const tokens = query.split(/\s+/).filter(t => t.length > 0);
  if (tokens.length > 1) {
    const allTokensMatch = tokens.every(token => combined.includes(token));
    if (allTokensMatch) {
      return { isMatch: true, score: 60 };
    }

    // Partial tokens match
    const matchedCount = tokens.filter(token => combined.includes(token)).length;
    if (matchedCount >= Math.ceil(tokens.length * 0.6)) {
      return { isMatch: true, score: 40 + matchedCount * 5 };
    }
  }

  // 5. Character-by-character subsequence match (Fuzzy char match)
  // For queries of 2 or more characters
  if (query.length >= 2) {
    if (isSubsequenceMatch(query, title)) {
      return { isMatch: true, score: 50 };
    }
    if (isSubsequenceMatch(query, location) || isSubsequenceMatch(query, category)) {
      return { isMatch: true, score: 35 };
    }
    if (isSubsequenceMatch(query, desc)) {
      return { isMatch: true, score: 25 };
    }
  }

  // 6. Character presence / character-level intersection (for Thai words where spelling might be slightly off)
  // If query is short (>= 3 chars) and shares >= 80% unique characters with title
  if (query.length >= 3) {
    const queryChars = Array.from(new Set(query.replace(/\s+/g, '')));
    const titleChars = new Set(Array.from(title));
    const matchedChars = queryChars.filter(c => titleChars.has(c));
    const ratio = matchedChars.length / queryChars.length;
    if (ratio >= 0.85 && query.length <= 10) {
      return { isMatch: true, score: 20 };
    }
  }

  return { isMatch: false, score: 0 };
}
