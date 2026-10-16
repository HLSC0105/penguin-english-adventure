"""Genera src/penguin_english/datos/vocabulario.py (uso de desarrollo)."""
from pathlib import Path
from textwrap import dedent

# (ingles, espanol, ejemplo, nivel, imagen o None)
# Imágenes: solo archivos que ya existen en recursos/imagenes/.

ANIMALES = [
    ("dog", "perro", "I have a dog.", "A1", "1F415.png"),
    ("cat", "gato", "My cat is black.", "A1", "1F408.png"),
    ("fish", "pez", "The fish swims.", "A1", "1F41F.png"),
    ("bird", "pájaro", "The bird sings.", "A1", "1F426.png"),
    ("lion", "león", "The lion is big.", "A1", "1F981.png"),
    ("elephant", "elefante", "The elephant has a long nose.", "A1", "1F418.png"),
    ("horse", "caballo", "The horse runs fast.", "A1", "1F40E.png"),
    ("sheep", "oveja", "The sheep is white.", "A1", None),
    ("cow", "vaca", "The cow gives milk.", "A1", None),
    ("rabbit", "conejo", "The rabbit is fast.", "A1", None),
    ("turtle", "tortuga", "The turtle is slow.", "A2", None),
    ("monkey", "mono", "The monkey eats a banana.", "A2", None),
    ("bear", "oso", "The bear lives in the forest.", "A2", None),
    ("tiger", "tigre", "The tiger has stripes.", "A2", None),
    ("frog", "rana", "The frog jumps.", "A2", None),
    ("butterfly", "mariposa", "The butterfly is on the flower.", "A2", None),
    ("whale", "ballena", "The whale is the largest animal.", "B1", None),
    ("eagle", "águila", "The eagle flies high.", "B1", None),
    ("wolf", "lobo", "The wolf hunts at night.", "B1", None),
    ("dolphin", "delfín", "The dolphin is intelligent.", "B1", None),
]

COLORES = [
    ("red", "rojo", "The apple is red.", "A1", None),
    ("blue", "azul", "The sky is blue.", "A1", None),
    ("green", "verde", "The grass is green.", "A1", None),
    ("yellow", "amarillo", "The banana is yellow.", "A1", None),
    ("navy", "azul marino", "The navy shirt is dark.", "B1", None),
    ("purple", "morado", "My shirt is purple.", "A1", None),
    ("pink", "rosado", "The flower is pink.", "A1", None),
    ("black", "negro", "The cat is black.", "A1", None),
    ("white", "blanco", "The snow is white.", "A1", None),
    ("brown", "marrón", "The dog is brown.", "A2", None),
    ("gray", "gris", "The cloud is gray.", "A2", None),
    ("gold", "dorado", "The ring is gold.", "B1", None),
]

FRUTAS = [
    ("apple", "manzana", "I eat an apple.", "A1", "1F34E.png"),
    ("banana", "plátano", "The monkey eats a banana.", "A1", "1F34C.png"),
    ("orange", "naranja", "I drink orange juice.", "A1", "1F34A.png"),
    ("grape", "uva", "Grapes are sweet.", "A1", "1F347.png"),
    ("strawberry", "fresa", "I love strawberries.", "A1", "1F353.png"),
    ("watermelon", "sandía", "The watermelon is big.", "A1", "1F349.png"),
    ("pear", "pera", "The pear is green.", "A1", "1F350.png"),
    ("lemon", "limón", "The lemon is sour.", "A2", None),
    ("peach", "durazno", "The peach is soft.", "A2", None),
    ("mango", "mango", "The mango is sweet.", "A2", None),
    ("cherry", "cereza", "Cherries are red.", "A2", None),
    ("pineapple", "piña", "Pineapple is tropical.", "A2", None),
    ("coconut", "coco", "There is water in the coconut.", "B1", None),
    ("avocado", "aguacate", "I put avocado on toast.", "B1", None),
]

NUMEROS = [
    ("one", "uno", "I have one pencil.", "A1", None),
    ("two", "dos", "I have two eyes.", "A1", None),
    ("three", "tres", "There are three cats.", "A1", None),
    ("four", "cuatro", "The dog has four legs.", "A1", None),
    ("five", "cinco", "I have five fingers.", "A1", None),
    ("six", "seis", "There are six eggs.", "A1", None),
    ("seven", "siete", "There are seven days in a week.", "A1", None),
    ("eight", "ocho", "I have eight crayons.", "A1", None),
    ("nine", "nueve", "She is nine years old.", "A1", None),
    ("ten", "diez", "I can count to ten.", "A1", None),
    ("eleven", "once", "Eleven comes after ten.", "A2", None),
    ("twelve", "doce", "There are twelve months.", "A2", None),
    ("thirteen", "trece", "Thirteen is an unlucky number for some people.", "A2", None),
    ("fourteen", "catorce", "He is fourteen years old.", "A2", None),
    ("fifteen", "quince", "The class starts at fifteen past eight.", "A2", None),
    ("twenty", "veinte", "There are twenty students.", "A2", None),
    ("thirty", "treinta", "My mother is thirty-five.", "A2", None),
    ("hundred", "cien", "A century has one hundred years.", "B1", None),
    ("thousand", "mil", "The town has a thousand people.", "B1", None),
    ("million", "millón", "A million is a very large number.", "B1", None),
]

