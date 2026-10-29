const RAW_API_BASE = (import.meta.env.VITE_API_BASE ?? '/api').trim().replace(/\/+$/, '');
const API_BASE = RAW_API_BASE.endsWith('/api') ? RAW_API_BASE : `${RAW_API_BASE}/api`;

/**
 * Resolves an avatar URL, automatically routing Instagram, TikTok, and other restricted
 * social media CDN URLs through the backend proxy to bypass browser ad-blockers (Brave/uBlock)
 * and cross-origin hotlink protections.
 */
export function resolveAvatarUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  const isRestrictedCdn =
    trimmed.includes('cdninstagram.com') ||
    trimmed.includes('fbcdn.net') ||
    trimmed.includes('tiktokcdn.com');

  if (isRestrictedCdn) {
    return `${API_BASE}/social/avatar-proxy?url=${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
}

/**
 * Fallback handler for image load errors on avatar elements.
 */
export function handleAvatarError(event: Event, fallbackName = 'Creator') {
  const img = event.currentTarget as HTMLImageElement;
  if (!img) return;

  const currentSrc = img.getAttribute('src') || '';

  // If failed directly and not yet proxied, retry through our proxy
  if (currentSrc.startsWith('http') && !currentSrc.includes('/social/avatar-proxy')) {
    img.src = `${API_BASE}/social/avatar-proxy?url=${encodeURIComponent(currentSrc)}`;
    return;
  }

  // Graceful inline SVG initials avatar instead of a broken image icon
  const letter = (fallbackName || 'C').trim().charAt(0).toUpperCase() || 'C';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#1d0a2e"/><circle cx="50" cy="50" r="48" fill="none" stroke="#7e22ce" stroke-width="2"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="#fbbf24" font-family="system-ui, -apple-system, sans-serif" font-weight="bold" font-size="42">${letter}</text></svg>`;
  img.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
