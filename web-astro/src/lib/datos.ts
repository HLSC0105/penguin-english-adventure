/* Tipos + acceso a los datos (espejo de datos/*.py).
   Los JSON los emite scripts/astro_exportar.py EN BUILD desde el
   paquete Python — aquí solo se declaran los tipos y se re-exportan.
   Con Zod validamos en build/frontmatter que Python nunca cambie el
   contrato de un lado sin que el otro lo sepa. */
import { z } from "zod";
import vocabularioJson from "../data/vocabulario.json";
import triviaJson from "../data/trivia.json";
import parejasJson from "../data/parejas.json";
import pipoJson from "../data/pipo.json";
import nivelesJson from "../data/niveles.json";
import introsJson from "../data/intros.json";
import constantesJson from "../data/constantes.json";

/* ---------- esquemas (el contrato Python ↔ Astro) ---------- */

const palabraSchema = z.object({
  ingles: z.string(),
  espanol: z.string(),
  imagen: z.string().nullable(),
  ejemplo: z.string(),
  nivel: z.enum(["A1", "A2", "B1"]),
});

const preguntaSchema = z.object({
  pregunta: z.string(),
  opciones: z.array(z.string()),
  correcta: z.string(),
  explicacion: z.string(),
  nivel: z.enum(["A1", "A2", "B1"]),
});

const parejaSchema = z.object({
  ingles: z.string(),
  imagen: z.string().nullable(),
  nivel: z.enum(["A1", "A2", "B1"]),
});

const nivelesSchema = z.object({
  niveles: z.array(z.enum(["A1", "A2", "B1"])),
  nivelPorDefecto: z.enum(["A1", "A2", "B1"]),
  parametros: z.record(
    z.string(),
    z.object({
      trivia: z.number(),
      completar: z.number(),
      ordenar: z.number(),
      memoriaParejas: z.number(),
      esperaFlipMs: z.number(),
      huecoInicialPermitido: z.boolean(),
    }),
  ),
});

/* ---------- validación en build (frontmatter): falla el BUILD si el
   paquete Python y estos contratos se desincronizan ---------- */

vocabularioJson.categorias satisfies Record<string, z.infer<typeof palabraSchema>[]>;
triviaJson.preguntas satisfies z.infer<typeof preguntaSchema>[];
parejasJson.parejas satisfies z.infer<typeof parejaSchema>[];
nivelesJson satisfies z.infer<typeof nivelesSchema>;

/* ---------- re-export tipado ---------- */

export type Nivel = "A1" | "A2" | "B1";
export type Palabra = z.infer<typeof palabraSchema>;
export type Pregunta = z.infer<typeof preguntaSchema>;
export type Pareja = z.infer<typeof parejaSchema>;

export const NIVELES = nivelesJson.niveles as Nivel[];
export const NIVEL_POR_DEFECTO = nivelesJson.nivelPorDefecto as Nivel;
export const PARAMETROS = nivelesJson.parametros as nivelesSchema["_output"]["parametros"];
export const CATEGORIAS: Record<string, Palabra[]> = vocabularioJson.categorias;
export const PREGUNTAS = triviaJson.preguntas as Pregunta[];
export const PAREJAS = parejasJson.parejas as Pareja[];
export const MENSAJES_PIPO: Record<string, string[]> = pipoJson.mensajes;
export const INTROS = introsJson.intros as Record<
  string, { titulo: string; pipo: string }>;
export const CONSTANTES = constantesJson;

/* ---------- lógica de niveles (espejo de datos/niveles.py) ---------- */

export function nivelValido(nivel: string): nivel is Nivel {
  return (NIVELES as string[]).includes(nivel);
}

export function indiceNivel(nivel: Nivel): number {
  return NIVELES.indexOf(nivel);
}

/* Filtro acumulativo: B1 ya sabe A1 y A2. */
export function cumpleNivel(etiqueta: string, nivel: Nivel): boolean {
  if (!(NIVELES as string[]).includes(etiqueta)) return false;
  return NIVELES.indexOf(etiqueta as Nivel) <= indiceNivel(nivel);
}

export function palabrasDelNivel(nivel: Nivel): Palabra[] {
  return Object.values(CATEGORIAS).flat().filter(
    (p) => cumpleNivel(p.nivel, nivel));
}

export function categoriasDelNivel(nivel: Nivel): Record<string, Palabra[]> {
  const resultado: Record<string, Palabra[]> = {};
  for (const [nombre, palabras] of Object.entries(CATEGORIAS)) {
    const filtradas = palabras.filter((p) => cumpleNivel(p.nivel, nivel));
    if (filtradas.length > 0) resultado[nombre] = filtradas;
  }
  return resultado;
}

export function preguntasDelNivel(nivel: Nivel): Pregunta[] {
  return PREGUNTAS.filter((p) => cumpleNivel(p.nivel, nivel));
}

export function parejasDelNivel(nivel: Nivel): Pareja[] {
  return PAREJAS.filter((p) => cumpleNivel(p.nivel, nivel));
}

/* Sin espacios ni guiones y de 3 letras o más: aptas para hueco/anagrama. */
export function palabrasJugables(nivel: Nivel): Palabra[] {
  return palabrasDelNivel(nivel).filter(
    (p) => !p.ingles.includes(" ") && !p.ingles.includes("-") && p.ingles.length >= 3);
}

export function parametrosNivel(nivel: Nivel) {
  return { ...PARAMETROS[nivel] };
}
