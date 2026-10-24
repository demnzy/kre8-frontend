/**
 * Dynamic metrics calculation utilities for Kre8 Creator Studio.
 */

export function calculateActivityStreak(dates: (string | Date | undefined | null)[]): number {
  if (!dates || dates.length === 0) return 0;

  const validDates = dates
    .filter(Boolean)
    .map(d => {
      const dt = new Date(d as string | Date);
      return isNaN(dt.getTime()) ? null : dt;
    })
    .filter((d): d is Date => d !== null);

  if (validDates.length === 0) return 0;

  const uniqueDayStamps = new Set(
    validDates.map(
      dt => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
    )
  );

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  let streak = 0;
  let curr = uniqueDayStamps.has(todayStr)
    ? new Date(today)
    : uniqueDayStamps.has(yesterdayStr)
    ? new Date(yesterday)
    : null;

  if (!curr) {
    return uniqueDayStamps.size > 0 ? 1 : 0;
  }

  while (true) {
    const dStr = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
    if (uniqueDayStamps.has(dStr)) {
      streak++;
      curr.setDate(curr.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function formatCompactNumber(num: number): string {
  if (!num || isNaN(num)) return '0';
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString();
}
