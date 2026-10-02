/**
 * Capas de textura fijas: grano cinematografico, scanlines y viñeta.
 *
 * El grano es un feTurbulence de SVG convertido en una imagen de fondo repetida.
 * Se rasteriza una sola vez y se tilea, en lugar de mantener un filtro vivo sobre
 * toda la pantalla, que es caro en moviles. No carga ningun archivo externo y no
 * bloquea la interaccion.
 */
export function Grain() {
  return (
    <>
      <div className="vignette" aria-hidden="true" />
      <div className="scanline-layer" aria-hidden="true" />
      <div className="grain-layer" aria-hidden="true" />
    </>
  );
}
