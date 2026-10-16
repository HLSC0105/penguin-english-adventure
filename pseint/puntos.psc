// ============================================================
// Penguin English Adventure - Sistema de puntos
// Este algoritmo muestra cómo se calculan los puntos con una
// función y un acumulador, igual que en utilidades/puntuacion.py
// ============================================================

Funcion puntos <- calcular_puntos(respuesta_correcta)
	// Devuelve 10 puntos si la respuesta es correcta
	// y 0 puntos si es incorrecta.
	Si respuesta_correcta Entonces
		puntos <- 10
	SiNo
		puntos <- 0
	FinSi
FinFuncion

Algoritmo sistema_de_puntos
	Definir respuesta_correcta Como Logico
	Definir total Como Entero

	total <- 0

	// Simulamos dos respuestas: una correcta y una incorrecta.
	respuesta_correcta <- Verdadero
	total <- total + calcular_puntos(respuesta_correcta)

	respuesta_correcta <- Falso
	total <- total + calcular_puntos(respuesta_correcta)

	Escribir "Puntos totales: ", total
FinAlgoritmo