FAMILIA = [
    ("mother", "mamá", "My mother cooks.", "A1", "1F469.png"),
    ("father", "papá", "My father works.", "A1", "1F468.png"),
    ("sister", "hermana", "My sister plays.", "A1", "1F467.png"),
    ("brother", "hermano", "My brother runs.", "A1", "1F466.png"),
    ("baby", "bebé", "The baby sleeps.", "A1", "1F476.png"),
    ("grandmother", "abuela", "My grandmother is kind.", "A1", "1F475.png"),
    ("grandfather", "abuelo", "My grandfather reads.", "A1", "1F474.png"),
    ("family", "familia", "I love my family.", "A1", None),
    ("uncle", "tío", "My uncle lives in the city.", "A2", None),
    ("aunt", "tía", "My aunt is a teacher.", "A2", None),
    ("cousin", "primo", "My cousin is my age.", "A2", None),
    ("son", "hijo", "Their son is five.", "A2", None),
    ("daughter", "hija", "Their daughter studies English.", "A2", None),
    ("parents", "padres", "My parents help me.", "A2", None),
    ("husband", "esposo", "Her husband is a doctor.", "B1", None),
    ("wife", "esposa", "His wife works at the hospital.", "B1", None),
]

CUERPO = [
    ("eyes", "ojos", "I see with my eyes.", "A1", "1F440.png"),
    ("ear", "oído", "I listen with my ear.", "A1", "1F442.png"),
    ("nose", "nariz", "I smell with my nose.", "A1", "1F443.png"),
    ("mouth", "boca", "I eat with my mouth.", "A1", "1F444.png"),
    ("hand", "mano", "I write with my hand.", "A1", "1F44B.png"),
    ("foot", "pie", "I walk with my foot.", "A1", "1F9B6.png"),
    ("tooth", "diente", "I brush my tooth.", "A1", "1F9B7.png"),
    ("head", "cabeza", "I have a hat on my head.", "A1", None),
    ("hair", "pelo", "Her hair is long.", "A1", None),
    ("arm", "brazo", "I raise my arm.", "A2", None),
    ("leg", "pierna", "My left leg hurts.", "A2", None),
    ("finger", "dedo", "I have five fingers.", "A2", None),
    ("knee", "rodilla", "He fell on his knee.", "A2", None),
    ("heart", "corazón", "My heart beats fast.", "A2", None),
    ("shoulder", "hombro", "The bag is on my shoulder.", "B1", None),
    ("stomach", "estómago", "My stomach is full.", "B1", None),
]

OBJETOS = [
    ("book", "libro", "I read a book.", "A1", "1F4D6.png"),
    ("house", "casa", "My house is big.", "A1", "1F3E0.png"),
    ("car", "carro", "My father drives a car.", "A1", "1F697.png"),
    ("clock", "reloj", "The clock is on the wall.", "A1", "1F552.png"),
    ("key", "llave", "This is the key.", "A1", "1F511.png"),
    ("pencil", "lápiz", "I write with a pencil.", "A1", "270F.png"),
    ("computer", "computadora", "I play on the computer.", "A1", "1F4BB.png"),
    ("table", "mesa", "The book is on the table.", "A1", None),
    ("chair", "silla", "Please sit on the chair.", "A1", None),
    ("window", "ventana", "Open the window.", "A2", None),
    ("door", "puerta", "Close the door.", "A2", None),
    ("bag", "bolso", "My bag is heavy.", "A2", None),
    ("bottle", "botella", "The bottle is full of water.", "A2", None),
    ("cup", "taza", "I drink tea from a cup.", "A2", None),
    ("lamp", "lámpara", "Turn on the lamp.", "B1", None),
    ("mirror", "espejo", "I look at myself in the mirror.", "B1", None),
]

