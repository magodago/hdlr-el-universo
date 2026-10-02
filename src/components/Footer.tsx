import { EXPERIENCES } from '../data/experiences';
import { Link, ROUTES } from '../lib/router';
import { trackEvent } from '../lib/trackEvent';

interface FooterProps {
  currentPath: string;
}

export function Footer({ currentPath }: FooterProps) {
  const others = EXPERIENCES.filter((experience) => experience.slug !== currentPath);

  return (
    <footer className="relative border-t border-steel bg-ink px-4 pt-16 pb-10 sm:px-8">
      <div className="mx-auto max-w-[1400px]">
        <p className="font-body text-[11px] font-semibold tracking-[0.34em] text-blood-ink uppercase">
          Sigue el universo
        </p>
        <h2 className="mt-3 max-w-3xl font-display text-3xl leading-[0.92] text-bone sm:text-5xl">
          Pasa al siguiente tramo
        </h2>

        <ul className="mt-10 grid gap-px border border-steel bg-steel sm:grid-cols-2 lg:grid-cols-3">
          {others.map((experience) => (
            <li key={experience.slug}>
              <Link
                to={experience.slug}
                className="group flex h-full flex-col gap-2 bg-carbon p-5 transition-colors hover:bg-steel"
                onClick={() =>
                  trackEvent(experience.status === 'listo' ? 'experience_open' : 'experience_locked', {
                    id: experience.n,
                    slug: experience.slug,
                    from: currentPath,
                  })
                }
              >
                <span className="flex items-baseline gap-3">
                  <span className="font-display text-sm tracking-[0.2em] text-blood-ink">
                    {experience.n}
                  </span>
                  <span className="font-display text-xl tracking-[0.04em] text-bone">
                    {experience.title}
                  </span>
                </span>
                <span className="text-sm leading-relaxed text-smoke">{experience.description}</span>
                <span className="mt-auto pt-3 font-body text-[10px] font-semibold tracking-[0.24em] text-ash uppercase">
                  {experience.status === 'listo' ? 'Disponible' : 'Próxima entrega'}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-14 flex flex-col gap-4 border-t border-steel pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body text-xs tracking-[0.16em] text-ash uppercase">
            HDLR, El Universo. Proyecto personal. Sin cookies, sin analítica de terceros, sin
            registro.
          </p>
          <Link
            to={ROUTES.entrada}
            className="btn-outline px-4 py-2 font-body text-xs font-semibold tracking-[0.24em] uppercase"
          >
            Volver a la entrada
          </Link>
        </div>
        <p className="mt-4 max-w-3xl text-xs leading-relaxed text-ash">
          Proyecto de homenaje sin ánimo de lucro y sin contenido protegido: no se aloja ni se
          redistribuye música, letras, portadas ni fotografía de prensa. Todos los datos llevan su
          fuente citada en la interfaz. Hijos de la Ruina es un proyecto de Natos, Waor y Recycled J.
        </p>
      </div>
    </footer>
  );
}
