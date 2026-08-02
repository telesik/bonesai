# Bonesai — regras do jogo

> **Status em 2026-08-01.** As regras do jogo a dois estão descritas por completo; não restam
> questões em aberto. O jogo foi inventado na noite de 31 de julho de 2026, e naquela mesma noite
> foram disputados muitos jogos a dois (§14). O que ficou adiado está no §12.
> “Bonesai” é um nome provisório: no TMview há marcas próximas “Bonsai” na classe de jogos,
> por isso o nome comercial ainda não foi escolhido.
>
> Esta é uma tradução. O texto russo de [RULES.ru.md](RULES.ru.md) é a versão primária;
> em caso de divergência, prevalece o russo.
>
> Versão publicada 1.0 com identificador permanente:
> [10.5281/zenodo.21745035](https://doi.org/10.5281/zenodo.21745035). Cite essa versão.
> O texto do repositório pode estar mais adiantado — nesse caso, ele entrará na próxima versão
> do registro.

## 1. Terminologia

| Termo | Significado |
|---|---|
| **Primeiro jogador** | Quem joga primeiro no jogo em curso. O papel é definido de novo a cada jogo (§2.5). |
| **Segundo jogador** | O adversário do primeiro jogador no jogo em curso. |
| **Dupla** | Peça com as duas metades iguais (0-0, 1-1, … 6-6). São 7 ao todo. |
| **Raiz** | A dupla com que o jogo começa. A primeira peça na mesa. |
| **Dorme** | A reserva fechada das peças que não foram distribuídas às mãos. |
| **Ponta** | Número aberto na borda da figura montada, ao qual a peça seguinte pode ser encaixada. |
| **Ramo** | Cadeia de peças que vai de uma bifurcação (ou da raiz) até uma das pontas. |
| **Bifurcação** | Ponto onde um ramo se divide em duas direções (§6.3). |
| **Ponta reta** | Ponta da bifurcação que conserva o número ao qual a peça foi encaixada. |
| **Ponta da curva** | Ponta da bifurcação formada pela metade livre da peça encaixada. |
| **Ponta fresca** | Ponta da bifurcação à qual ainda não foi encaixada nenhuma peça (§6.4). |
| **Ponta fechada** | Ponta à qual foi encaixada uma dupla “atravessada” (§7.1). Não pode mais ser desenvolvida. |
| **Ponta morta** | Ponta à qual nenhuma peça pode ser encaixada: as 7 peças com esse número já estão na mesa. |
| **Reto** | Modo de colocar uma peça: continuação sem ramificar. |
| **Em curva** | Modo de colocar uma peça: formando uma bifurcação. |
| **Atravessado** | Modo de colocar uma dupla que fecha a ponta. |
| **Tranca** | Estado em que ninguém consegue colocar uma peça (§9.1). |
| **Batida** | Um jogador colocou a última peça da mão (§9.2). |
| **Jogo** (rodada) | Uma distribuição, da raiz até a tranca ou a batida. |
| **Partida** | Série de jogos até 100 pontos (§10.5). |

## 2. Componentes e preparação

2.1. Um dominó comum, padrão: 28 peças, até a dupla seis. Nenhum componente adicional.

2.2. Os jogadores são dois. Quem joga primeiro no jogo em curso chama-se **primeiro jogador**; seu
adversário, **segundo**. São papéis dentro de um jogo, não nomes permanentes: o direito de jogar
primeiro passa de jogo em jogo (§2.5), então no jogo seguinte os jogadores costumam trocar de
papéis.

2.3. Antes de cada jogo, todas as 28 peças são embaralhadas de novo. Cada jogador pega **7 peças**;
no dorme ficam **14**.

2.4. O primeiro jogador pega suas 7 peças de imediato **abertas**, com a face para cima. O segundo
pega as suas **fechadas** e mantém a mão fechada até o fim da primeira vez do primeiro
jogador (§3).

2.5. **O direito de jogar primeiro.**
- No primeiro jogo da partida, decide-se por sorteio — uma moeda, a peça de menor soma, tanto faz.
- Em cada jogo seguinte, joga primeiro **o vencedor do anterior** (§10.4).
- Se o jogo anterior terminou **empatado**, não há vencedor e os jogadores simplesmente **trocam**:
  joga primeiro quem no jogo passado jogou em segundo.

> Presume-se que a posição do primeiro jogador seja um pouco mais fraca: ele se abre antes da
> primeira jogada, sem saber nada da mão do adversário. Por isso a saída é dada ao vencedor.
> Se a estatística dos jogos mostrar o contrário — que o primeiro jogador vence com mais
> frequência —, a regra mudará para “joga primeiro quem perdeu o jogo anterior”.

## 3. Mãos abertas — a característica-chave

3.1. O jogo corre **com as mãos abertas**: as peças dos jogadores ficam com a face para cima,
à vista de todos.

3.2. **A exceção é a primeiríssima jogada.** O primeiro jogador está aberto desde o momento em que
pega as peças (§2.4), ou seja, **antes** da sua primeira jogada. O segundo mantém as peças fechadas
até o fim da vez do primeiro.

3.3. Assim que a vez do primeiro jogador termina — **de qualquer maneira**: colocou a raiz, comprou
uma peça, passou a vez —, o segundo abre suas peças.

3.4. Daí em diante, até o fim do jogo, as duas mãos ficam abertas. A assimetria do §3.2 age
**uma vez por jogo** e serve de compensação pelo direito de jogar primeiro.

3.5. **O dorme fica sempre fechado**, com a face para baixo. É de propósito: as mãos estão abertas,
como no xadrez, e o dorme permanece a única fonte de acaso no jogo. Sua composição pode ser
calculada (28 menos tudo o que está visível), mas a ordem das peças é desconhecida.

## 4. A regra principal: a jogada é obrigatória

4.1. O jogador da vez **é obrigado a jogar se puder**. A regra vale o jogo inteiro — tanto na fase
de busca da raiz quanto depois dela.

4.2. Não se pode passar a vez tendo jogada possível. Também não se pode comprar uma peça do dorme
tendo jogada possível.

4.3. Consequências:
- há uma dupla na mão e a raiz ainda não foi colocada → o jogador é obrigado a colocar a raiz
  (§5.2);
- comprou uma dupla na fase de busca da raiz → é obrigado a colocá-la (§5.3);
- comprou uma peça que encaixa → é obrigado a jogá-la (§8.2);
- a única jogada disponível é desvantajosa → o jogador é obrigado a fazê-la mesmo assim. É sobre
  isso que se constrói a armadilha do §11.1.

## 5. Início do jogo: a busca da raiz

5.1. O jogo sempre começa com uma dupla — **qualquer uma**. Ela se torna a raiz.

5.2. O jogador da vez é obrigado a colocar uma dupla como raiz se tiver dupla na mão (§4.1).
Se tiver várias, ele mesmo escolhe qual delas será a raiz.

5.3. Se não tem dupla, o jogador compra uma peça do dorme (§8).
- Comprou uma dupla → é obrigado a colocá-la como raiz.
- Comprou uma peça que não é dupla → fica com ela e passa a vez.

5.4. O ciclo §5.2–5.3 vai se repetindo, de um jogador ao outro, até que alguém coloque a raiz.

5.5. Aqui não pode haver beco sem saída: o conjunto tem 7 duplas e, se o dorme se esvaziar,
é garantido que todas as duplas estarão nas mãos dos jogadores.

## 6. A jogada depois de colocada a raiz

6.1. O jogador é obrigado a colocar uma peça cujo número coincida com uma das pontas abertas
(§4.1).

6.2. **A raiz se desenvolve numa única direção.** A ponta esquerda da raiz é um beco sem saída —
desenvolver por ali não é permitido. Para cima e para baixo da raiz os ramos também não crescem.
Na prática, a raiz dá **uma única** ponta aberta.

```
beco ←── [4|4] ──→ ponta aberta “4”
```

6.3. Uma peça comum (não dupla) é colocada **reta** ou **em curva**.

**Reta** — a peça continua o ramo na mesma direção. A metade encaixada fecha a ponta velha;
a livre torna-se a nova. O número de pontas abertas não muda:

```
antes:   … ── [3|5] ──→ ponta “5”
depois:  … ── [3|5] ── [5|4] ──→ ponta “4”
```

**Em curva** — a peça é encaixada na ponta livre do ramo, mas girada 90°. Forma-se uma
**bifurcação** — duas direções livres com números **diferentes**:

- a **ponta reta** — o número ao qual a peça foi encaixada (“5” no exemplo); ele continua vivo,
  e a direção do ramo é a mesma;
- a **ponta da curva** — a metade livre da peça encaixada (“4” no exemplo); esse ramo segue
  a 90° da direção reta.

```
antes:    … ── [3|5] ──→ ponta “5”

depois:   … ── [3|5] ──→ ponta reta “5”
                    │
                   [5]
                   [4]
                    ↓
            ponta da curva “4”
```

*A curva não consome a ponta velha — ela **acrescenta** uma nova: o número de pontas abertas
cresce em 1.*

**Como pôr a peça girada na mesa.** Fisicamente ela pode ser encaixada de duas maneiras: de modo
que a metade encaixada siga a direção do ramo reto, ou já desviada para o lado. Isso não afeta as
regras — nos dois casos resultam as mesmas duas pontas, a reta e a da curva. Escolha conforme o
espaço na mesa, para que os ramos não atrapalhem uns aos outros.

![A peça girada 6:1 encaixada rente à fileira](img/turn-inline.jpg)

*Modo 1: a peça 6:1 encaixada rente à fileira — sua metade “6” segue a direção do ramo reto.*

![A mesma peça 6:1 encaixada de lado, deslocada para baixo](img/turn-sideways.jpg)

*Modo 2: a mesma peça 6:1 deslocada para baixo e encaixada já de lado. A jogada é a mesma e as pontas são as mesmas — só muda a disposição na mesa.*

Nas duas fotos vê-se, no alto, também uma **ponta fechada**: o ramo vertical esbarra na dupla 1:1
colocada atravessada no seu caminho (§7.1).

6.4. **A restrição da ponta fresca.** A primeira peça encaixada em qualquer ponta de uma
bifurcação — tanto na reta quanto na da curva — é colocada **somente “reta”**. Ela não pode nem
fazer uma nova curva, nem fechar a ponta com uma dupla atravessada.

Em outras palavras: **curva logo depois de curva é proibida**, e **também é proibido fechar uma
ponta recém-formada**.

A restrição vale separadamente para cada ponta e é levantada assim que pelo menos uma peça for
encaixada nessa ponta. Depois disso, nela voltam a estar disponíveis tanto a curva quanto o
fechamento.

*Exemplo.* Uma bifurcação com pontas “5” (reta) e “4” (da curva). Não se pode colocar a 4:1 em
curva, não se pode colocar a 5:6 em curva, e não se pode fechar nem o “5” nem o “4” com uma dupla.
Pode-se colocar, por exemplo, a 5:6 reta — depois disso, a ponta que cresceu do “5” volta a
aceitar qualquer jogada, enquanto a ponta “4” continua fresca.

6.5. A curva está disponível em **qualquer** jogada, exceto no caso do §6.4.

6.6. **A única exceção é a primeira jogada a partir da raiz.** A primeira peça depois da raiz pode
ser colocada em curva, embora a ponta da raiz também seja “fresca”. É um direito, não uma
obrigação.

## 7. A dupla e o fechamento do ramo

7.1. A dupla é uma peça especial. Ela só pode ser colocada de **duas** maneiras:

- **reta** — a dupla fica **ao longo** do ramo, como uma peça comum; a ponta continua aberta e
  conserva **o mesmo** número:

```
… ── [3|5] ── [5|5] ──→ ponta “5”
```

- **atravessada** — a dupla é posta **atravessada em relação à direção do ramo**; o ramo
  **se fecha** e não pode mais ser desenvolvido:

```
                ┌───┐
                │ 5 │
… ── [3|5] ─────┤   │   ✕ ramo fechado
                │ 5 │
                └───┘
```

Um exemplo vivo de fechamento está nas fotografias do §6.3: o ramo vertical, no alto, esbarra na
dupla 1:1 colocada atravessada no seu caminho.

7.2. **A dupla não pode ser colocada “em curva”.** Com uma dupla não se faz bifurcação.

7.3. Uma ponta só pode ser fechada com a dupla **correspondente** — aquela cujo número coincide
com o número da ponta.

7.4. Uma ponta fresca não pode ser fechada (§6.4). A dupla colocada numa ponta dessas como
primeira peça só pode ficar **reta**.

## 8. A compra do dorme

8.1. Na sua vez, o jogador compra do dorme **no máximo uma peça** — tanto na fase de busca da raiz
quanto na fase principal.

8.2. O jogador compra somente se não tem com que jogar (§4.1). Em seguida:
- a peça comprada serve → o jogador é obrigado a jogá-la, e a vez termina;
- a peça comprada não ajudou → o jogador fica com ela, não coloca nada e passa a vez.

8.3. Se o dorme está vazio e não há com que jogar, o jogador não faz nada e passa a vez.

## 9. Fim do jogo

O jogo termina por uma de duas razões.

9.1. **Tranca** — ninguém consegue colocar uma peça: cada ponta aberta está ou fechada (§7.1) ou morta
(a peça necessária não está nem nas mãos nem no dorme — as 7 peças com esse número já estão na
mesa). Caso particular: todas as pontas, sem exceção, estão fechadas.

9.2. **Batida** — um jogador colocou a última peça da mão. Não lhe resta nada nas mãos.

9.3. Na tranca não se compram peças do dorme — os pontos são contados imediatamente (§10).

## 10. Contagem de pontos e vitória na partida

10.1. Ao fim do jogo, cada jogador conta a **soma dos pontos das peças que lhe restaram** — a soma
de todos os números das metades. Para o jogador que bateu (§9.2), a soma é zero.

10.2. **O preço especial da dupla 0:0.** Se a 0:0 ficou como **única** peça na mão do jogador, ela
conta como **25 pontos**. Se na mão há pelo menos uma outra peça, a 0:0 vale **0**, como de
costume.

10.3. **Somente quem tem a soma estritamente menor não marca pontos.** Os demais acrescentam a
própria soma ao placar geral. No jogo a dois, isso significa:
- somas diferentes → quem tem a maior acrescenta a sua soma ao próprio placar; quem tem a menor
  não recebe nada;
- somas **iguais** → acrescentam **os dois**.

10.4. **O vencedor do jogo** é o jogador com a soma estritamente menor, isto é, aquele que não
marcou pontos. Com somas iguais, o jogo não tem vencedor. O vencedor joga primeiro no jogo
seguinte (§2.5).

10.5. **Fim da partida.** Assim que, depois de uma contagem, pelo menos um jogador chega a
**100 pontos ou mais**, a partida termina. **Perde quem tem o placar geral maior.** Se os placares
gerais são iguais (por exemplo, 103 e 103), há **empate** e a partida não tem vencedor.

## 11. Variantes das regras

11.1. **“A dupla só fecha”.** A dupla não pode ser colocada reta — ela só pode fechar o ramo
(atravessada). Daí segue automaticamente que a dupla não pode ser a primeira peça numa ponta
fresca: ali não se pode fechar (§6.4), e nessa variante a dupla não tem outras opções.

**Esta é a variante original das regras** — foi assim que o jogo foi concebido no início.
A colocação da dupla reta surgiu naquela mesma noite, ao longo dos primeiros jogos (§14).

A variante cria uma **armadilha**: a dupla deixa de ser uma peça segura, e é possível forçar o
adversário a fechar o jogo no momento menos oportuno para ele. Exemplo: raiz 2:2, o segundo
jogador coloca a 2:1 reta. Se o primeiro só tem a 1:1 na mão, ele é obrigado a jogar (§4.1), e só
pode colocá-la atravessada — ou seja, fecha a única ponta e encerra o jogo ali mesmo, por mais
pontos que tenha na mão.

Atualmente a variante principal é a do §7.1: a dupla pode tanto prolongar quanto fechar. Ela é
mais suave e dá mais decisões, mas elimina a armadilha desta variante — por isso vale a pena
experimentar as duas.

## 12. Adiado

12.1. **Modo para 3+ jogadores.** Retomar depois que o jogo a dois estiver implementado.
(28 peças: três com 7 → dorme de 7; quatro com 7 → dorme de 0.)

## 13. Notas sobre o equilíbrio

*Não são regras, mas consequências da mecânica — para não deduzi-las de novo a cada vez.*

13.1. **O balanço das pontas.** Reta → o número de pontas não muda; curva → +1; fechamento com
dupla atravessada → −1. O jogo começa com uma única ponta (§6.2).

13.2. **Trancar pode ser muito rápido.** O jogo mínimo: raiz → uma peça reta → dupla atravessada.
Três peças na mesa, e ambos com a mão quase cheia. Essa é justamente a vitória rápida para quem
tem a soma menor.

13.3. **A defesa contra o fechamento rápido é a curva.** Ela está sempre disponível: qualquer peça
não dupla que encaixe pode ser colocada em curva, e o §6.4 impede o adversário de fechar a ponta
fresca de imediato. Por isso o jogador de mão pesada estica o jogo com curvas, e o de mão leve o
sufoca com fechamentos. A duração do jogo é objeto de disputa direta — e esse é o conflito central
do jogo. Nos primeiros jogos de verdade, a mecânica parece equilibrada; a confirmação definitiva
virá de testes mais amplos.

13.4. **O teto das curvas.** Para que as pontas cheguem a 0, é preciso um fechamento a mais do que
o número de curvas. São 7 duplas, uma foi para a raiz → fechamentos, no máximo 6 → não mais que
5 curvas por jogo. Se foram feitas **6 curvas ou mais, trancar fechando todas as pontas já é
impossível** — o jogo só pode terminar por batida ou por pontas mortas. Cada dupla colocada “reta”
rebaixa o teto em mais um.

13.5. **A dupla “reta” queima a chave sem volta.** Não existe uma segunda dupla igual, então
depois disso nenhuma ponta com esse número poderá mais ser fechada — só deixá-la morrer por
esgotamento.

13.6. **Dois caminhos até o zero.** A batida (§9.2) garante soma 0, ou seja, com certeza
estritamente menor — nunca renderá pontos. Logo, o jogador tem dois planos distintos: trancar
quando a mão está mais leve, ou descarregar tudo. A curva trabalha para o segundo plano;
o fechamento, para o primeiro.

13.7. **Por que a 0:0 vale 25 (§10.2).** Sem essa regra, a 0:0 seria a peça perfeita “para
depois”: poderia ser guardada até o fim de graça, e um jogador só com a 0:0 teria soma 0 — isto é,
não pagaria nem contra um adversário que bateu (0 contra 0 é empate: ambos pagam zero). A regra
inverte isso: a última 0:0 torna-se a peça mais cara do conjunto.

13.8. **O empate castiga os dois.** Com somas iguais, pagam ambos (§10.3), então só a soma
estritamente menor é segura. Somado ao fato de que o perdedor acrescenta a soma **inteira**, e não
a diferença, isso torna o desfecho brusco: 41 contra 40 — a diferença de um único ponto custa
41 pontos.

13.9. **Partida curta é normal.** A peça média do conjunto vale 6 pontos; uma mão cheia de
7 peças, cerca de 42. Uma tranca rápida (§13.2) deixa na mão quase tudo, ou seja, um único jogo
assim dá ao perdedor de uma vez 40–50 pontos, e a partida até 100 acaba em 2–3 jogos. Isso foi
aceito assim mesmo: a duração da partida não é uma constante, e sim o resultado da disputa.
O jogador em pior posição tem todo o interesse em ramificar e esticar o jogo para descartar mais
peças — e é justamente do quanto ele consegue fazer isso que depende a partida ser curta ou longa.

13.10. **O direito de jogar primeiro — amplificador ou mecânica de recuperação.** A saída é dada ao
vencedor (§2.5). Se a posição do primeiro jogador é de fato mais fraca, isso funciona como
mecânica de recuperação e equilibra a partida. Se, ao contrário, jogar primeiro se revelar uma
vantagem, a regra só vai aumentar a disparada do líder. É isso que a estatística deve mostrar.

13.11. **Mãos abertas + jogada obrigatória = jogo de informação completa.** As decisões do jogador
se reduzem à escolha de uma peça entre as que encaixam e da sua orientação. O acaso fica somente
no dorme fechado (§3.5).

## 14. Como o jogo nasceu

Inventei este jogo para minha querida esposa Olechka na noite de 31 de julho de 2026.

Não me agradava o quanto o dominó comum depende do acaso: com frequência demais, tudo é decidido
não pela escolha do jogador, mas pela peça que veio. Mas eu também não queria eliminar o acaso
por completo — sem ele, a emoção se perde. Daí a característica principal das regras: as mãos ficam
abertas, como as peças no xadrez, e a única fonte de acaso que resta é o dorme fechado (§3.5).

Esbocei a ideia depressa, e sentamos para jogar em seguida. Jogamos a noite inteira. Minha
primeira variante era mais rígida: a dupla só podia ser colocada atravessada, ou seja, sempre
fechava o ramo (§11.1). Olechka propôs permitir também a reta — assim o jogador ganhou uma
escolha, e essa regra passou a ser a principal (§7.1).

Gostamos do jogo, e foi por isso que registrei as regras por escrito.
