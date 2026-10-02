/* TEMPORAL: arnes de revision. Se borra antes de entregar. */
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../index.css';
import { Grain } from '../../components/Grain';
import { Nav } from '../../components/Nav';
import { Footer } from '../../components/Footer';
import { Cancion } from '../../experiences/Cancion';
import { Live } from '../../experiences/Live';
import '../../styles/cancion.css';
import '../../styles/live.css';

const ROUTES = ['/cancion', '/live'] as const;

function read(): string {
  const raw = window.location.hash.replace(/^#/, '');
  return raw || '/cancion';
}

function Check() {
  const [path, setPath] = useState(read);

  useEffect(() => {
    const onChange = () => setPath(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return (
    <div className="relative min-h-[100svh] bg-void">
      <Grain />
      <Nav path={path} />
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          display: 'flex',
          gap: 8,
          padding: '6px 8px',
          background: '#101014',
          borderTop: '1px solid #333',
        }}
      >
        {ROUTES.map((route) => (
          <button
            key={route}
            type="button"
            onClick={() => {
              window.location.hash = route;
            }}
            style={{
              flex: 1,
              padding: '8px',
              fontSize: 12,
              color: '#fff',
              background: path === route ? '#8f1116' : '#26262c',
              border: 0,
            }}
          >
            {route}
          </button>
        ))}
      </div>
      <main id="contenido" key={path}>
        {path === '/live' ? <Live /> : <Cancion />}
      </main>
      <Footer currentPath={path} />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Check />);