PROFESIONES = [
    ("doctor", "médico", "The doctor helps people.", "A1", "1FA79.png"),
    ("teacher", "profesor", "The teacher explains the lesson.", "A1", None),
    ("pilot", "piloto", "The pilot flies a plane.", "A1", "2708.png"),
    ("artist", "artista", "The artist paints.", "A1", "1F3A8.png"),
    ("musician", "músico", "The musician plays music.", "A1", "1F3B8.png"),
    ("firefighter", "bombero", "The firefighter saves people.", "A2", "1F692.png"),
    ("astronaut", "astronauta", "The astronaut travels to space.", "A2", "1F680.png"),
    ("chef", "cocinero", "The chef cooks in a restaurant.", "A2", None),
    ("farmer", "granjero", "The farmer grows vegetables.", "A2", None),
    ("nurse", "enfermero", "The nurse works at night.", "A2", None),
    ("engineer", "ingeniero", "The engineer designs bridges.", "B1", None),
    ("scientist", "científico", "The scientist does an experiment.", "B1", None),
    ("journalist", "periodista", "The journalist writes the news.", "B1", None),
    ("officer", "oficial", "The police officer helps us.", "A2", "1F46E.png"),
]

DIAS = [
    ("Monday", "lunes", "I go to school on Monday.", "A1", None),
    ("Tuesday", "martes", "We play soccer on Tuesday.", "A1", None),
    ("Wednesday", "miércoles", "I study English on Wednesday.", "A1", None),
    ("Thursday", "jueves", "We read on Thursday.", "A1", None),
    ("Friday", "viernes", "I am happy on Friday.", "A1", None),
    ("Saturday", "sábado", "I play on Saturday.", "A1", None),
    ("Sunday", "domingo", "We rest on Sunday.", "A1", None),
]

MESES = [
    ("January", "enero", "January is the first month.", "A1", None),
    ("February", "febrero", "February is cold.", "A1", None),
    ("March", "marzo", "March is windy.", "A1", None),
    ("April", "abril", "It rains in April.", "A1", None),
    ("May", "mayo", "May has many flowers.", "A1", None),
    ("June", "junio", "June is warm.", "A1", None),
    ("July", "julio", "I swim in July.", "A1", None),
    ("August", "agosto", "August is a holiday month.", "A1", None),
    ("September", "septiembre", "School starts in September.", "A1", None),
    ("October", "octubre", "October has Halloween.", "A2", None),
    ("November", "noviembre", "November is rainy.", "A2", None),
    ("December", "diciembre", "December is the last month.", "A1", None),
]

ESCUELA = [
    ("school", "escuela", "I go to school every day.", "A1", None),
    ("student", "estudiante", "She is a good student.", "A1", None),
    ("classroom", "salón", "The classroom is quiet.", "A2", None),
    ("notebook", "cuaderno", "I write in my notebook.", "A1", None),
    ("homework", "tarea", "I do my homework after lunch.", "A2", None),
    ("exam", "examen", "The exam is on Friday.", "A2", None),
    ("library", "biblioteca", "I study in the library.", "A2", None),
    ("dictionary", "diccionario", "Look up the word in the dictionary.", "A2", None),
    ("lesson", "lección", "Today's lesson is about verbs.", "A2", None),
    ("grade", "nota", "I got a good grade.", "A2", None),
    ("university", "universidad", "She wants to go to university.", "B1", None),
    ("scholarship", "beca", "He received a scholarship.", "B1", None),
    ("subject", "materia", "Math is my favourite subject.", "B1", None),
    ("blackboard", "pizarra", "The teacher writes on the blackboard.", "A2", None),
    ("ruler", "regla", "Draw a line with a ruler.", "A1", None),
    ("eraser", "borrador", "I need an eraser.", "A1", None),
]

CASA = [
    ("kitchen", "cocina", "We cook in the kitchen.", "A1", None),
    ("bedroom", "habitación", "My bedroom is small.", "A1", None),
    ("bathroom", "baño", "The bathroom is clean.", "A1", None),
    ("garden", "jardín", "There are flowers in the garden.", "A1", None),
    ("floor", "piso", "The cat sleeps on the floor.", "A2", None),
    ("wall", "pared", "There is a picture on the wall.", "A2", None),
    ("fridge", "nevera", "The milk is in the fridge.", "A2", None),
    ("bed", "cama", "I go to bed at ten.", "A1", None),
    ("sofa", "sofá", "We sit on the sofa.", "A2", None),
    ("stairs", "escaleras", "The bedroom is up the stairs.", "A2", None),
    ("garage", "garaje", "The car is in the garage.", "A2", None),
    ("balcony", "balcón", "I read on the balcony.", "B1", None),
    ("attic", "ático", "Old boxes are in the attic.", "B1", None),
    ("basement", "sótano", "The basement is dark.", "B1", None),
    ("roof", "techo", "Rain falls on the roof.", "B1", None),
    ("neighbour", "vecino", "Our neighbour is friendly.", "B1", None),
]

