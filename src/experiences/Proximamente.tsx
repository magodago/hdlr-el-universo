import { Badge } from '../components/Badge';
import { EXPERIENCES, findExperience } from '../data/experiences';
import { Link, ROUTES } from '../lib/router';

interface ProximamenteProps {
  path: string;
}

/**
 * Pantalla para las experiencias con ruta reservada pero todavia sin construir.
 * No es un enlace muerto: explica que habra aqui, cuando y que hay abierto ahora mismo.
 */
export function Proximamente({ path }: ProximamenteProps) {
  const experience = findExperience(path);
  const abiertas = EXPERIENCES.filter((item) => item.status === 'listo');

  return (
    <section className="relative flex min-h-[100svh] flex-col justify-center px-4 pt-32 pb-20 sm:px-8">
      <div className="tech-grid absolute inset-0 opacity-50" aria-hidden="true" />
      <div
        className="drift absolute top-[-20%] right-[-15%] h-[60vmax] w-[60vmax] rounded-full opacity-50"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle, rgba(143,17,22,0.36) 0%, rgba(143,17,22,0.08) 40%, rgba(5,5,6,0) 70%)',
        }}
      />
      <div className="relative mx-auto w-full max-w-[1400px]">
        <p className="rise font-body text-[11px] font-semibold tracking-[0.36em] text-blood-ink uppercase">
          {experience ? `${experience.n} · ${experience.title}` : 'Experiencia'}
        </p>
        <h1 className="rise mt-5 font-display text-[clamp(2.8rem,11vw,8rem)] leading-[0.84] text-bone [animation-delay:100ms]">
          PRÓXIMA
          <br />
          ENTREGA
        </h1>
        <div className="rise mt-8 flex flex-wrap items-center gap-3 [animation-delay:240ms]">
          <Badge kind="aviso" />
          <span className="text-sm text-smoke">Esta experiencia todavía no está construida.</span>
        </div>
        <p className="fade-in mt-8 max-w-2xl text-base leading-relaxed text-smoke sm:text-lg [animation-delay:360ms]">
          {experience
            ? `${experience.description} La ruta ya está reservada y no rompe nada: cuando se construya, se abrirá exactamente en esta dirección.`
            : 'Esta ruta está reservada para una experiencia del universo HDLR que todavía no se ha construido.'}
        </p>

        <div className="mt-12 flex flex-wrap gap-3">
          {abiertas.map((item) => (
            <Link
              key={item.slug}
              to={item.slug}
              className="btn-blood inline-flex border border-bone/25 px-5 py-4"
            >
              <span className="font-display text-sm tracking-[0.18em] text-bone uppercase">
                {item.n} {item.title}
              </span>
            </Link>
          ))}
          <Link
            to={ROUTES.entrada}
            className="inline-flex items-center border border-steel px-5 py-4 text-smoke transition-colors hover:border-bone/40 hover:text-bone"
          >
            <span className="font-display text-sm tracking-[0.18em] uppercase">Volver</span>
          </Link>
        </div>

        <ol className="mt-16 grid gap-px border border-steel bg-steel sm:grid-cols-2 lg:grid-cols-4">
          {EXPERIENCES.map((item) => {
            const activa = item.slug === path;
            return (
              <li key={item.slug}>
                <Link
                  to={item.slug}
                  aria-current={activa ? 'page' : undefined}
                  className={`flex h-full flex-col gap-2 p-5 transition-colors hover:bg-steel ${
                    activa ? 'bg-steel' : 'bg-carbon'
                  }`}
                >
                  <span className="font-display text-xl text-blood-bright">{item.n}</span>
                  <span className="font-display text-lg tracking-[0.04em] text-bone">
                    {item.title}
                  </span>
                  <span className="mt-auto font-body text-[10px] font-semibold tracking-[0.22em] text-ash uppercase">
                    {item.status === 'listo' ? 'Disponible' : activa ? 'Estás aquí' : 'Próxima'}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
