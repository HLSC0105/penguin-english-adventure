"""Preguntas de trivia, parejas de memoria y mensajes de Pipo.

Explicación académica
---------------------
Este archivo es el **banco**. No decide cuántas preguntas salen ni
cómo se dibujan. Invariante de trivia (lo comprueban los tests):
``correcta`` ∈ ``opciones``.

``mensaje_pipo`` es ``random.choice`` sobre una lista: Pipo parece
variado sin un modelo de lenguaje. Librería: ``random``.

Las parejas reutilizan PNG de ``recursos/imagenes``. El tablero no
usa la lista completa: ``juegos.memoria.crear_tablero`` elige N
según el nivel CEFR.
"""

import random

PREGUNTAS_TRIVIA = [
    # --- A1: significado directo y vocabulario concreto ---
    {"pregunta": "¿Qué significa \"APPLE\"?", "opciones": ["Perro", "Manzana", "Casa", "Libro"], "correcta": "Manzana", "explicacion": "Apple significa manzana.", "nivel": "A1"},
    {"pregunta": "¿Qué significa \"DOG\"?", "opciones": ["Gato", "Pájaro", "Perro", "Pez"], "correcta": "Perro", "explicacion": "Dog significa perro.", "nivel": "A1"},
    {"pregunta": "¿Qué significa \"CAT\"?", "opciones": ["Perro", "Gato", "Ratón", "Conejo"], "correcta": "Gato", "explicacion": "Cat significa gato.", "nivel": "A1"},
    {"pregunta": "¿Qué significa \"HOUSE\"?", "opciones": ["Casa", "Escuela", "Parque", "Tienda"], "correcta": "Casa", "explicacion": "House significa casa.", "nivel": "A1"},
    {"pregunta": "¿Qué significa \"BOOK\"?", "opciones": ["Lápiz", "Cuaderno", "Libro", "Mesa"], "correcta": "Libro", "explicacion": "Book significa libro.", "nivel": "A1"},
    {"pregunta": "¿Qué significa \"WATER\"?", "opciones": ["Jugo", "Leche", "Agua", "Café"], "correcta": "Agua", "explicacion": "Water significa agua.", "nivel": "A1"},
    {"pregunta": "¿Qué significa \"SUN\"?", "opciones": ["Luna", "Sol", "Estrella", "Nube"], "correcta": "Sol", "explicacion": "Sun significa sol.", "nivel": "A1"},
    {"pregunta": "¿Qué significa \"MOON\"?", "opciones": ["Sol", "Estrella", "Luna", "Tierra"], "correcta": "Luna", "explicacion": "Moon significa luna.", "nivel": "A1"},
    {"pregunta": "¿Qué significa \"FISH\"?", "opciones": ["Pez", "Pato", "Tortuga", "Cangrejo"], "correcta": "Pez", "explicacion": "Fish significa pez.", "nivel": "A1"},
    {"pregunta": "¿Qué significa \"CAR\"?", "opciones": ["Avión", "Barco", "Tren", "Carro"], "correcta": "Carro", "explicacion": "Car significa carro.", "nivel": "A1"},
    {"pregunta": "¿Qué significa \"BANANA\"?", "opciones": ["Manzana", "Plátano", "Naranja", "Uva"], "correcta": "Plátano", "explicacion": "Banana significa plátano.", "nivel": "A1"},
    {"pregunta": "¿Qué significa \"RED\"?", "opciones": ["Azul", "Verde", "Rojo", "Amarillo"], "correcta": "Rojo", "explicacion": "Red significa rojo.", "nivel": "A1"},
    {"pregunta": "¿Qué significa \"BLUE\"?", "opciones": ["Azul", "Verde", "Morado", "Negro"], "correcta": "Azul", "explicacion": "Blue significa azul.", "nivel": "A1"},
    {"pregunta": "¿Qué significa \"MOTHER\"?", "opciones": ["Tía", "Abuela", "Mamá", "Prima"], "correcta": "Mamá", "explicacion": "Mother significa mamá.", "nivel": "A1"},
    {"pregunta": "¿Qué significa \"MONDAY\"?", "opciones": ["Domingo", "Sábado", "Viernes", "Lunes"], "correcta": "Lunes", "explicacion": "Monday significa lunes.", "nivel": "A1"},
    {"pregunta": "¿Qué significa \"ONE\"?", "opciones": ["Uno", "Dos", "Tres", "Cuatro"], "correcta": "Uno", "explicacion": "One significa uno.", "nivel": "A1"},
    {"pregunta": "¿Qué significa \"DOCTOR\"?", "opciones": ["Piloto", "Médico", "Policía", "Músico"], "correcta": "Médico", "explicacion": "Doctor significa médico.", "nivel": "A1"},
    {"pregunta": "¿Qué significa \"MILK\"?", "opciones": ["Leche", "Queso", "Pan", "Huevo"], "correcta": "Leche", "explicacion": "Milk significa leche.", "nivel": "A1"},
    {"pregunta": "¿Cómo se dice \"perro\" en inglés?", "opciones": ["CAT", "DOG", "BIRD", "HORSE"], "correcta": "DOG", "explicacion": "Perro se dice dog.", "nivel": "A1"},
    {"pregunta": "¿Cómo se dice \"manzana\" en inglés?", "opciones": ["APPLE", "ORANGE", "BANANA", "GRAPE"], "correcta": "APPLE", "explicacion": "Manzana se dice apple.", "nivel": "A1"},
    {"pregunta": "¿Cómo se dice \"casa\" en inglés?", "opciones": ["HOUSE", "SCHOOL", "PARK", "STORE"], "correcta": "HOUSE", "explicacion": "Casa se dice house.", "nivel": "A1"},
    {"pregunta": "¿Cómo se dice \"azul\" en inglés?", "opciones": ["BLUE", "GREEN", "RED", "YELLOW"], "correcta": "BLUE", "explicacion": "Azul se dice blue.", "nivel": "A1"},
    {"pregunta": "¿Cómo se dice \"gato\" en inglés?", "opciones": ["CAT", "DOG", "MOUSE", "RABBIT"], "correcta": "CAT", "explicacion": "Gato se dice cat.", "nivel": "A1"},
    {"pregunta": "¿Cómo se dice \"familia\" en inglés?", "opciones": ["FAMILY", "FRIEND", "SCHOOL", "COUNTRY"], "correcta": "FAMILY", "explicacion": "Familia se dice family.", "nivel": "A1"},
    {"pregunta": "¿Cómo se dice \"lunes\" en inglés?", "opciones": ["MONDAY", "SUNDAY", "SATURDAY", "FRIDAY"], "correcta": "MONDAY", "explicacion": "Lunes se dice Monday.", "nivel": "A1"},
    {"pregunta": "¿Cómo se dice \"mano\" en inglés?", "opciones": ["HAND", "FOOT", "HEAD", "NOSE"], "correcta": "HAND", "explicacion": "Mano se dice hand.", "nivel": "A1"},
    {"pregunta": "¿Cómo se dice \"libro\" en inglés?", "opciones": ["BOOK", "PEN", "PAPER", "BAG"], "correcta": "BOOK", "explicacion": "Libro se dice book.", "nivel": "A1"},
    {"pregunta": "¿Cómo se dice \"rojo\" en inglés?", "opciones": ["RED", "BLACK", "WHITE", "PINK"], "correcta": "RED", "explicacion": "Rojo se dice red.", "nivel": "A1"},
    {"pregunta": "¿Cuál de estas palabras es una fruta?", "opciones": ["Carro", "Manzana", "Casa", "Perro"], "correcta": "Manzana", "explicacion": "Manzana es una fruta (apple).", "nivel": "A1"},
    {"pregunta": "¿Cuál de estas palabras es un animal?", "opciones": ["Mesa", "Silla", "Gato", "Ventana"], "correcta": "Gato", "explicacion": "Gato es un animal (cat).", "nivel": "A1"},
    {"pregunta": "¿Cuál de estas palabras es un color?", "opciones": ["Verde", "Camisa", "Zapato", "Sombrero"], "correcta": "Verde", "explicacion": "Verde es un color (green).", "nivel": "A1"},
    {"pregunta": "¿Cuál de estas palabras es un número?", "opciones": ["Tres", "Silla", "Nube", "Casa"], "correcta": "Tres", "explicacion": "Tres es un número (three).", "nivel": "A1"},
    {"pregunta": "¿Cuál de estas palabras es un miembro de la familia?", "opciones": ["Abuela", "Carro", "Pez", "Silla"], "correcta": "Abuela", "explicacion": "Abuela es familia (grandmother).", "nivel": "A1"},
    {"pregunta": "¿Cuál de estas palabras es parte del cuerpo?", "opciones": ["Nariz", "Mesa", "Perro", "Pan"], "correcta": "Nariz", "explicacion": "Nariz es parte del cuerpo (nose).", "nivel": "A1"},
    {"pregunta": "¿Cuál es la palabra correcta para \"sol\"?", "opciones": ["SUN", "MOON", "STAR", "RAIN"], "correcta": "SUN", "explicacion": "Sol se dice sun.", "nivel": "A1"},
    {"pregunta": "Completa: I ___ a dog.", "opciones": ["have", "has", "had", "having"], "correcta": "have", "explicacion": "Con \"I\" (yo) usamos \"have\".", "nivel": "A1"},
    {"pregunta": "Completa: She ___ my mother.", "opciones": ["is", "are", "am", "be"], "correcta": "is", "explicacion": "Con \"she\" (ella) usamos \"is\".", "nivel": "A1"},
    {"pregunta": "Completa: They ___ students.", "opciones": ["is", "am", "are", "be"], "correcta": "are", "explicacion": "Con \"they\" usamos \"are\".", "nivel": "A1"},
    {"pregunta": "¿Cuál es el primer mes del año?", "opciones": ["March", "January", "December", "June"], "correcta": "January", "explicacion": "January es enero, el primer mes.", "nivel": "A1"},
    {"pregunta": "¿Cómo se dice \"escuela\" en inglés?", "opciones": ["SCHOOL", "HOUSE", "LIBRARY", "CLASS"], "correcta": "SCHOOL", "explicacion": "Escuela se dice school.", "nivel": "A1"},
    {"pregunta": "¿Qué significa \"BREAD\"?", "opciones": ["Leche", "Pan", "Arroz", "Sopa"], "correcta": "Pan", "explicacion": "Bread significa pan.", "nivel": "A1"},
    {"pregunta": "¿Qué significa \"TRAIN\"?", "opciones": ["Bus", "Avión", "Tren", "Barco"], "correcta": "Tren", "explicacion": "Train significa tren.", "nivel": "A1"},
    {"pregunta": "Completa: There ___ a book on the table.", "opciones": ["is", "are", "am", "be"], "correcta": "is", "explicacion": "Con un objeto singular usamos \"there is\".", "nivel": "A1"},
    {"pregunta": "Completa: There ___ two cats.", "opciones": ["is", "are", "am", "be"], "correcta": "are", "explicacion": "Con plural usamos \"there are\".", "nivel": "A1"},
    {"pregunta": "¿Qué significa \"HAPPY\"?", "opciones": ["Triste", "Feliz", "Cansado", "Enojado"], "correcta": "Feliz", "explicacion": "Happy significa feliz.", "nivel": "A1"},
    {"pregunta": "¿Cómo se dice \"playa\" en inglés?", "opciones": ["BEACH", "MOUNTAIN", "RIVER", "FOREST"], "correcta": "BEACH", "explicacion": "Playa se dice beach.", "nivel": "A1"},
    {"pregunta": "¿Qué significa \"EIGHT\"?", "opciones": ["Siete", "Ocho", "Nueve", "Diez"], "correcta": "Ocho", "explicacion": "Eight significa ocho.", "nivel": "A1"},
    {"pregunta": "¿Cuál de estas palabras es un día?", "opciones": ["Friday", "January", "Kitchen", "Shirt"], "correcta": "Friday", "explicacion": "Friday es viernes, un día de la semana.", "nivel": "A1"},
    # --- A2: escuela, casa, clima, ropa, gramática simple ---
    {"pregunta": "¿Qué significa \"HOMEWORK\"?", "opciones": ["Examen", "Tarea", "Recreo", "Nota"], "correcta": "Tarea", "explicacion": "Homework significa tarea.", "nivel": "A2"},
    {"pregunta": "¿Qué significa \"WEATHER\"?", "opciones": ["Clima", "Viaje", "Comida", "Ropa"], "correcta": "Clima", "explicacion": "Weather significa clima o tiempo atmosférico.", "nivel": "A2"},
    {"pregunta": "¿Qué significa \"NEIGHBOUR\"?", "opciones": ["Amigo", "Vecino", "Primo", "Jefe"], "correcta": "Vecino", "explicacion": "Neighbour (UK) significa vecino.", "nivel": "A2"},
    {"pregunta": "¿Cómo se dice \"pasaporte\" en inglés?", "opciones": ["TICKET", "PASSPORT", "LUGGAGE", "BORDER"], "correcta": "PASSPORT", "explicacion": "Pasaporte se dice passport.", "nivel": "A2"},
    {"pregunta": "¿Qué significa \"JACKET\"?", "opciones": ["Falda", "Chaqueta", "Sombrero", "Medias"], "correcta": "Chaqueta", "explicacion": "Jacket significa chaqueta.", "nivel": "A2"},
    {"pregunta": "¿Cuál de estas palabras es un lugar de la casa?", "opciones": ["Kitchen", "Tiger", "Monday", "Purple"], "correcta": "Kitchen", "explicacion": "Kitchen es la cocina.", "nivel": "A2"},
    {"pregunta": "Completa: He ___ to school every day.", "opciones": ["go", "goes", "going", "gone"], "correcta": "goes", "explicacion": "Con he/she/it el presente simple lleva -s.", "nivel": "A2"},
    {"pregunta": "Completa: I ___ my homework yesterday.", "opciones": ["do", "does", "did", "done"], "correcta": "did", "explicacion": "Yesterday pide pasado simple: did.", "nivel": "A2"},
    {"pregunta": "¿Qué significa \"LIBRARY\"?", "opciones": ["Librería", "Biblioteca", "Laboratorio", "Gimnasio"], "correcta": "Biblioteca", "explicacion": "Library es biblioteca, no la tienda de libros.", "nivel": "A2"},
    {"pregunta": "¿Cómo se dice \"enfermero\" en inglés?", "opciones": ["NURSE", "DOCTOR", "CHEF", "FARMER"], "correcta": "NURSE", "explicacion": "Enfermero se dice nurse.", "nivel": "A2"},
    {"pregunta": "¿Qué significa \"THIRSTY\"?", "opciones": ["Hambriento", "Sediento", "Cansado", "Feliz"], "correcta": "Sediento", "explicacion": "Thirsty significa que tienes sed.", "nivel": "A2"},
    {"pregunta": "¿Cuál es lo contrario de \"difficult\"?", "opciones": ["easy", "busy", "loud", "weak"], "correcta": "easy", "explicacion": "Difficult (difícil) y easy (fácil) son opuestos.", "nivel": "A2"},
    {"pregunta": "Completa: There isn't ___ milk in the fridge.", "opciones": ["some", "any", "many", "a"], "correcta": "any", "explicacion": "En negativas e interrogativas usamos any.", "nivel": "A2"},
    {"pregunta": "¿Qué significa \"FORECAST\"?", "opciones": ["Pronóstico", "Tormenta", "Humedad", "Sequía"], "correcta": "Pronóstico", "explicacion": "Forecast es el pronóstico del tiempo. Es B1; aquí se ofrece en A2 como avance.", "nivel": "A2"},
    {"pregunta": "¿Cómo se dice \"diccionario\" en inglés?", "opciones": ["DICTIONARY", "NOTEBOOK", "LESSON", "SUBJECT"], "correcta": "DICTIONARY", "explicacion": "Diccionario se dice dictionary.", "nivel": "A2"},
    {"pregunta": "¿Qué significa \"LUGGAGE\"?", "opciones": ["Boleto", "Equipaje", "Mapa", "Hotel"], "correcta": "Equipaje", "explicacion": "Luggage significa equipaje (incontable).", "nivel": "A2"},
    {"pregunta": "Completa: She is ___ a book right now.", "opciones": ["read", "reads", "reading", "readed"], "correcta": "reading", "explicacion": "Right now pide present continuous: is reading.", "nivel": "A2"},
    {"pregunta": "¿Cuál de estas palabras es ropa?", "opciones": ["Scarf", "River", "Exam", "Cheese"], "correcta": "Scarf", "explicacion": "Scarf es bufanda.", "nivel": "A2"},
    {"pregunta": "¿Qué significa \"PASSWORD\"?", "opciones": ["Pantalla", "Contraseña", "Teclado", "Red"], "correcta": "Contraseña", "explicacion": "Password significa contraseña.", "nivel": "A2"},
    {"pregunta": "¿Cómo se dice \"vecino\" en inglés (UK)?", "opciones": ["NEIGHBOUR", "PARENTS", "COUSIN", "OFFICER"], "correcta": "NEIGHBOUR", "explicacion": "En inglés británico se escribe neighbour.", "nivel": "A2"},
    {"pregunta": "Completa: We ___ to the beach last Sunday.", "opciones": ["go", "went", "gone", "going"], "correcta": "went", "explicacion": "Last Sunday pide pasado: went.", "nivel": "A2"},
    {"pregunta": "¿Qué significa \"TWELVE\"?", "opciones": ["Diez", "Once", "Doce", "Veinte"], "correcta": "Doce", "explicacion": "Twelve significa doce.", "nivel": "A2"},
    {"pregunta": "¿Cuál de estas palabras es un adjetivo?", "opciones": ["Beautiful", "Kitchen", "Monday", "Elephant"], "correcta": "Beautiful", "explicacion": "Beautiful describe: hermoso.", "nivel": "A2"},
    {"pregunta": "¿Qué significa \"AIRPORT\"?", "opciones": ["Estación", "Aeropuerto", "Puerto", "Frontera"], "correcta": "Aeropuerto", "explicacion": "Airport significa aeropuerto.", "nivel": "A2"},
    {"pregunta": "Completa: How ___ water do you drink?", "opciones": ["many", "much", "long", "often"], "correcta": "much", "explicacion": "Water es incontable: how much.", "nivel": "A2"},
    {"pregunta": "¿Cómo se dice \"tormenta\" en inglés?", "opciones": ["STORM", "WIND", "CLOUD", "THUNDER"], "correcta": "STORM", "explicacion": "Tormenta se dice storm.", "nivel": "A2"},
    {"pregunta": "¿Qué significa \"BREAKFAST\"?", "opciones": ["Almuerzo", "Cena", "Desayuno", "Merienda"], "correcta": "Desayuno", "explicacion": "Breakfast es la primera comida del día.", "nivel": "A2"},
    {"pregunta": "Completa: Don't ___ the door.", "opciones": ["forget close", "forget to close", "forgot close", "forgetting"], "correcta": "forget to close", "explicacion": "Forget + to + verbo: don't forget to close.", "nivel": "A2"},
    {"pregunta": "¿Cuál es un mes de otoño en el hemisferio norte?", "opciones": ["July", "October", "January", "April"], "correcta": "October", "explicacion": "October (octubre) cae en otoño al norte.", "nivel": "A2"},
    {"pregunta": "¿Qué significa \"ENGINEER\"?", "opciones": ["Científico", "Ingeniero", "Periodista", "Granjero"], "correcta": "Ingeniero", "explicacion": "Engineer significa ingeniero. Palabra B1 ofrecida como puente.", "nivel": "A2"},
    {"pregunta": "Completa: I have ___ friends in my class.", "opciones": ["much", "a little", "many", "any"], "correcta": "many", "explicacion": "Friends es contable plural: many.", "nivel": "A2"},
    {"pregunta": "¿Cómo se dice \"nevera\" en inglés?", "opciones": ["FRIDGE", "SOFA", "GARAGE", "ATTIC"], "correcta": "FRIDGE", "explicacion": "Nevera / refrigerador se dice fridge.", "nivel": "A2"},
    # --- B1: abstractos, collocations suaves, matices ---
    {"pregunta": "¿Qué significa \"SCHOLARSHIP\"?", "opciones": ["Materia", "Beca", "Universidad", "Examen"], "correcta": "Beca", "explicacion": "Scholarship es una beca de estudio.", "nivel": "B1"},
    {"pregunta": "¿Qué significa \"HORIZON\"?", "opciones": ["Valle", "Horizonte", "Fauna", "Techo"], "correcta": "Horizonte", "explicacion": "Horizon es la línea donde el cielo parece tocar la tierra.", "nivel": "B1"},
    {"pregunta": "¿Cuál collocation es correcta?", "opciones": ["make a photo", "take a photo", "do a photo", "have a photo"], "correcta": "take a photo", "explicacion": "En inglés se dice take a photo, no make a photo.", "nivel": "B1"},
    {"pregunta": "¿Qué significa \"DROUGHT\"?", "opciones": ["Humedad", "Sequía", "Tormenta", "Pronóstico"], "correcta": "Sequía", "explicacion": "Drought es un periodo largo sin lluvia.", "nivel": "B1"},
    {"pregunta": "Completa: If it rains, we ___ at home.", "opciones": ["stay", "stays", "stayed", "staying"], "correcta": "stay", "explicacion": "Primer condicional: If + present, will/present. Aquí stay es presente de hábito.", "nivel": "B1"},
    {"pregunta": "¿Qué significa \"BECOME\"?", "opciones": ["Encontrar", "Decidir", "Volverse", "Escuchar"], "correcta": "Volverse", "explicacion": "Become significa llegar a ser / volverse.", "nivel": "B1"},
    {"pregunta": "¿Cuál es un sinónimo cercano de \"journey\"?", "opciones": ["ticket", "trip", "border", "luggage"], "correcta": "trip", "explicacion": "Journey y trip se refieren a un desplazamiento.", "nivel": "B1"},
    {"pregunta": "Completa: The software needs ___ update.", "opciones": ["a", "an", "any", "much"], "correcta": "an", "explicacion": "Update empieza por sonido vocálico: an update.", "nivel": "B1"},
    {"pregunta": "¿Qué significa \"WILDLIFE\"?", "opciones": ["Bosque", "Fauna silvestre", "Horizonte", "Valle"], "correcta": "Fauna silvestre", "explicacion": "Wildlife son los animales que viven en libertad.", "nivel": "B1"},
    {"pregunta": "¿Cuál frase usa present perfect?", "opciones": ["I went to the city.", "I have visited the island.", "I visit the island.", "I am visiting."], "correcta": "I have visited the island.", "explicacion": "Have + participio es present perfect.", "nivel": "B1"},
    {"pregunta": "¿Qué significa \"INGREDIENT\"?", "opciones": ["Receta", "Ingrediente", "Cena", "Hambre"], "correcta": "Ingrediente", "explicacion": "Ingredient es cada elemento de una receta.", "nivel": "B1"},
    {"pregunta": "Completa: You should be ___ with hot oil.", "opciones": ["careful", "expensive", "dangerous", "loud"], "correcta": "careful", "explicacion": "Be careful = ten cuidado.", "nivel": "B1"},
    {"pregunta": "¿Cómo se dice \"frontera\" en inglés?", "opciones": ["BORDER", "JOURNEY", "ISLAND", "NETWORK"], "correcta": "BORDER", "explicacion": "Frontera se dice border.", "nivel": "B1"},
    {"pregunta": "¿Qué significa \"HUMIDITY\"?", "opciones": ["Viento", "Humedad", "Nieve", "Trueno"], "correcta": "Humedad", "explicacion": "Humidity es el vapor de agua en el aire.", "nivel": "B1"},
    {"pregunta": "Completa: She suggested ___ earlier.", "opciones": ["to leave", "leaving", "leave", "left"], "correcta": "leaving", "explicacion": "Suggest + gerundio: suggested leaving.", "nivel": "B1"},
    {"pregunta": "¿Cuál collocation es correcta con \"decision\"?", "opciones": ["do a decision", "make a decision", "take a decision always only", "have decision"], "correcta": "make a decision", "explicacion": "Se dice make a decision.", "nivel": "B1"},
    {"pregunta": "¿Qué significa \"ATTIC\"?", "opciones": ["Sótano", "Ático / desván", "Balcón", "Garaje"], "correcta": "Ático / desván", "explicacion": "Attic es el espacio bajo el techo.", "nivel": "B1"},
    {"pregunta": "¿Qué significa \"NETWORK\"?", "opciones": ["Pantalla", "Red", "Batería", "Robot"], "correcta": "Red", "explicacion": "Network es una red (de computadores o personas).", "nivel": "B1"},
    {"pregunta": "Completa: This hotel is too ___ for us.", "opciones": ["expensive", "careful", "quiet", "hungry"], "correcta": "expensive", "explicacion": "Too expensive = demasiado caro.", "nivel": "B1"},
    {"pregunta": "¿Cuál palabra es un verbo irregular en pasado?", "opciones": ["wanted", "needed", "found", "decided"], "correcta": "found", "explicacion": "Find → found; los otros son regulares (-ed).", "nivel": "B1"},
    {"pregunta": "¿Qué significa \"SCHOLARSHIP\" en una oración?", "opciones": ["He received a scholarship to study abroad.", "He cooked a scholarship.", "The scholarship is a mountain.", "Scholarship means Tuesday."], "correcta": "He received a scholarship to study abroad.", "explicacion": "La beca permite estudiar, a menudo en otro lugar.", "nivel": "B1"},
    {"pregunta": "Completa: By the time we arrived, the train ___ .", "opciones": ["left", "has left", "had left", "leaves"], "correcta": "had left", "explicacion": "Pasado anterior a otro pasado: past perfect had left.", "nivel": "B1"},
    {"pregunta": "¿Cuál es el adjetivo de \"danger\"?", "opciones": ["dangerful", "dangerous", "dangerly", "endangered only"], "correcta": "dangerous", "explicacion": "Danger → dangerous.", "nivel": "B1"},
    {"pregunta": "¿Qué significa \"DOWNLOAD\"?", "opciones": ["Subir un archivo", "Descarga", "Contraseña", "Pantalla"], "correcta": "Descarga", "explicacion": "Download es bajar / descargar un archivo.", "nivel": "B1"},
    {"pregunta": "Completa: I look forward to ___ you.", "opciones": ["see", "seeing", "seen", "saw"], "correcta": "seeing", "explicacion": "Look forward to + gerundio.", "nivel": "B1"},
    {"pregunta": "¿Cómo se dice \"científico\" en inglés?", "opciones": ["SCIENTIST", "ENGINEER", "JOURNALIST", "OFFICER"], "correcta": "SCIENTIST", "explicacion": "Científico se dice scientist.", "nivel": "B1"},
    {"pregunta": "¿Qué significa \"VALLEY\"?", "opciones": ["Montaña", "Valle", "Océano", "Hoja"], "correcta": "Valle", "explicacion": "Valley es el terreno bajo entre montañas.", "nivel": "B1"},
]