CLIMA = [
    ("sun", "sol", "The sun is bright.", "A1", None),
    ("rain", "lluvia", "I don't like the rain.", "A1", None),
    ("cloud", "nube", "There is a cloud in the sky.", "A1", None),
    ("snow", "nieve", "The snow is cold.", "A1", None),
    ("wind", "viento", "The wind is strong today.", "A2", None),
    ("storm", "tormenta", "The storm was loud.", "A2", None),
    ("hot", "caliente", "It is hot in summer.", "A1", None),
    ("cold", "frío", "It is cold in winter.", "A1", None),
    ("warm", "cálido", "June is warm.", "A2", None),
    ("weather", "clima", "The weather is nice today.", "A2", None),
    ("forecast", "pronóstico", "The forecast says rain.", "B1", None),
    ("humidity", "humedad", "The humidity is high.", "B1", None),
    ("drought", "sequía", "The drought lasted months.", "B1", None),
    ("thunder", "trueno", "I heard thunder last night.", "B1", None),
]

ROPA = [
    ("shirt", "camisa", "My shirt is blue.", "A1", None),
    ("pants", "pantalones", "These pants are new.", "A1", None),
    ("dress", "vestido", "She wears a red dress.", "A1", None),
    ("shoes", "zapatos", "My shoes are black.", "A1", None),
    ("hat", "sombrero", "He has a hat.", "A1", None),
    ("coat", "abrigo", "Wear a coat; it is cold.", "A2", None),
    ("jacket", "chaqueta", "I left my jacket at school.", "A2", None),
    ("socks", "medias", "I can't find my socks.", "A2", None),
    ("scarf", "bufanda", "The scarf is warm.", "A2", None),
    ("gloves", "guantes", "Put on your gloves.", "A2", None),
    ("skirt", "falda", "The skirt is yellow.", "A2", None),
    ("sweater", "suéter", "This sweater is too big.", "A2", None),
    ("uniform", "uniforme", "Students wear a uniform.", "B1", None),
    ("raincoat", "impermeable", "Take a raincoat if it rains.", "B1", None),
]

COMIDA = [
    ("bread", "pan", "I eat bread for breakfast.", "A1", None),
    ("milk", "leche", "I drink milk.", "A1", None),
    ("cheese", "queso", "The cheese is yellow.", "A1", None),
    ("egg", "huevo", "I had an egg.", "A1", None),
    ("rice", "arroz", "We eat rice with chicken.", "A1", None),
    ("chicken", "pollo", "Chicken is my favourite food.", "A1", None),
    ("soup", "sopa", "The soup is hot.", "A1", None),
    ("salad", "ensalada", "I want a salad.", "A2", None),
    ("pizza", "pizza", "We share a pizza.", "A1", None),
    ("cake", "torta", "The cake is for my birthday.", "A1", None),
    ("chocolate", "chocolate", "Chocolate is sweet.", "A1", None),
    ("water", "agua", "Please give me some water.", "A1", None),
    ("juice", "jugo", "Orange juice is fresh.", "A1", None),
    ("breakfast", "desayuno", "Breakfast is at seven.", "A2", None),
    ("dinner", "cena", "Dinner is the last meal.", "A2", None),
    ("hungry", "hambriento", "I am hungry.", "A2", None),
    ("thirsty", "sediento", "She is thirsty.", "A2", None),
    ("recipe", "receta", "This recipe is easy to follow.", "B1", None),
    ("ingredient", "ingrediente", "Salt is an important ingredient.", "B1", None),
]

VIAJES = [
    ("airport", "aeropuerto", "We wait at the airport.", "A2", None),
    ("ticket", "boleto", "I bought a train ticket.", "A2", None),
    ("passport", "pasaporte", "Don't forget your passport.", "A2", None),
    ("train", "tren", "The train is late.", "A1", None),
    ("bus", "bus", "I take the bus to school.", "A1", None),
    ("plane", "avión", "The plane flies to Madrid.", "A1", None),
    ("hotel", "hotel", "We stay at a hotel.", "A2", None),
    ("map", "mapa", "Look at the map.", "A1", None),
    ("luggage", "equipaje", "My luggage is heavy.", "B1", None),
    ("city", "ciudad", "Bogotá is a big city.", "A1", None),
    ("country", "país", "Colombia is my country.", "A1", None),
    ("island", "isla", "They visit an island.", "A2", None),
    ("beach", "playa", "We swim at the beach.", "A1", None),
    ("journey", "viaje", "The journey took five hours.", "B1", None),
    ("border", "frontera", "We crossed the border in the morning.", "B1", None),
]

