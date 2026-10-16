# Despliegue de la versión web — Penguin English Adventure

La web es un sitio **estático autocontenido** (`web/`, sin build, sin
backend). Necesita solo un servidor HTTP. Tres caminos, del más súbito
al más duradero. Todo es **gratis**.

---

## Camino 0 — Sin instalar NADA: doble clic ⭐ (recomendado para jugar)

**La carpeta `web/` es 100% independiente**: no necesita Python, ni
servidor, ni internet, ni instalar nada.

1. Copia la carpeta `web/` (o el zip) a cualquier computadora.
2. Haz **doble clic en `web/index.html`**.
3. Juega. Las dependencias de estilo (Bootstrap, iconos y la fuente
   Fredoka) están autoalojadas en `web/assets/vendor/` y los datos del
   juego están emitidos en `web/js/00-datos.js` — nada sale de disco.

> Python queda **solo como editor de contenido**: si algún día cambia
> el vocabulario/trivia en `src/penguin_english/datos/`, se regenera
> `00-datos.js` con `python scripts/web_exportar.py`. Para solo jugar,
> no hace falta nunca.

---

## Camino 1 — Enlace temporal de hoy (URL YA VIVA)

Ya existe un despliegue anónimo con CLI en vivo:

- **URL:** <https://soft-medovik-399fd8.netlify.app>
- **Contraseña del sitio:** `My-Drop-Site` (el visitante la teclea
  una vez al abrir; después funciona normal).
- **Ventana:** los proyectos anónimos de Netlify deben **reclamarse
  dentro de 60 minutos**; transcurrido ese plazo el enlace caduca solo.

Para conservarlo “por un día” (y borrarlo después):

1. Abre el enlace de reclamo que devolvió el deploy (o repite el paso
   3 para un sitio nuevo) e inicia sesión / crea cuenta **gratis** —
   el proyecto pasa a tu cuenta.
2. Al día siguiente: panel de Netlify → *Site configuration* →
   *Delete site*. El enlace muere de inmediato.

Redeploy anónimo idéntico (sin cuenta) desde la raíz del proyecto:

```bash
npx netlify-cli deploy --allow-anonymous --dir web --no-build
```

Cada llamada produce una URL nueva (contraseña temporal incluida).

---

## Camino 2 — Arrastrar y soltar a mano (Netlify Drop)

1. Empaqueta (o usa el zip ya hecho):

   ```bash
   cd <raíz del proyecto>
   python scripts/web_exportar.py            # regenera datos y assets
   cd web && zip -rq ../PenguinEnglish-web.zip . && cd ..
   ```

2. Con cuenta creada (para control y URL estable), entra a
   <https://app.netlify.com/drop> y arrastra `web/` (o el zip).
3. Netlify regala un URL `*.netlify.app` público y sin contraseña.
4. Lo borras cuando quieras — es tu sitio en tu cuenta.
   *Sin sesión*: también funciona, pero el sitio nace con
   contraseña temporal y ventana de reclamo de 60 min.

---

## Camino 3 — GitHub Pages (duradero, también gratis)

1. Sube el contenido de `web/` a un repositorio (rama `main`).
2. *Settings → Pages → Deploy from a branch → `/ (root)`*.
3. URL estable: `https://<usuario>.github.io/<repo>/`.
   Para eliminarla, desactiva Pages o borra el repo.

---

## Probarlo localmente (2 formas)

```bash
# con servidor (recomendado; audio y todos los assets garantizados)
python scripts/web_exportar.py --servir 8000      # http://127.0.0.1:8000

# sin servidor: doble clic en web/index.html — funciona igual
# (scripts clásicos a propósito; los CDN de Bootstrap y la fuente
#  Fredoka requieren internet la primera vez)
```

## Puente académico (PSeInt → Python → Tkinter → Web)

`scripts/web_exportar.py` importa los módulos **Python reales**
(`datos/vocabulario`, `datos/preguntas`, `datos/niveles`,
`interfaz/intro`) y genera:

- `web/js/00-datos.js` — el banco (309 palabras, 107 preguntas,
  16 parejas, mensajes de Pipo, intros).
- `web/assets/img/` (233 OpenMoji usados + Pipo) y
  `web/assets/sonidos/` (los 4 WAV del juego).
- `web/ATRIBUCIONES.md` — créditos OpenMoji.

Regla: si cambias datos o reglas en Python, vuelve a correr el
script; la web no duplica lógica, la recibe.