# Parejas con PNG real. El tablero toma un subconjunto según el nivel.
PAREJAS_MEMORIA = [
    {"ingles": "DOG", "imagen": "1F415.png", "nivel": "A1"},
    {"ingles": "CAT", "imagen": "1F408.png", "nivel": "A1"},
    {"ingles": "APPLE", "imagen": "1F34E.png", "nivel": "A1"},
    {"ingles": "BANANA", "imagen": "1F34C.png", "nivel": "A1"},
    {"ingles": "CAR", "imagen": "1F697.png", "nivel": "A1"},
    {"ingles": "HOUSE", "imagen": "1F3E0.png", "nivel": "A1"},
    {"ingles": "BOOK", "imagen": "1F4D6.png", "nivel": "A1"},
    {"ingles": "FISH", "imagen": "1F41F.png", "nivel": "A1"},
    {"ingles": "HORSE", "imagen": "1F40E.png", "nivel": "A2"},
    {"ingles": "LION", "imagen": "1F981.png", "nivel": "A2"},
    {"ingles": "DOCTOR", "imagen": "1F9D1-200D-2695-FE0F.png", "nivel": "A2"},
    {"ingles": "PILOT", "imagen": "1F9D1-200D-2708-FE0F.png", "nivel": "A2"},
    {"ingles": "ELEPHANT", "imagen": "1F418.png", "nivel": "B1"},
    {"ingles": "ASTRONAUT", "imagen": "1F9D1-200D-1F680.png", "nivel": "B1"},
    {"ingles": "FIREFIGHTER", "imagen": "1F9D1-200D-1F692.png", "nivel": "B1"},
    {"ingles": "COMPUTER", "imagen": "1F4BB.png", "nivel": "B1"},
]