VERBOS = [
    ("have", "tener", "I have a book.", "A1", None),
    ("go", "ir", "I go to school.", "A1", None),
    ("eat", "comer", "We eat breakfast.", "A1", None),
    ("play", "jugar", "They play soccer.", "A1", None),
    ("read", "leer", "She reads every night.", "A1", None),
    ("write", "escribir", "I write in English.", "A1", None),
    ("run", "correr", "He can run fast.", "A1", None),
    ("swim", "nadar", "I swim in July.", "A1", None),
    ("study", "estudiar", "We study English.", "A1", None),
    ("work", "trabajar", "My father works.", "A1", None),
    ("live", "vivir", "I live in a small town.", "A2", None),
    ("want", "querer", "I want some water.", "A2", None),
    ("need", "necesitar", "You need a pencil.", "A2", None),
    ("make", "hacer", "They make a cake.", "A2", None),
    ("take", "tomar", "Take the bus.", "A2", None),
    ("speak", "hablar", "I speak a little English.", "A2", None),
    ("listen", "escuchar", "Please listen to the teacher.", "A2", None),
    ("think", "pensar", "I think it is a good idea.", "B1", None),
    ("find", "encontrar", "I cannot find my keys.", "B1", None),
    ("become", "volverse", "She wants to become a doctor.", "B1", None),
    ("decide", "decidir", "We decided to stay home.", "B1", None),
]

ADJETIVOS = [
    ("big", "grande", "The house is big.", "A1", None),
    ("small", "pequeño", "The cat is small.", "A1", None),
    ("happy", "feliz", "I am happy today.", "A1", None),
    ("sad", "triste", "He looks sad.", "A1", None),
    ("new", "nuevo", "I have a new bag.", "A1", None),
    ("old", "viejo", "This book is old.", "A1", None),
    ("fast", "rápido", "The horse is fast.", "A1", None),
    ("slow", "lento", "The turtle is slow.", "A1", None),
    ("beautiful", "hermoso", "The garden is beautiful.", "A2", None),
    ("difficult", "difícil", "This exam is difficult.", "A2", None),
    ("easy", "fácil", "The first lesson is easy.", "A2", None),
    ("strong", "fuerte", "The wind is strong.", "A2", None),
    ("weak", "débil", "I feel weak after the race.", "A2", None),
    ("busy", "ocupado", "The teacher is busy.", "A2", None),
    ("quiet", "silencioso", "The library is quiet.", "A2", None),
    ("loud", "ruidoso", "The music is too loud.", "A2", None),
    ("careful", "cuidadoso", "Be careful with the hot soup.", "B1", None),
    ("expensive", "caro", "That hotel is expensive.", "B1", None),
    ("dangerous", "peligroso", "The storm is dangerous.", "B1", None),
]

NATURALEZA = [
    ("tree", "árbol", "The bird is in the tree.", "A1", None),
    ("flower", "flor", "The flower is pink.", "A1", None),
    ("river", "río", "The river is long.", "A1", None),
    ("mountain", "montaña", "The mountain is high.", "A1", None),
    ("forest", "bosque", "The bear lives in the forest.", "A2", None),
    ("ocean", "océano", "The ocean is deep.", "A2", None),
    ("stone", "piedra", "There is a stone on the path.", "A2", None),
    ("grass", "pasto", "The grass is green.", "A1", None),
    ("leaf", "hoja", "The leaf fell from the tree.", "A2", None),
    ("moon", "luna", "The moon is bright tonight.", "A1", None),
    ("star", "estrella", "I can see a star.", "A1", None),
    ("valley", "valle", "The village is in the valley.", "B1", None),
    ("horizon", "horizonte", "The sun sets on the horizon.", "B1", None),
    ("wildlife", "fauna", "The park protects wildlife.", "B1", None),
]

TECNOLOGIA = [
    ("phone", "teléfono", "My phone is on the table.", "A1", None),
    ("internet", "internet", "We use the internet at school.", "A2", None),
    ("website", "sitio web", "This website teaches English.", "A2", None),
    ("password", "contraseña", "Never share your password.", "A2", None),
    ("screen", "pantalla", "Look at the screen.", "A2", None),
    ("keyboard", "teclado", "Type with the keyboard.", "A2", None),
    ("mouse", "ratón", "Click with the mouse.", "A2", None),
    ("email", "correo", "I sent an email to my teacher.", "A2", None),
    ("download", "descarga", "The download is slow.", "B1", None),
    ("software", "software", "The software needs an update.", "B1", None),
    ("battery", "batería", "The battery is low.", "B1", None),
    ("camera", "cámara", "The camera takes good photos.", "A2", None),
    ("robot", "robot", "The robot can walk.", "B1", None),
    ("network", "red", "The school network is down.", "B1", None),
]

