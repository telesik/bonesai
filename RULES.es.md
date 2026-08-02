# Bonesai — reglas del juego

> **Estado a 2026-08-01.** Las reglas del juego a dos están descritas por completo; no quedan
> cuestiones abiertas. El juego fue inventado la noche del 31 de julio de 2026, y esa misma noche
> se jugaron muchos juegos a dos (§14). Lo aplazado — §12.
> «Bonesai» es un nombre provisional; el nombre comercial aún no está confirmado con una búsqueda
> en TMview.
>
> Esto es una traducción. El texto ruso de [RULES.ru.md](RULES.ru.md) es la versión primaria;
> en caso de discrepancia, prevalece el ruso.
>
> Versión publicada 1.0 con identificador permanente:
> [10.5281/zenodo.21745035](https://doi.org/10.5281/zenodo.21745035). Cítese esa versión.
> El texto del repositorio puede ir por delante — esos cambios entrarán en la siguiente versión
> del registro.

## 1. Terminología

| Término | Significado |
|---|---|
| **Primer jugador** | El que sale primero en el juego en curso. El rol se determina de nuevo en cada juego (§2.5). |
| **Segundo jugador** | El rival del primer jugador en el juego en curso. |
| **Doble** | Ficha con las dos mitades iguales (0-0, 1-1, … 6-6). Hay 7 en total. |
| **Raíz** | El doble con el que comienza el juego. La primera ficha sobre la mesa. |
| **Pozo** | La reserva boca abajo de las fichas no repartidas. |
| **Extremo** | Número abierto en el borde de la figura al que puede unirse la siguiente ficha. |
| **Rama** | Cadena de fichas desde una bifurcación (o desde la raíz) hasta uno de los extremos. |
| **Bifurcación** | Punto donde una rama se divide en dos direcciones (§6.3). |
| **Extremo recto** | Extremo de la bifurcación que conserva el número al que se unió la ficha. |
| **Extremo de giro** | Extremo de la bifurcación formado por la mitad libre de la ficha unida. |
| **Extremo fresco** | Extremo de la bifurcación al que aún no se ha unido ninguna ficha (§6.4). |
| **Extremo cerrado** | Extremo al que se ha unido un doble «atravesado» (§7.1). No se puede desarrollar. |
| **Extremo muerto** | Extremo al que no puede unirse ficha alguna: las 7 fichas con ese número ya están en la mesa. |
| **Recto** | Modo de colocar una ficha: continuación sin ramificar. |
| **En giro** | Modo de colocar una ficha: formando una bifurcación. |
| **Atravesado** | Modo de colocar un doble que cierra el extremo. |
| **Tranca** | Estado en el que nadie puede colocar ficha (§9.1). |
| **Dominó** | Un jugador ha colocado la última ficha de su mano (§9.2). |
| **Juego** (ronda) | Un reparto, desde la raíz hasta la tranca o el dominó. |
| **Encuentro** | Serie de juegos hasta 100 puntos (§10.5). |

## 2. Componentes y preparación

2.1. Un dominó estándar corriente: 28 fichas, doble seis. Ningún componente adicional.

2.2. Los jugadores son dos. El que sale primero en el juego en curso se llama **primer jugador**;
su rival, **segundo**. Son roles dentro de un juego, no nombres permanentes: el derecho a salir
primero pasa de juego en juego (§2.5), así que en el siguiente juego los jugadores suelen
intercambiar los roles.

2.3. Antes de cada juego las 28 fichas se barajan de nuevo. Cada jugador toma **7 fichas**;
en el pozo quedan **14**.

2.4. El primer jugador toma sus 7 fichas de inmediato **boca arriba**. El segundo las toma
**boca abajo** y mantiene la mano oculta hasta el primer traspaso del turno (§3).

2.5. **El derecho a salir primero.**
- En el primer juego del encuentro se decide por sorteo — una moneda, la ficha de menor suma,
  da igual.
- En cada juego siguiente sale primero **el ganador del anterior** (§10.4).
- Si el juego anterior terminó **en empate**, no hay ganador y los jugadores simplemente
  **se intercambian**: sale primero quien en el juego pasado salió segundo.

> Se supone que la posición del primer jugador es algo más débil: se descubre antes de su primera
> jugada sin saber nada de la mano del rival. Por eso la salida se concede al ganador. Si la
> estadística de los juegos muestra lo contrario — que el primer jugador gana más a menudo —,
> la regla cambiará a «sale primero el perdedor del juego anterior».

## 3. Manos abiertas — el rasgo clave

3.1. Se juega **con las manos abiertas**: las fichas de los jugadores están boca arriba, a la vista
de todos.

3.2. **La excepción es la primerísima jugada.** El primer jugador está descubierto desde que toma
sus fichas (§2.4), es decir, **antes** de su primera jugada. El segundo mantiene sus fichas ocultas
hasta el final del turno del primero.

3.3. En cuanto el turno del primer jugador concluye — **de cualquier manera**: colocó la raíz,
robó una ficha, cedió el turno —, el segundo descubre sus fichas.

3.4. A partir de ahí y hasta el final del juego, ambas manos están abiertas. La asimetría del §3.2
actúa **una vez por juego** y sirve de compensación por el derecho a salir primero.

3.5. **El pozo está siempre cerrado**, boca abajo. Es deliberado: las manos están abiertas, como
en el ajedrez, y el pozo queda como única fuente de azar. Su composición puede calcularse (28 menos
todo lo visible), pero el orden de las fichas se desconoce.

## 4. La regla principal: la jugada es obligatoria

4.1. El jugador en turno **está obligado a jugar si puede**. La regla rige durante todo el juego —
tanto en la fase de búsqueda de la raíz como después de ella.

4.2. No se puede pasar teniendo jugada posible. Tampoco se puede robar una ficha del pozo teniendo
jugada posible.

4.3. Consecuencias:
- hay un doble en la mano y la raíz aún no está colocada → el jugador está obligado a colocar
  la raíz (§5.2);
- robó un doble en la fase de búsqueda de la raíz → está obligado a colocarlo (§5.3);
- robó una ficha que encaja → está obligado a jugarla (§8.2);
- la única jugada disponible es desfavorable → el jugador debe hacerla de todos modos. Sobre esto
  se construye la trampa del §11.1.

## 5. Comienzo del juego: la búsqueda de la raíz

5.1. El juego siempre comienza con un doble — **cualquiera**. Ese doble se convierte en la raíz.

5.2. El jugador en turno está obligado a colocar un doble como raíz si lo tiene en la mano (§4.1).
Si tiene varios, él mismo elige cuál de ellos será la raíz.

5.3. Si no tiene doble, roba una ficha del pozo (§8).
- Robó un doble → está obligado a colocarlo como raíz.
- Robó otra ficha → se la queda y cede el turno.

5.4. El ciclo §5.2–5.3 se repite por turnos hasta que alguien coloque la raíz.

5.5. Aquí no puede haber punto muerto: el conjunto contiene 7 dobles, y si el pozo se vacía,
todos los dobles están garantizadamente en las manos de los jugadores.

## 6. La jugada tras colocar la raíz

6.1. El jugador está obligado a colocar una ficha cuyo número coincida con uno de los extremos
abiertos (§4.1).

6.2. **La raíz se desarrolla en una sola dirección.** El extremo izquierdo de la raíz es un callejón
sin salida: por ahí no se puede desarrollar. Hacia arriba y hacia abajo de la raíz tampoco crecen
ramas. En la práctica, la raíz da **un solo** extremo abierto.

```
sin salida ←── [4|4] ──→ extremo abierto «4»
```

6.3. Una ficha corriente (no doble) se coloca **recto** o **en giro**.

**Recto** — la ficha continúa la rama en la misma dirección. La mitad unida cierra el extremo
viejo; la libre se convierte en el nuevo. El número de extremos abiertos no cambia:

```
antes:    … ── [3|5] ──→ extremo «5»
después:  … ── [3|5] ── [5|4] ──→ extremo «4»
```

**En giro** — la ficha se une al extremo libre de la rama, pero girada 90°. Se forma una
**bifurcación** — dos direcciones libres con números **distintos**:

- el **extremo recto** — el número al que se unió la ficha («5» en el ejemplo); sigue vivo
  y la rama conserva su dirección;
- el **extremo de giro** — la mitad libre de la ficha unida («4» en el ejemplo); esta rama corre
  a 90° de la dirección recta.

```
antes:    … ── [3|5] ──→ extremo «5»

después:  … ── [3|5] ──→ extremo recto «5»
                    │
                   [5]
                   [4]
                    ↓
            extremo de giro «4»
```

*El giro no consume el extremo viejo, sino que **añade** uno nuevo: el número de extremos abiertos
crece en 1.*

**Cómo poner la ficha girada sobre la mesa.** Físicamente puede acoplarse de dos maneras: de modo
que la mitad unida siga la dirección de la rama recta, o desviada hacia el lado desde el principio.
Esto no afecta a las reglas — en ambos casos resultan los mismos dos extremos, el recto y el de
giro. Elija según el espacio en la mesa, para que las ramas no se estorben entre sí.

![La ficha girada 6:1 acoplada a ras de la fila](docs/img/turn-inline.jpg)

*Modo 1: la ficha 6:1 acoplada a ras de la fila — su mitad «6» sigue la dirección de la rama recta.*

![La misma ficha 6:1 acoplada de lado, desplazada hacia abajo](docs/img/turn-sideways.jpg)

*Modo 2: la misma ficha 6:1 desplazada hacia abajo y acoplada directamente de lado. La jugada es la misma y los extremos son los mismos — solo cambia la disposición sobre la mesa.*

En ambas fotos se ve arriba también un **extremo cerrado**: la rama vertical topa con el doble 1:1
colocado atravesado sobre ella (§7.1).

6.4. **La restricción del extremo fresco.** La primera ficha unida a cualquiera de los extremos de
una bifurcación — tanto al recto como al de giro — se coloca **solo «recto»**. No puede ni hacer
un nuevo giro ni cerrar el extremo con un doble atravesado.

Dicho de otro modo: **un giro inmediatamente después de otro giro está prohibido**, y **cerrar
un extremo recién formado tampoco se puede**.

La restricción rige por separado para cada extremo y se levanta en cuanto a ese extremo se une
al menos una ficha. Después vuelven a estar disponibles en él tanto el giro como el cierre.

*Ejemplo.* Una bifurcación con extremos «5» (recto) y «4» (de giro). No se puede colocar el 4:1
en giro, no se puede colocar el 5:6 en giro, y no se puede cerrar ni el «5» ni el «4» con un doble.
Se puede colocar, por ejemplo, el 5:6 recto — tras lo cual el extremo crecido del «5» vuelve a
estar abierto a cualquier jugada, mientras que el extremo «4» sigue fresco.

6.5. El giro está disponible en **cualquier** jugada, salvo el caso del §6.4.

6.6. **La única excepción es la primera jugada desde la raíz.** La primera ficha tras la raíz puede
colocarse en giro, aunque el extremo de la raíz también sea «fresco». Es un derecho, no una
obligación.

## 7. El doble y el cierre de la rama

7.1. El doble es una ficha especial. Solo puede colocarse de **dos maneras**:

- **recto** — el doble queda **a lo largo** de la rama, como una ficha corriente; el extremo sigue
  abierto y conserva **el mismo** número:

```
… ── [3|5] ── [5|5] ──→ extremo «5»
```

- **atravesado** — el doble se coloca **atravesado respecto a la dirección de la rama**; la rama
  **se cierra** y ya no puede desarrollarse:

```
                ┌───┐
                │ 5 │
… ── [3|5] ─────┤   │   ✕ rama cerrada
                │ 5 │
                └───┘
```

Un ejemplo vivo de cierre está en las fotografías del §6.3: la rama vertical de arriba topa con
el doble 1:1 colocado atravesado sobre ella.

7.2. **El doble no puede colocarse «en giro».** Con un doble no se hace una bifurcación.

7.3. Un extremo solo puede cerrarse con el doble **correspondiente** — aquel cuyo número coincide
con el número del extremo.

7.4. Un extremo fresco no puede cerrarse (§6.4). El doble colocado en tal extremo como primera
ficha solo puede ir **recto**.

## 8. Robar del pozo

8.1. En su turno el jugador roba del pozo **como máximo una ficha** — tanto en la fase de búsqueda
de la raíz como en la fase principal.

8.2. El jugador roba solo si no tiene con qué jugar (§4.1). Después:
- la ficha robada da jugada → el jugador está obligado a jugarla, y el turno termina;
- la ficha robada no ayuda → el jugador se la queda, no coloca nada y cede el turno.

8.3. Si el pozo está vacío y no hay con qué jugar, el jugador no hace nada y cede el turno.

## 9. Final del juego

El juego termina por una de dos causas.

9.1. **Tranca** — nadie puede colocar ficha: cada extremo abierto está o cerrado (§7.1) o muerto
(la ficha necesaria no está ni en las manos ni en el pozo — las 7 fichas con ese número ya están
en la mesa). Caso particular: todos los extremos, sin excepción, están cerrados.

9.2. **Dominó** — un jugador ha colocado la última ficha de su mano. No le queda nada en la mano.

9.3. Con la tranca no se roban fichas del pozo — se cuentan los puntos de inmediato (§10).

## 10. Recuento de puntos y victoria en el encuentro

10.1. Al terminar el juego, cada jugador cuenta la **suma de puntos de las fichas que le quedan** —
la suma de todos los números de las mitades. Para el jugador que hizo dominó (§9.2) la suma es cero.

10.2. **El precio especial del doble 0:0.** Si el 0:0 queda como **única** ficha en la mano del
jugador, se cuenta como **25 puntos**. Si en la mano hay al menos otra ficha, el 0:0 vale **0**,
como de costumbre.

10.3. **Solo quien tiene la suma estrictamente menor no anota puntos.** Los demás añaden su suma
a su marcador total. En el juego a dos esto significa:
- sumas distintas → el de la mayor añade su suma a su marcador; el de la menor no recibe nada;
- sumas **iguales** → añaden **ambos**.

10.4. **El ganador del juego** es el jugador con la suma estrictamente menor, es decir, el que no
anotó puntos. Con sumas iguales el juego no tiene ganador. El ganador sale primero en el siguiente
juego (§2.5).

10.5. **Final del encuentro.** En cuanto tras un recuento al menos un jugador llega a **100 puntos
o más**, el encuentro termina. **Pierde quien tiene el marcador total mayor.** Si los marcadores
totales son iguales (por ejemplo, 103 y 103), hay **empate** y el encuentro no tiene ganador.

## 11. Variantes de las reglas

11.1. **«El doble solo cierra».** El doble no puede colocarse recto — solo puede cerrar la rama
(atravesado). De ahí se sigue automáticamente que el doble no puede ser la primera ficha en un
extremo fresco: allí no se puede cerrar (§6.4), y en esta variante el doble no tiene otras opciones.

**Esta es la variante original de las reglas** — así fue concebido el juego al principio.
La colocación del doble recto apareció esa misma noche, durante los primeros juegos (§14).

La variante da una **trampa**: el doble deja de ser una ficha segura y se puede obligar al rival
a cerrar el juego en el momento menos oportuno para él. Ejemplo: raíz 2:2, el segundo jugador
coloca el 2:1 recto. Si el primero solo tiene el 1:1 en la mano, está obligado a jugar (§4.1),
y solo puede colocarlo atravesado — es decir, cierra el único extremo y corta el juego, por muchos
puntos que tenga en la mano.

Actualmente se considera principal la variante del §7.1: el doble puede tanto prolongar como
cerrar. Es más suave y da más decisiones, pero elimina la trampa de esta variante — por eso vale
la pena probar ambas.

## 12. Aplazado

12.1. **Modo para 3+ jugadores.** Retomarlo cuando el juego a dos esté implementado.
(28 fichas: tres con 7 → pozo de 7; cuatro con 7 → pozo de 0.)

## 13. Notas sobre el equilibrio

*No son reglas, sino consecuencias de la mecánica — para no deducirlas de nuevo cada vez.*

13.1. **El balance de extremos.** Recto → el número de extremos no cambia; giro → +1; cierre con
doble atravesado → −1. El juego arranca con un solo extremo (§6.2).

13.2. **Trancar se puede muy rápido.** El juego mínimo: raíz → una ficha recto → doble atravesado.
Tres fichas en la mesa y ambos con la mano casi completa. Esa es precisamente la victoria rápida
para quien tiene la suma menor.

13.3. **La defensa contra el cierre rápido es el giro.** Siempre está disponible: cualquier ficha
no doble que encaje puede colocarse en giro, y el §6.4 impide al rival cerrar el extremo fresco
de inmediato. Por eso el jugador con la mano pesada estira el juego con giros, y el de la mano
ligera lo estrangula con cierres. La duración del juego es objeto de lucha directa, y ese es el
conflicto central del juego. En los primeros juegos en vivo la mecánica se siente equilibrada;
lo confirmará definitivamente una prueba más amplia.

13.4. **El techo de los giros.** Para que los extremos lleguen a 0 hacen falta un cierre más que
giros. Hay 7 dobles y uno se fue a la raíz → cierres, como máximo 6 → no más de 5 giros por juego.
Si se han hecho **6 giros o más, trancar cerrando todos los extremos ya es imposible** — el juego
solo puede terminar por dominó o por extremos muertos. Cada doble colocado «recto» rebaja el techo
en uno más.

13.5. **El doble «recto» quema la llave sin remedio.** No hay un segundo doble igual, así que
después de eso ningún extremo con ese número podrá cerrarse ya — solo dejarlo morir por
agotamiento.

13.6. **Dos caminos hacia el cero.** El dominó (§9.2) garantiza una suma de 0, es decir,
estrictamente menor con seguridad — nunca dará puntos. Así que el jugador tiene dos planes
distintos: trancar cuando su mano es más ligera, o soltarlo todo. El giro trabaja para el segundo
plan; el cierre, para el primero.

13.7. **Por qué el 0:0 vale 25 (§10.2).** Sin esta regla el 0:0 sería la ficha perfecta «para
el final»: podría guardarse hasta el final gratis, y un jugador con solo el 0:0 tendría suma 0 —
es decir, no pagaría ni siquiera contra un rival que hizo dominó (0 contra 0 es empate: ambos
pagan cero). La regla lo invierte: el último 0:0 se convierte en la ficha más cara del conjunto.

13.8. **El empate castiga a ambos.** Con sumas iguales pagan los dos (§10.3), así que solo la suma
estrictamente menor es segura. Junto con el hecho de que el perdedor añade **toda** su suma y no
la diferencia, esto hace el final afilado: 41 contra 40 — una diferencia de un punto cuesta
41 puntos.

13.9. **Un encuentro corto es normal.** La ficha media del conjunto vale 6 puntos; una mano
completa de 7 fichas, unos 42. Una tranca rápida (§13.2) deja en la mano casi todo, es decir,
un solo juego así da al perdedor de golpe 40–50 puntos, y el encuentro a 100 se acaba en 2–3
juegos. Se acepta tal cual: la duración del encuentro no es una constante, sino el resultado de
la lucha. El jugador en peor posición tiene todo el interés en ramificar y estirar el juego para
soltar más fichas, y de cuánto lo consiga depende, precisamente, que el encuentro sea corto o
largo.

13.10. **El derecho de salida — ¿amplificador o mecánica de alcance?** La salida se concede al
ganador (§2.5). Si la posición del primer jugador es realmente más débil, esto funciona como
mecánica de alcance y nivela el encuentro. Si, por el contrario, salir primero resulta ser una
ventaja, la regla acelerará la escapada del líder. Eso es lo que debe mostrar la estadística.

13.11. **Manos abiertas + jugada obligatoria = juego de información completa.** Las decisiones del
jugador se reducen a elegir una ficha entre las que encajan y su orientación. El azar queda solo
en el pozo cerrado (§3.5).

## 14. Cómo nació el juego

Inventé este juego para mi querida esposa Olechka la noche del 31 de julio de 2026.

No me gustaba cuánto depende del azar el dominó corriente: demasiado a menudo lo decide todo no la
elección del jugador, sino la ficha que le tocó. Pero tampoco quería eliminar el azar por completo —
sin él se pierde la emoción. De ahí el rasgo principal de las reglas: las manos están a la vista,
como las piezas en el ajedrez, y la única fuente de azar que queda es el pozo cerrado (§3.5).

Esbocé la idea deprisa, y nos sentamos a jugar enseguida. Jugamos toda la noche. Mi primera
variante era más estricta: el doble solo podía colocarse atravesado, es decir, siempre cerraba
la rama (§11.1). Olechka propuso permitir también el recto — así el jugador ganó una elección,
y esa regla pasó a ser la principal (§7.1).

El juego nos gustó, y por eso puse las reglas por escrito.
