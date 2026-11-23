/**
 * Flies a small copy of `from` along an arc to the navbar cart button
 * (the element marked data-cart-target). No-op under reduced motion.
 */
export function flyToCart(from: HTMLElement | null) {
  if (typeof window === 'undefined' || !from) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-cart-target]'));
  const target = targets.find((el) => el.offsetParent !== null) ?? targets[0];
  if (!target) return;

  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const size = 56;
  const sx = a.left + a.width / 2 - size / 2;
  const sy = a.top + a.height / 2 - size / 2;
  const dx = b.left + b.width / 2 - size / 2 - sx;
  const dy = b.top + b.height / 2 - size / 2 - sy;

  const el = document.createElement('div');
  const img = from.querySelector('img');
  Object.assign(el.style, {
    position: 'fixed',
    left: `${sx}px`,
    top: `${sy}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '9999px',
    zIndex: '95',
    pointerEvents: 'none',
    background: img?.src
      ? `center / contain no-repeat #fff url("${img.src}")`
      : 'linear-gradient(135deg, hsl(173 82% 45%), hsl(188 95% 48%))',
    boxShadow: '0 8px 28px rgba(20,209,184,.55)',
    border: '2px solid hsl(173 82% 45%)',
  } as CSSStyleDeclaration);
  document.body.appendChild(el);

  const lift = Math.min(120, Math.abs(dy) * 0.35 + 40);
  const anim = el.animate(
    [
      { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 0 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - lift}px) scale(.8)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(.18)`, opacity: 0.4, offset: 1 },
    ],
    { duration: 750, easing: 'cubic-bezier(.5,0,.75,.4)' }
  );
  anim.onfinish = () => el.remove();
  anim.oncancel = () => el.remove();
}
