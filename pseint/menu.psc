// ============================================================
// Penguin English Adventure - Menú principal
// Este algoritmo representa el menú del juego en PSeInt.
// En Python, este mismo menú se convierte en una interfaz
// gráfica (tkinter) con botones y un selector CEFR.
// ============================================================

Algoritmo menu_principal
	Definir opcion, nivel Como Entero
	Definir nombreNivel Como Caracter

	Escribir "==============================="
	Escribir "  PENGUIN ENGLISH ADVENTURE"
	Escribir "==============================="
	Escribir "1. A1   2. A2   3. B1"
	Escribir "Elige tu nivel de ingles:"
	Leer nivel
	Segun nivel Hacer
		1:
			nombreNivel <- "A1"
		2:
			nombreNivel <- "A2"
		3:
			nombreNivel <- "B1"
		De Otro Modo:
			nombreNivel <- "A2"
	FinSegun
	Escribir "Nivel actual: ", nombreNivel

	// Repetir es un ciclo que se ejecuta hasta que
	// el jugador elige la opción 6 (Salir).
	Repetir
		Escribir ""
		Escribir "1. Aprender vocabulario"
		Escribir "2. Trivia"
		Escribir "3. Completar palabra"
		Escribir "4. Ordenar palabra"
		Escribir "5. Juego de memoria"
		Escribir "6. Salir"
		Escribir ""
		Escribir "Elige una opcion:"
		Leer opcion

		Segun opcion Hacer
			1:
				Escribir "Abriendo vocabulario (", nombreNivel, ")..."
			2:
				Escribir "Abriendo trivia (", nombreNivel, ")..."
			3:
				Escribir "Abriendo completar palabra..."
			4:
				Escribir "Abriendo ordenar palabra..."
			5:
				Escribir "Abriendo juego de memoria..."
			6:
				Escribir "¡Hasta pronto!"
			De Otro Modo:
				Escribir "Opcion no valida, intenta de nuevo."
		FinSegun
	Hasta Que opcion = 6
FinAlgoritmo
