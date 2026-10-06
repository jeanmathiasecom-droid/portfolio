// Impulsions qui circulent sur la grille du hero, façon signaux dans un schéma électrique.
(() => {
  const canvas = document.querySelector('.hero__fx');
  if (!canvas || !canvas.getContext) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const ctx = canvas.getContext('2d');
  const CELL = 48;          // même pas que la grille CSS (.hero::before)
  const MAX = 9;            // nombre d'impulsions simultanées
  let w = 0, h = 0, dpr = 1, pulses = [], raf = 0, visible = true, color = '#c2410c';

  const readColor = () => { color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || color; };

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn() {
    const horiz = Math.random() < 0.5;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const lane = horiz ? Math.floor(Math.random() * (h / CELL)) * CELL : Math.floor(Math.random() * (w / CELL)) * CELL;
    const span = horiz ? w : h;
    return { horiz, dir, lane, pos: dir > 0 ? -80 : span + 80, speed: 0.6 + Math.random() * 1.2, len: 60 + Math.random() * 90, span };
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    while (pulses.length < MAX) pulses.push(spawn());
    pulses = pulses.filter(p => {
      p.pos += p.speed * p.dir;
      const head = p.pos, tail = p.pos - p.len * p.dir;
      const [x1, y1, x2, y2] = p.horiz ? [tail, p.lane, head, p.lane] : [p.lane, tail, p.lane, head];
      const g = ctx.createLinearGradient(x1, y1, x2, y2);
      g.addColorStop(0, 'transparent');
      g.addColorStop(1, color);
      ctx.strokeStyle = g; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.75;
      ctx.beginPath(); ctx.moveTo(x1 - 0.5, y1 - 0.5); ctx.lineTo(x2 - 0.5, y2 - 0.5); ctx.stroke();
      ctx.globalAlpha = 1; ctx.fillStyle = color;           // tête de l'impulsion
      ctx.beginPath(); ctx.arc(x2 - 0.5, y2 - 0.5, 1.8, 0, Math.PI * 2); ctx.fill();
      return p.dir > 0 ? tail < p.span : tail > 0;
    });
    raf = requestAnimationFrame(draw);
  }

  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  const start = () => { if (!raf && visible && !document.hidden && !motion.matches) raf = requestAnimationFrame(draw); };
  const sync = () => { if (motion.matches) { stop(); ctx.clearRect(0, 0, w, h); } else start(); };

  // Pas de calcul quand le hero est hors écran ou l'onglet masqué (batterie).
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  motion.addEventListener('change', sync);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', readColor);
  addEventListener('resize', () => { resize(); pulses = []; });

  readColor(); resize(); sync();
})();
