/**
 * Svelte Action: reveal
 * Automatically reveals elements with smooth CSS transitions when they enter the viewport.
 */
export interface RevealOptions {
  threshold?: number;
  rootMargin?: string;
  delay?: number;
  once?: boolean;
}

export function reveal(node: HTMLElement, options: RevealOptions = {}) {
  const {
    threshold = 0.08,
    rootMargin = '0px 0px -30px 0px',
    delay = 0,
    once = true
  } = options;

  // Add initial reveal setup class
  node.classList.add('reveal-init');
  if (delay > 0) {
    node.style.transitionDelay = `${delay}ms`;
  }

  // Check if IntersectionObserver is supported
  if (typeof IntersectionObserver === 'undefined') {
    node.classList.add('in-view');
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          node.classList.add('in-view');
          if (once) {
            observer.unobserve(node);
          }
        } else if (!once) {
          node.classList.remove('in-view');
        }
      });
    },
    { threshold, rootMargin }
  );

  observer.observe(node);

  return {
    update(newOptions: RevealOptions) {
      if (newOptions.delay !== undefined) {
        node.style.transitionDelay = `${newOptions.delay}ms`;
      }
    },
    destroy() {
      observer.disconnect();
    }
  };
}
