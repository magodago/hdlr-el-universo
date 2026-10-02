# Motor de recomendacion: local hoy, DeepSeek mañana

La experiencia **Cuéntame tu historia** funciona entera en el navegador. No manda
nada a ningun servidor, no usa cookies y **no necesita ninguna clave de API**.

## Lo que corre hoy: el motor local

Fichero: `src/lib/ai/storyEngine.ts`.

1. Lee el texto libre de la persona y lo normaliza (minusculas, sin acentos).
2. Lo convierte en **etiquetas** de tres tipos: emocion, contexto y temas, mas un
   nivel de **intensidad** (baja, media, alta) calculado con señales reales del
   texto (exclamaciones, mayusculas, intensificadores, longitud).
3. Cruza esas etiquetas con el catalogo de `src/data/songs.json`.
4. Si no hay ninguna coincidencia decente, **no la inventa**: devuelve una lista
   vacia y la interfaz lo dice con todas las letras.

Limite importante y deliberado: el motor **no analiza letras de canciones**. El
proyecto no aloja ni procesa letras. Lo unico que compara son las etiquetas
detectadas contra el **titulo** del corte y sus datos publicados (volumen, año,
colaboraciones, si fue adelanto). Cuando dice que algo encaja, lo explica con las
etiquetas que han coincidido, sin afirmar de que va la cancion.

## Lo que queda preparado: DeepSeek

Fichero: `src/lib/ai/deepseekRecommendationEngine.ts`.

`deepseekRecommendationEngine()` esta escrito y **apagado por defecto**
(`enabled: false`). No se registra en ningun sitio y no se llama nunca salvo que
alguien lo encienda a mano.

### Por que no puede llevar la clave

El sitio se publica como estatico en GitHub Pages. Todo lo que va al navegador es
publico: una clave de API ahi seria una clave filtrada. Por eso el motor remoto no
lee ninguna clave; solo sabe hablar con un **proxy propio** que guarde la clave en
el servidor.

### Pasos para encenderlo (trabajo de servidor)

1. Montar un endpoint propio (funcion serverless, Cloudflare Worker o un VPS) que
   reciba `{ story, tags, intensity, catalog }` y por dentro llame a DeepSeek con
   `process.env.DEEPSEEK_API_KEY`. La clave vive **solo** en el servidor.
2. El proxy debe devolver `{ matches: [{ trackId, score, reason, matchedTags, ... }] }`
   con la misma forma que devuelve el motor local. Si un `reason` viene vacio, el
   frontend descarta esa sugerencia.
3. Publicar solo la URL del proxy al frontend, nunca la clave:
   - opcion A: `window.__HDLR_AI__ = { endpoint: 'https://...', model: 'deepseek-chat' }`
   - opcion B: variable de build `VITE_HDLR_AI_ENDPOINT=https://...`
4. Encender el motor a mano donde interese:

   ```ts
   import { resolveDeepseekConfig, deepseekRecommendationEngine } from './lib/ai/deepseekRecommendationEngine';

   const config = resolveDeepseekConfig();
   const engine = config ? deepseekRecommendationEngine(config) : null;
   ```

### Variables de entorno

| Variable | Donde vive | Para que |
|---|---|---|
| `DEEPSEEK_API_KEY` | servidor (proxy) | autenticar contra DeepSeek. Nunca llega al navegador. |
| `VITE_HDLR_AI_ENDPOINT` | build del frontend | URL publica del proxy. |
| `VITE_HDLR_AI_MODEL` | build del frontend | nombre del modelo, opcional. Por defecto `deepseek-chat`. |

**Nunca** crear una variable `VITE_*` con la clave: todo lo que empieza por `VITE_`
acaba dentro del JavaScript publicado.

### Parrafo para el README del proyecto

> La capa de IA vive en `src/lib/ai/`. Hoy funciona un motor local que convierte
> una historia en etiquetas y las cruza con el catalogo sin red y sin claves.
> `deepseekRecommendationEngine()` esta escrito y desactivado: para encenderlo hace
> falta un proxy propio que guarde `DEEPSEEK_API_KEY` en el servidor y publique
> solo su URL (`VITE_HDLR_AI_ENDPOINT`). La app funciona con cero variables de
> entorno y sin ninguna clave en el frontend.

## Enlaces de musica verificados

Fichero: `src/lib/ai/musicLinks.ts`. Solo contiene URLs comprobadas en fuentes
oficiales o de tienda (fichas de album de Spotify y videos del canal oficial de
Natos y Waor en YouTube). Si un corte no tiene enlace propio verificado, el campo
se deja vacio y la interfaz no pinta ese boton.