# Pictogramas OpenMoji alineados con el significado (no metonimias raras).
IMAGENES = {
    "sheep": "1F411.png", "cow": "1F404.png", "rabbit": "1F407.png",
    "turtle": "1F422.png", "monkey": "1F412.png", "bear": "1F43B.png",
    "tiger": "1F405.png", "frog": "1F438.png", "butterfly": "1F98B.png",
    "whale": "1F40B.png", "eagle": "1F985.png", "wolf": "1F43A.png",
    "dolphin": "1F42C.png",
    "red": "1F534.png", "blue": "1F535.png", "green": "1F7E2.png",
    "yellow": "1F7E1.png", "navy": "1F535.png", "purple": "1F7E3.png",
    "pink": "1F338.png", "black": "26AB.png", "white": "26AA.png",
    "brown": "1F7E4.png", "gray": "26AA.png", "gold": "1F947.png",
    "lemon": "1F34B.png", "peach": "1F351.png", "mango": "1F96D.png",
    "cherry": "1F352.png", "pineapple": "1F34D.png", "coconut": "1F965.png",
    "avocado": "1F951.png",
    "one": "0031-FE0F-20E3.png", "two": "0032-FE0F-20E3.png",
    "three": "0033-FE0F-20E3.png", "four": "0034-FE0F-20E3.png",
    "five": "0035-FE0F-20E3.png", "six": "0036-FE0F-20E3.png",
    "seven": "0037-FE0F-20E3.png", "eight": "0038-FE0F-20E3.png",
    "nine": "0039-FE0F-20E3.png",
    "ten": "1F51F.png", "eleven": "1F522.png", "twelve": "1F522.png",
    "thirteen": "1F522.png", "fourteen": "1F522.png", "fifteen": "1F522.png",
    "twenty": "1F522.png", "thirty": "1F522.png", "hundred": "1F4AF.png",
    "thousand": "1F4B0.png", "million": "1F4B0.png",
    "family": "1F46A.png", "uncle": "1F468.png", "aunt": "1F469.png",
    "cousin": "1F9D1.png", "son": "1F466.png", "daughter": "1F467.png",
    "parents": "1F46A.png", "husband": "1F468.png", "wife": "1F469.png",
    "hand": "270B.png", "head": "1F9D1.png", "hair": "1F9B1.png",
    "arm": "1F4AA.png", "leg": "1F9B5.png", "finger": "1F448.png",
    "knee": "1F9B5.png", "heart": "2764.png", "shoulder": "1F4AA.png",
    "stomach": "1F37D.png",
    "table": "1FA91.png", "chair": "1FA91.png", "window": "1FA9F.png",
    "door": "1F6AA.png", "bag": "1F45C.png", "bottle": "1F37E.png",
    "cup": "2615.png", "lamp": "1F4A1.png", "mirror": "1FA9E.png",
    "doctor": "1F9D1-200D-2695-FE0F.png",
    "teacher": "1F9D1-200D-1F3EB.png",
    "pilot": "1F9D1-200D-2708-FE0F.png",
    "musician": "1F3B5.png",
    "firefighter": "1F9D1-200D-1F692.png",
    "astronaut": "1F9D1-200D-1F680.png",
    "chef": "1F9D1-200D-1F373.png",
    "farmer": "1F9D1-200D-1F33E.png",
    "nurse": "1FA7A.png",
    "engineer": "1F527.png",
    "scientist": "1F9D1-200D-1F52C.png",
    "journalist": "1F4F0.png",
    "Monday": "1F4C5.png", "Tuesday": "1F4C5.png", "Wednesday": "1F4C5.png",
    "Thursday": "1F4C5.png", "Friday": "1F4C5.png", "Saturday": "1F4C5.png",
    "Sunday": "1F4C5.png",
    "January": "1F4C6.png", "February": "1F4C6.png", "March": "1F4C6.png",
    "April": "1F4C6.png", "May": "1F4C6.png", "June": "1F4C6.png",
    "July": "1F4C6.png", "August": "1F4C6.png", "September": "1F4C6.png",
    "October": "1F4C6.png", "November": "1F4C6.png", "December": "1F4C6.png",
    "school": "1F3EB.png", "student": "1F9D1.png", "classroom": "1F4DA.png",
    "notebook": "1F4D3.png", "homework": "1F4DD.png", "exam": "1F4C4.png",
    "library": "1F4DA.png", "dictionary": "1F4D5.png", "lesson": "1F4D6.png",
    "grade": "1F31F.png", "university": "1F3EB.png", "scholarship": "1F393.png",
    "subject": "1F4D0.png", "blackboard": "1F4CB.png", "ruler": "1F4CF.png",
    "eraser": "1F9F9.png",
    "kitchen": "1F373.png", "bedroom": "1F6CF.png", "bathroom": "1F6C1.png",
    "garden": "1F33F.png", "floor": "1F9F1.png", "wall": "1F5BC.png",
    "fridge": "1F9CA.png", "bed": "1F6CF.png", "sofa": "1F6CB.png",
    "stairs": "1F9F3.png", "garage": "1F697.png", "balcony": "1F3E0.png",
    "attic": "1F3E0.png", "basement": "1F3E0.png", "roof": "1F3D8.png",
    "neighbour": "1F91D.png",
    "sun": "2600.png", "rain": "1F327.png", "cloud": "2601.png",
    "snow": "1F328.png", "wind": "1F32C.png", "storm": "26C8.png",
    "hot": "1F525.png", "cold": "2744.png", "warm": "1F321.png",
    "weather": "26C5.png", "humidity": "1F4A7.png", "drought": "1F335.png",
    "thunder": "26A1.png",
    "shirt": "1F455.png", "pants": "1F456.png", "dress": "1F457.png",
    "shoes": "1F45F.png", "hat": "1F3A9.png", "coat": "1F9E5.png",
    "jacket": "1F9E5.png", "socks": "1F9E6.png", "scarf": "1F9E3.png",
    "gloves": "1F9E4.png", "skirt": "1F457.png", "sweater": "1F9E5.png",
    "uniform": "1F454.png", "raincoat": "2614.png",
    "bread": "1F35E.png", "milk": "1F95B.png", "cheese": "1F9C0.png",
    "egg": "1F95A.png", "rice": "1F35A.png", "chicken": "1F357.png",
    "soup": "1F372.png", "salad": "1F957.png", "pizza": "1F355.png",
    "cake": "1F370.png", "chocolate": "1F36B.png", "water": "1F4A7.png",
    "juice": "1F9C3.png", "breakfast": "1F373.png", "dinner": "1F37D.png",
    "hungry": "1F37D.png", "thirsty": "1F4A7.png", "recipe": "1F4D3.png",
    "ingredient": "1F9C2.png",
    "airport": "1F6EB.png", "ticket": "1F39F.png", "passport": "1FAAA.png",
    "train": "1F686.png", "bus": "1F68C.png", "plane": "2708.png",
    "hotel": "1F3E8.png", "map": "1F5FA.png", "luggage": "1F9F3.png",
    "city": "1F3D9.png", "country": "1F30D.png", "island": "1F3DD.png",
    "beach": "1F3D6.png", "journey": "1F697.png", "border": "1F6A7.png",
    "have": "1F91D.png", "go": "1F6B6.png", "eat": "1F374.png",
    "play": "26BD.png", "read": "1F4D6.png", "write": "270F.png",
    "run": "1F3C3.png", "swim": "1F3CA.png", "study": "1F4DA.png",
    "work": "1F4BC.png", "live": "1F3E0.png", "want": "1F64F.png",
    "need": "2757.png", "make": "1F6E0.png", "take": "1F45C.png",
    "speak": "1F5E3.png", "listen": "1F442.png", "think": "1F914.png",
    "find": "1F50D.png", "become": "1F331.png", "decide": "1F91D.png",
    "big": "1F4D0.png", "small": "1F90F.png", "happy": "1F60A.png",
    "sad": "1F622.png", "new": "1F195.png", "old": "1F4DC.png",
    "fast": "1F4A8.png", "slow": "1F422.png", "beautiful": "1F33A.png",
    "difficult": "2753.png", "easy": "1F44D.png", "strong": "1F4AA.png",
    "weak": "1F637.png", "busy": "1F4CB.png", "quiet": "1F910.png",
    "loud": "1F50A.png", "careful": "26A0.png", "expensive": "1F4B0.png",
    "dangerous": "26A0.png",
    "tree": "1F333.png", "flower": "1F338.png", "river": "1F30A.png",
    "mountain": "26F0.png", "forest": "1F332.png", "ocean": "1F30A.png",
    "stone": "1FAA8.png", "grass": "1F33F.png", "leaf": "1F343.png",
    "moon": "1F319.png", "star": "2B50.png", "valley": "1F3D4.png",
    "horizon": "1F307.png", "wildlife": "1F98C.png",
    "phone": "1F4F1.png", "internet": "1F310.png", "website": "1F310.png",
    "password": "1F512.png", "screen": "1F5A5.png", "keyboard": "2328.png",
    "mouse": "1F5B1.png", "email": "1F4E7.png", "download": "1F4E5.png",
    "software": "1F4BB.png", "battery": "1F50B.png", "camera": "1F4F7.png",
    "robot": "1F916.png", "network": "1F310.png",
}


