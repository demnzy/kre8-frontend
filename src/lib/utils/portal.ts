/**
 * Svelte Action: portal
 * Teleports a DOM element directly to document.body so position: fixed overlays,
 * backdrops, and dialog modals always anchor to the browser viewport and are never
 * trapped inside scrolling or transformed parent containers.
 */
export function portal(node: HTMLElement, target: string | HTMLElement = 'body') {
  function getTarget(): HTMLElement | null {
    if (typeof document === 'undefined') return null;
    if (typeof target === 'string') {
      return document.querySelector(target) || document.body;
    }
    return target || document.body;
  }

  let targetEl = getTarget();

  if (targetEl && node.parentNode !== targetEl) {
    targetEl.appendChild(node);
  }

  return {
    update(newTarget: string | HTMLElement) {
      target = newTarget;
      const nextTargetEl = getTarget();
      if (nextTargetEl && nextTargetEl !== targetEl && node.parentNode !== nextTargetEl) {
        nextTargetEl.appendChild(node);
        targetEl = nextTargetEl;
      }
    },
    destroy() {
      if (node && node.parentNode) {
        node.parentNode.removeChild(node);
      }
    }
  };
}

