[English](README.en.md) · [Русский](README.ru.md) · **Español** · [Deutsch](README.de.md) · [Português (BR)](README.pt-BR.md) · [Українська](README.uk.md) · [中文](README.zh.md)

# Bonesai

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.21745035.svg)](https://doi.org/10.5281/zenodo.21745035)

El juego está en la base de datos de BoardGameGeek: [Bonesai (2026)](https://boardgamegeek.com/boardgame/476432/bonesai).

Jugar en el navegador: <https://telesik.github.io/bonesai/> — a dos en una pantalla o contra el bot.

Un juego de mesa con un **dominó estándar corriente** (28 fichas, doble seis) — pero con reglas
completamente distintas. No es el dominó clásico: la cadena por mitades coincidentes, el clásico
juego de bloqueo y el recuento por los restos aquí no funcionan.

El nombre viene de *bones* (así se llaman las fichas de dominó en inglés) y *bonsai*: un árbol
que se cultiva y se poda a la vez. Esa es justamente la esencia del juego.

## De qué va el juego

El juego comienza con un doble — la **raíz**. De ella crece un árbol: una ficha corriente colocada
a 90° crea una **bifurcación** y añade un nuevo extremo abierto, mientras que un doble colocado
atravesado **cierra** la rama para siempre.

De ahí el conflicto central. El juego termina cuando nadie puede colocar ficha, y los puntos se
los lleva quien se quedó con más en la mano. Por eso el jugador con la mano ligera estrangula el
juego con cierres, y el de la mano pesada ramifica y gana tiempo para llegar a soltar sus fichas.
La duración del juego se convierte en objeto de lucha directa.

La segunda particularidad: **se juega con las manos abiertas**. Las fichas están boca arriba,
a la vista de ambos, como en el ajedrez. La única fuente de azar es el pozo cerrado.

## Documentos

- **[RULES.es.md](RULES.es.md)** — el reglamento completo del juego a dos. No quedan cuestiones
  abiertas; las reglas están formalizadas hasta el punto de poder implementarse. Incluye la
  terminología, los esquemas y la sección «Notas sobre el equilibrio» con las consecuencias
  de la mecánica.
- **[RULES.ru.md](RULES.ru.md)** — las mismas reglas en ruso. **El texto ruso es la versión
  primaria**; en caso de discrepancia, prevalece el ruso.

## Autores

Los autores son **Alexey Kiselyov** y **Olga Popova**.

Inventé este juego para mi querida esposa Olechka la noche del 31 de julio de 2026. No me gustaba
cuánto depende del azar el dominó corriente, pero tampoco quería eliminar el azar por completo —
de ahí las manos abiertas y el pozo cerrado como su única fuente.

Esbocé la idea deprisa, y nos sentamos a jugar enseguida. Esa misma noche Olechka propuso permitir
la colocación del doble recto — así el jugador ganó una elección, y esa regla pasó a ser la
principal. En la primera variante el doble siempre cerraba la rama.

Cómo fue todo — [RULES.es.md §14](RULES.es.md).

## Estado

Las reglas del juego a dos están terminadas. El juego fue inventado la noche del 31 de julio
de 2026, y esa misma noche se jugaron muchos juegos a dos — nos gustó, y por eso las reglas
quedaron escritas. Por ahora es una sola noche y dos jugadores: para sacar conclusiones sobre
el equilibrio hacen falta más juegos y más gente.

El prototipo digital está listo — se puede jugar en el navegador: a dos en una pantalla o contra
el bot. Lo siguiente — ampliar el grupo de prueba más allá de dos personas. El modo para 3+
jugadores queda aplazado adrede hasta que el juego a dos esté implementado.

El nombre es provisional: se ha comprobado en BoardGameGeek, GitHub y TMview. No hay
coincidencias exactas, pero marcas cercanas «Bonsai» en la clase de juegos suponen un riesgo
para el registro de la marca, así que el nombre comercial aún no está fijado.

## Contacto

Preguntas sobre las reglas, sugerencias y ganas de jugar — Alexey en
[LinkedIn](https://www.linkedin.com/in/alexey-kiselyov-80809416/).

## Apoyar a los autores

El juego es gratuito y lo seguirá siendo. Si le regaló una buena velada,
puede dar las gracias a los autores: [Ko-fi](https://ko-fi.com/telesik) o
[GitHub Sponsors](https://github.com/sponsors/telesik).

## Licencia

El texto de las reglas y la documentación — [CC BY 4.0](LICENSE.es). Úselos y adáptelos
libremente, con atribución.
