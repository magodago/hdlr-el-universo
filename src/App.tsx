import { useEffect } from 'react';
import { Grain } from './components/Grain';
import { Nav } from './components/Nav';
import { Footer } from './components/Footer';
import { Entrada } from './experiences/Entrada';
import { Perfil } from './experiences/Perfil';
import { Mapa } from './experiences/Mapa';
import { Cancion } from './experiences/Cancion';
import { Archivo } from './experiences/Archivo';
import { Live } from './experiences/Live';
import { Comunidad } from './experiences/Comunidad';
import { Proximamente } from './experiences/Proximamente';
import { SoundToggle } from './lib/SoundToggle';
import { ROUTES, useRoute, useScrollReset } from './lib/router';
import { useRevealOnScroll } from './lib/useReveal';
import { trackEvent } from './lib/trackEvent';

const TITLES: Record<string, string> = {
  [ROUTES.entrada]: 'HDLR - El Universo',
  [ROUTES.perfil]: 'Mi ruina · HDLR - El Universo',
  [ROUTES.mapa]: 'Mapa · HDLR - El Universo',
  [ROUTES.cancion]: 'Tu historia · HDLR - El Universo',
  [ROUTES.archivo]: 'Archivo · HDLR - El Universo',
  [ROUTES.live]: 'Live · HDLR - El Universo',
};

function View({ path }: { path: string }) {
  switch (path) {
    case ROUTES.entrada:
      return <Entrada />;
    case ROUTES.perfil:
      return <Perfil />;
    case ROUTES.mapa:
      return <Mapa />;
    case ROUTES.cancion:
      return <Cancion />;
    case ROUTES.archivo:
      return <Archivo />;
    case ROUTES.live:
      return <Live />;
    case ROUTES.comunidad:
      return <Comunidad />;
    default:
      return <Proximamente path={path} />;
  }
}

export default function App() {
  const path = useRoute();
  useScrollReset(path);
  useRevealOnScroll();

  useEffect(() => {
    document.title = TITLES[path] ?? 'Próxima entrega · HDLR - El Universo';
    trackEvent('app_view', { path });
  }, [path]);

  return (
    <div className="relative min-h-[100svh] bg-void">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[90] focus:border focus:border-bone focus:bg-carbon focus:px-4 focus:py-3 focus:text-sm focus:text-bone"
      >
        Saltar al contenido
      </a>
      <Grain />
      <Nav path={path} />
      <main id="contenido" key={path} className="view-enter">
        <View path={path} />
      </main>
      <Footer currentPath={path} />
      <SoundToggle />
    </div>
  );
}
