/* Confeti de celebración (espejo de LienzoCelebracion) en modo
   continuo: el cañón no se apaga — recarga partículas indefinidamente
   mientras la pantalla de resultado viva y muere exactamente cuando el
   jugador navega (el canvas se desenlaza y el rAF se cancela solo).
   Pestaña oculta == frames congelados. Respeta reduced-motion. */

export function confeti(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const estilos = getComputedStyle(document.documentElement);
  const colorVar = (nombre: string, respaldo: string): string =>
    estilos.getPropertyValue(nombre).trim() || respaldo;
  const colores = [
    colorVar("--tema-acento", "#FBBF24"),
    colorVar("--tema-correcto", "#22C55E"),
    colorVar("--tema-boton", "#1E3A8A"),
    "#FFFFFF",
  ];

  const ancho = (canvas.width = canvas.offsetWidth || 600);
  const alto = (canvas.height = canvas.offsetHeight || 120);
  const TOTAL = 130;

  function nuevaParticula() {
    return {
      x: Math.random() * ancho,
      y: -20 - Math.random() * alto,
      w: 6 + Math.random() * 5,
      h: 9 + Math.random() * 7,
      vy: 2.4 + Math.random() * 2.6,
      vx: -1.1 + Math.random() * 2.2,
      angulo: Math.random() * Math.PI * 2,
      va: -0.16 + Math.random() * 0.32,
      color: colores[Math.floor(Math.random() * colores.length)],
    };
  }
  const particulas = Array.from({ length: TOTAL }, nuevaParticula);

  function marco(): void {
    if (!canvas.isConnected) return;   /* la pantalla cambió: morir */
    if (document.hidden) { requestAnimationFrame(marco); return; }
    ctx.clearRect(0, 0, ancho, alto);
    particulas.forEach((particula) => {
      particula.x += particula.vx;
      particula.y += particula.vy;
      particula.angulo += particula.va;
      if (particula.y > alto + 20) Object.assign(particula, nuevaParticula(), { y: -15 });
      ctx.save();
      ctx.translate(particula.x, particula.y);
      ctx.rotate(particula.angulo);
      ctx.fillStyle = particula.color;
      ctx.fillRect(-particula.w / 2, -particula.h / 2, particula.w, particula.h);
      ctx.restore();
    });
    requestAnimationFrame(marco);
  }
  requestAnimationFrame(marco);
}