_CARPETA_PNG = Path(__file__).resolve().parents[1] / "recursos" / "imagenes"


def _con_imagen(item):
    ingles, espanol, ejemplo, nivel, imagen = item
    propuesta = IMAGENES.get(ingles, imagen)
    if propuesta is None:
        propuesta = imagen
    if propuesta and not (_CARPETA_PNG / propuesta).exists():
        propuesta = None
    return (ingles, espanol, ejemplo, nivel, propuesta)


CATEGORIAS = [
    ("Animales", ANIMALES),
    ("Colores", COLORES),
    ("Frutas", FRUTAS),
    ("Números", NUMEROS),
    ("Familia", FAMILIA),
    ("Partes del cuerpo", CUERPO),
    ("Objetos", OBJETOS),
    ("Profesiones", PROFESIONES),
    ("Días de la semana", DIAS),
    ("Meses del año", MESES),
    ("Escuela", ESCUELA),
    ("Casa", CASA),
    ("Clima", CLIMA),
    ("Ropa", ROPA),
    ("Comida", COMIDA),
    ("Viajes", VIAJES),
    ("Verbos", VERBOS),
    ("Adjetivos", ADJETIVOS),
    ("Naturaleza", NATURALEZA),
    ("Tecnología", TECNOLOGIA),
]


