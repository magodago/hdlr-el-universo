# HDLR — EL UNIVERSO

Una experiencia interactiva para entrar en el universo de **Hijos de la Ruina** (Natos y Waor + Recycled J).

> "¿Vienes a la Ruina?"

Esto **no es** la web oficial ni la sustituye. Es una pieza aparte, pensada para aportar lo que una web de artista no da: comunidad, experiencia, interacción y ganas de compartir.

## Quién publica esto — leer antes de tocar nada

Este repositorio lo lleva **un único equipo: el portátil de David** (WSL, usuario `dorti`).

- Desde otra máquina: **solo lectura**. No publiques ni hagas `push` sobre `main` ni sobre `gh-pages`.
- Antes de cambiar nada: `git fetch origin`. Si `origin/main` trae commits que no tienes, tu copia está vieja: trae los cambios (`git pull --rebase`), **no los pises**.
- **Prohibido `git push --force`** en `main` y en `gh-pages`. Un force borra el trabajo del otro equipo: ya ha ocurrido tres veces aquí, y la última se llevó por delante las fotos, el emblema y el catálogo de los 39 cortes.
- `gh-pages` es la web publicada y se genera con `npm run build` sobre `main`. No se edita a mano ni se publica desde dos sitios.
- Si dos equipos coinciden: se **fusiona** (`git merge`), nunca se pisa.

Publicar (solo desde el portátil): `git fetch`, `npx tsc --noEmit`, `npm run build`, `git push origin main`, subir `dist/` a `gh-pages` con un commit **encima** del publicado, y comprobar la URL en vivo.

## Notas de mantenimiento

- Los fragmentos de audio de Deezer van firmados y **caducan en minutos**: no sirven como fuente. Los 39 cortes suenan por Apple Music (direcciones estables) y, los 17 que solo existen en YouTube, por su vídeo oficial.
- El emblema oficial está en `src/assets/logo/` (con transparencia y versión ligera de 128 px para la cabecera).
- El huevo de pascua vive en `src/components/EasterEgg.tsx`, montado en toda la app.

## Qué hay dentro (esta entrega)

| # | Experiencia | Estado |
|---|---|---|
| 01 | **Entrar en HDLR** — pantalla de entrada con transición al entrar | Hecha |
| 02 | **¿Cuánto HDLR llevas dentro?** — 8 preguntas, nivel de ruina y 6 dimensiones, con tarjeta para compartir | Hecha |
| 03 | **El mapa de la Ruina** — mapa de España interactivo con zoom y ficha por ciudad | Hecha |
| 04 a 08 | Canción, archivo, live, tu noche y comunidad | Siguiente fase |

## Cómo arrancarlo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/ listo para publicar
npm run preview  # revisa el build antes de subirlo
```

No hace falta ninguna clave ni variable de entorno para funcionar. La capa de IA está preparada para conectar un motor externo más adelante, pero la app funciona sola.

## Stack

- Vite + React + TypeScript
- Tailwind CSS
- Datos separados del código en `src/data/`
- Capa de IA abstracta en `src/lib/ai/` (implementación local por defecto)
- Capa de analítica abstracta con `trackEvent()`
- Build estático, sin backend

## Datos: qué es real y qué es DEMO

**Real, con fuente en los propios ficheros de datos** (`src/data/`):

- Miembros del proyecto (Natos, Waor, Recycled J): `members.json`, con sus fuentes.
- Serie Hijos de la Ruina, volúmenes 1 a 4: `songs.json`.
- Cronología del proyecto 2010 a 2026: `timeline.json`, cada hito con su enlace de origen.
- Ciudades de gira y conciertos: `cities.json` y `concerts.json`, con sus fuentes.

**DEMO, marcado como tal dentro de la interfaz:**

- Los porcentajes y dimensiones del perfil: se calculan a partir de las respuestas, no son un dato oficial.
- Cualquier dato de gira o de concierto que no esté confirmado por fuente oficial sale etiquetado como DEMO.
- Los datos del concierto de Salamanca se muestran como provisionales hasta confirmación oficial.

**Cómo meter datos reales:** se editan los ficheros de `src/data/`. No hay que tocar componentes.

## Accesibilidad y rendimiento

- HTML semántico, navegación por teclado, foco visible y contraste suficiente.
- Todas las animaciones respetan `prefers-reduced-motion`.
- Mobile first, sin vídeos pesados ni librerías innecesarias.

## Despliegue

Publicado en GitHub Pages: <https://magodago.github.io/hdlr-el-universo/>

El build usa `base: '/hdlr-el-universo/'` (ver `vite.config.ts`). Si el repositorio cambia de nombre, hay que cambiar esa base.

## Pendiente para producción

- Experiencias 04 a 08.
- Fotos y vídeo con licencia o material cedido por el equipo.
- Sustituir los datos provisionales de gira por los oficiales.
- Decidir analítica definitiva (la capa ya está lista para Plausible, PostHog o GA4).
