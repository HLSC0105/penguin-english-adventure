# Niveles CEFR en el juego

El MCER (Marco Común Europeo) ordena la lengua en A1, A2, B1, B2, C1, C2. Este proyecto cubre **A1–B1**, el tramo típico de secundaria y universidad inicial.

## Qué significa cada nivel aquí

| Nivel | Perfil | Ejemplos en el banco |
|---|---|---|
| A1 | Palabras concretas del día a día | dog, red, house, Monday, eat |
| A2 | Escuela, casa, clima, ropa, presente/pasado simple | homework, jacket, airport, went |
| B1 | Ideas más abstractas y collocations suaves | scholarship, horizon, make a decision, had left |

Las etiquetas son **pedagógicas**, no un examen oficial. El criterio: ¿un estudiante de ese nivel encontraría la palabra en un libro escolar típico?

## Filtro acumulativo

Quien elige B1 **ya pasó** por A1 y A2. El código compara índices en la tupla `("A1", "A2", "B1")`:

```
A1 → solo A1
A2 → A1 ∪ A2
B1 → A1 ∪ A2 ∪ B1
```

No hay tres bancos aislados. Hay un banco etiquetado y un predicado `cumple_nivel`.

## Qué cambia además del vocabulario

| | A1 | A2 | B1 |
|---|---|---|---|
| Trivia | 8 | 10 | 12 |
| Completar / ordenar | 6 | 8 | 10 |
| Memoria | 4 parejas, flip lento | 6 | 8, flip más corto |
| Hueco inicial en completar | sí | sí | no |

Los puntos (+10 / +20) no cambian: la dificultad es el reto, no el premio.

## Dónde está el código

- Etiquetas: `src/penguin_english/datos/vocabulario.py` y `preguntas.py`
- Filtro y parámetros: `src/penguin_english/datos/niveles.py`
- Selector: pantalla de inicio y menú
