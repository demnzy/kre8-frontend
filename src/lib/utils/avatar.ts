const RAW_API_BASE = (import.meta.env.VITE_API_BASE ?? '/api').trim().replace(/\/+$/, '');
const API_BASE = RAW_API_BASE.endsWith('/api') ? RAW_API_BASE : `${RAW_API_BASE}/api`;

const RESTRICTED_CDN_KEYWORDS = [
  'cdninstagram.com',
  'fbcdn.net',
  'instagram.com',
  'tiktokcdn.com',
  'byteoversea.com',
  'ibyteimg.com',
  'twimg.com'
];

/**
 * Resolves an avatar or media thumbnail URL, automatically routing Instagram, TikTok,
 * and other restricted social media CDN URLs through the backend media proxy to bypass
 * browser ad-blockers (Brave/uBlock) and cross-origin hotlink protections.
 */
export function resolveMediaUrl(url?: string | null, kind: 'avatar' | 'thumbnail' = 'avatar'): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  const isRestrictedCdn = RESTRICTED_CDN_KEYWORDS.some((kw) => trimmed.includes(kw));

  if (isRestrictedCdn) {
    return `${API_BASE}/social/media-proxy?url=${encodeURIComponent(trimmed)}&kind=${kind}`;
  }

  return trimmed;
}

export const resolveAvatarUrl = (url?: string | null) => resolveMediaUrl(url, 'avatar');

/**
 * Fallback handler for image load errors on avatar elements.
 */
export function handleAvatarError(event: Event, fallbackName = 'Creator') {
  const img = event.currentTarget as HTMLImageElement;
  if (!img) return;

  const currentSrc = img.getAttribute('src') || '';

  // If failed directly and not yet proxied, retry through our proxy
  if (currentSrc.startsWith('http') && !currentSrc.includes('/social/')) {
    img.src = `${API_BASE}/social/media-proxy?url=${encodeURIComponent(currentSrc)}&kind=avatar`;
    return;
  }

  // Graceful inline SVG initials avatar instead of a broken image icon
  const letter = (fallbackName || 'C').trim().charAt(0).toUpperCase() || 'C';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#1d0a2e"/><circle cx="50" cy="50" r="48" fill="none" stroke="#7e22ce" stroke-width="2"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="#fbbf24" font-family="system-ui, -apple-system, sans-serif" font-weight="bold" font-size="42">${letter}</text></svg>`;
  img.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Fallback handler for image load errors on video or post thumbnails.
 */
export function handleThumbnailError(event: Event, title = 'Video') {
  const img = event.currentTarget as HTMLImageElement;
  if (!img) return;

  const currentSrc = img.getAttribute('src') || '';

  // If failed directly and not yet proxied, retry through our proxy
  if (currentSrc.startsWith('http') && !currentSrc.includes('/social/')) {
    img.src = `${API_BASE}/social/media-proxy?url=${encodeURIComponent(currentSrc)}&kind=thumbnail`;
    return;
  }

  // Graceful 16:9 dark video card placeholder with play icon instead of a broken image icon
  const cleanTitle = (title || 'Video').slice(0, 24).replace(/[<>&"']/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90"><rect width="160" height="90" fill="#140722"/><circle cx="80" cy="40" r="16" fill="#250d3c" stroke="#7e22ce" stroke-width="1.5"/><polygon points="76,33 88,40 76,47" fill="#fbbf24"/><text x="80" y="74" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="8" font-weight="500">${cleanTitle}</text></svg>`;
  img.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
