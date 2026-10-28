/**
 * Formats news published dates into human-readable relative time:
 * "Just now", "Today", "Yesterday", "2 days ago", "X days ago"
 * Only uses absolute dates (e.g. "Oct 15, 2026") when older than 7 days.
 */
export function formatNewsDate(dateStr?: string | null): string {
  if (!dateStr || !dateStr.trim()) return 'Recently';

  const clean = dateStr.trim();
  const parsed = new Date(clean);

  // If Date constructor failed
  if (isNaN(parsed.getTime())) {
    // Try cleaning RFC 2822 or common timezone quirks
    const cleaned = clean.replace(/(\+\d{4}|\b[A-Z]{3,4}\b)$/, '').trim();
    const secondTry = new Date(cleaned);
    if (isNaN(secondTry.getTime())) {
      return clean;
    }
    return formatRelativeFromDate(secondTry);
  }

  return formatRelativeFromDate(parsed);
}

function formatRelativeFromDate(d: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();

  // Handle future or clock-skew
  if (diffMs < 0) {
    return 'Today';
  }

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  // Check if it occurred on the same calendar day
  const isSameDay =
    now.getFullYear() === d.getFullYear() &&
    now.getMonth() === d.getMonth() &&
    now.getDate() === d.getDate();

  if (isSameDay) {
    if (diffHours < 1) {
      if (diffMinutes < 5) return 'Just now';
      return `${diffMinutes}m ago`;
    }
    return `Today (${diffHours}h ago)`;
  }

  // Check yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    yesterday.getFullYear() === d.getFullYear() &&
    yesterday.getMonth() === d.getMonth() &&
    yesterday.getDate() === d.getDate();

  if (isYesterday || (diffHours >= 20 && diffHours < 48)) {
    return 'Yesterday';
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays === 2) {
    return '2 days ago';
  }

  if (diffDays >= 3 && diffDays <= 6) {
    return `${diffDays} days ago`;
  }

  // 7 days or greater -> format as readable calendar date: e.g. "Oct 21, 2026"
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: now.getFullYear() === d.getFullYear() ? undefined : 'numeric'
  });
}