def fmt_item(item):
    ingles, espanol, ejemplo, nivel, imagen = item
    img = "None" if imagen is None else f'"{imagen}"'
    return (
        f'        {{"ingles": "{ingles}", "espanol": "{espanol}", '
        f'"imagen": {img}, "ejemplo": "{ejemplo}", "nivel": "{nivel}"}}'
    )


def main():
    vistos = {}
    total = 0
    por_nivel = {"A1": 0, "A2": 0, "B1": 0}
    bloques = []
    for nombre, items in CATEGORIAS:
        lineas = []
        for item in items:
            item = _con_imagen(item)
            ingles = item[0].lower()
            if ingles in vistos:
                raise SystemExit(f"Duplicado '{item[0]}' en {nombre} y {vistos[ingles]}")
            vistos[ingles] = nombre
            por_nivel[item[3]] += 1
            total += 1
            lineas.append(fmt_item(item))
        cuerpo = ",\n".join(lineas)
        bloques.append(f'    "{nombre}": [\n{cuerpo},\n    ]')

    if total < 300:
        raise SystemExit(f"Solo {total} palabras; se necesitan ≥ 300")

    cabecera = dedent('''\
        """Vocabulario del juego organizado por categorías y nivel CEFR.

        Cada palabra es un diccionario:
        - "ingles":   palabra en inglés
        - "espanol":  traducción (clave sin tilde para escribirla fácil)
        - "imagen":   PNG en recursos/imagenes, o None → círculo con letra
        - "ejemplo":  frase que usa la palabra (present simple / there is)
        - "nivel":    "A1", "A2" o "B1" según el MCER

        El filtro acumulativo vive en ``datos.niveles``: B1 incluye A1+A2.
        Este archivo es solo datos: no importa Tkinter ni pygame.
        """

        def _palabra(ingles, espanol, ejemplo, nivel, imagen=None):
            """Fábrica pequeña para no repetir las claves a mano."""
            return {
                "ingles": ingles,
                "espanol": espanol,
                "imagen": imagen,
                "ejemplo": ejemplo,
                "nivel": nivel,
            }


        ''')
    # We inlined dicts above for grep-ability in class; skip _palabra in output
    # to match the rest of the codebase style (explicit dicts).
    cabecera = dedent('''\
        """Vocabulario del juego organizado por categorías y nivel CEFR.

        Cada palabra es un diccionario:
        - "ingles":   palabra en inglés
        - "espanol":  traducción (clave sin tilde para escribirla fácil)
        - "imagen":   PNG en recursos/imagenes, o None → círculo con letra
        - "ejemplo":  frase que usa la palabra
        - "nivel":    "A1", "A2" o "B1" según el MCER

        El filtro acumulativo vive en ``datos.niveles``: quien elige B1
        sigue viendo A1 y A2. Este archivo es solo datos.

        Precondición de cada entrada: ingles y espanol no vacíos, nivel
        en {A1, A2, B1}. Postcondición del módulo: TODAS_LAS_PALABRAS
        se construye recorriendo CATEGORIAS para no duplicar la lista.
        """

        ''')
    cuerpo = "CATEGORIAS = {\n" + ",\n".join(bloques) + ",\n}\n"
    pie = dedent('''

        # Lista plana: un solo recorrido para no escribir las palabras dos veces.
        TODAS_LAS_PALABRAS = []
        for categoria in CATEGORIAS.values():
            for palabra in categoria:
                TODAS_LAS_PALABRAS.append(palabra)
        ''')
    destino = Path(__file__).resolve().parents[1] / "src/penguin_english/datos/vocabulario.py"
    destino.write_text(cabecera + cuerpo + pie, encoding="utf-8")
    print(f"Escrito {destino}")
    print(f"Total={total} A1={por_nivel['A1']} A2={por_nivel['A2']} B1={por_nivel['B1']} cats={len(CATEGORIAS)}")
    print("unicos", len(vistos))


if __name__ == "__main__":
    main()
