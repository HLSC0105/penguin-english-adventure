// ============================================================
// Penguin English Adventure - Trivia
// Este algoritmo representa una trivia sencilla en PSeInt.
// En Python, las preguntas viven en datos/preguntas.py y la
// pantalla se dibuja con tkinter.
// ============================================================

Algoritmo trivia
	Definir pregunta, respuesta_correcta Como Caracter
	Definir opcion, puntos, aciertos Como Entero

	// Acumuladores: empiezan en cero y van sumando.
	puntos <- 0
	aciertos <- 0

	// Para es un ciclo que se repite un número fijo de veces.
	Para pregunta <- 1 Hasta 3 Con Paso 1 Hacer
		Escribir ""
		Escribir "Pregunta ", pregunta
		Escribir "¿Qué significa APPLE?"
		Escribir "1. Perro"
		Escribir "2. Manzana"
		Escribir "3. Casa"
		Escribir "4. Libro"
		Leer opcion

		Si opcion = 2 Entonces
			Escribir "¡Correcto!"
			puntos <- puntos + 10
			aciertos <- aciertos + 1
		SiNo
			Escribir "Incorrecto. La respuesta era: Manzana"
		FinSi
	FinPara

	Escribir ""
	Escribir "Terminaste la trivia."
	Escribir "Respuestas correctas: ", aciertos, " de 3"
	Escribir "Puntos obtenidos: ", puntos
FinAlgoritmo