MENSAJES_PIPO = {
    "saludo": [
        "¡Hola! Soy Pipo, tu pingüino amigo.",
        "¡Vamos a aprender inglés!",
        "Escucha con atención y verás qué fácil es.",
    ],
    "correcto": [
        "¡Muy bien!",
        "¡Excelente trabajo!",
        "¡Eres un campeón!",
        "¡Sigue así!",
    ],
    "incorrecto": [
        "Inténtalo nuevamente.",
        "Ya casi lo tienes.",
        "No te rindas, ¡tú puedes!",
    ],
    "felicitaciones": [
        "¡Terminaste la actividad!",
        "¡Muy buen trabajo!",
        "¡Lo lograste!",
    ],
    "perfecto": [
        "¡PERFECTO! ¡Todas las respuestas correctas!",
        "¡Increíble! No fallaste ninguna.",
    ],
    "animo": [
        "Practicar más te ayudará a mejorar.",
        "¡No te preocupes! Aprendemos practicando.",
    ],
    "despedida": [
        "¡Hasta pronto! Sigue practicando.",
        "¡Nos vemos! Practica mucho.",
    ],
    "ayuda": [
        "Lee cada pregunta con calma.",
        "Si no sabes una respuesta, piensa en la palabra.",
        "¡Cada intento te hace aprender más!",
    ],
    "nivel": [
        "A1 es lo básico del día a día. A2 ya es el aula. B1 te deja hablar con más independencia.",
        "Elige el nivel que se parezca a tu inglés de ahora. Siempre puedes cambiarlo.",
    ],
}


def mensaje_pipo(clave):
    """Devuelve un mensaje al azar de Pipo para la situación indicada."""
    mensajes = MENSAJES_PIPO[clave]
    return random.choice(mensajes)
