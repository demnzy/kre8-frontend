/**
 * Tracks whether the Kre8 backend is reachable.
 * Polls /health only while offline, and notifies listeners when the connection returns.
 */
const HEALTH_URL = (import.meta.env.VITE_API_BASE ?? '/api').replace(/\/api\/?$/, '') + '/health';
const POLL_MS = 5000;

class ConnectionState {
  online = $state(true);
  justReconnected = $state(false);

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<() => void>();

  markOnline() {
    if (this.online) return;
    this.online = true;
    this.stopPolling();
    this.justReconnected = true;
    setTimeout(() => (this.justReconnected = false), 3000);
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('Reconnect listener failed', e);
      }
    });
  }

  markOffline() {
    if (!this.online) return;
    this.online = false;
    this.justReconnected = false;
    this.startPolling();
  }

  /** Run a callback whenever the backend comes back online. Returns an unsubscribe function. */
  onReconnect(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  async checkNow(): Promise<boolean> {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(HEALTH_URL, { signal: ctrl.signal, cache: 'no-store' });
      clearTimeout(t);
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data && data.status === 'ok') {
          this.markOnline();
          return true;
        }
      }
    } catch {
      // still offline
    }
    return false;
  }

  private startPolling() {
    if (this.pollTimer) return;
    this.pollTimer = setInterval(() => this.checkNow(), POLL_MS);
  }

  private stopPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = null;
  }
}

export const connection = new ConnectionState();

