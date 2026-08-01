# Bonesai — Rules

> **Status as of 2026-08-01.** The two-player rules are complete; no open questions remain.
> The game was invented on the evening of 31 July 2026, and many rounds were played that same
> evening (§14). Deferred items — §12.
> “Bonesai” is a working title; the commercial name has not yet been cleared through TMview.
>
> This is a translation. The Russian text in [RULES.md](RULES.md) is the primary version; if the
> two ever disagree, the Russian one is correct.

## 1. Terminology

| Term | Meaning |
|---|---|
| **First player** | Whoever moves first in the current round. The role is reassigned every round (§2.5). |
| **Second player** | The first player’s opponent in the current round. |
| **Double** | A tile with matching halves (0-0, 1-1, … 6-6). There are 7 in the set. |
| **Root** | The double the round starts from. The first tile on the table. |
| **Boneyard** | The face-down stock of tiles that were not dealt. |
| **End** | An open number at the edge of the layout that a tile may be joined to. |
| **Branch** | A chain of tiles running from a fork (or from the root) to one of the ends. |
| **Fork** | The point where a branch splits into two directions (§6.3). |
| **Straight end** | The end of a fork that keeps the number the tile was joined to. |
| **Fork end** | The end of a fork formed by the free half of the tile that was joined. |
| **Fresh end** | An end of a fork that no tile has been joined to yet (§6.4). |
| **Closed end** | An end sealed by a double played crosswise (§7.1). It cannot be developed. |
| **Dead end** | An end no tile can be joined to: all 7 tiles bearing that number are already on the table. |
| **Straight** | A way of playing a tile: it continues the branch without splitting it. |
| **As a fork** | A way of playing a tile: it splits the branch. |
| **Crosswise** | A way of playing a double: it closes the end. |
| **Block** | The state in which no player can play any tile (§9.1). Called *ryba*, “fish”, in the Russian original. |
| **Going out** | A player has played the last tile from their hand (§9.2). |
| **Round** | One deal, from the root until a block or a player going out. |
| **Match** | A series of rounds played to 100 points (§10.5). |

## 2. Components and setup

2.1. An ordinary standard domino set: 28 tiles, double-six. Nothing else is needed.

2.2. The game is for two. Whoever moves first in the current round is the **first player**, their
opponent is the **second player**. These are roles within a single round, not fixed identities: the
right to move first passes from round to round (§2.5), so the players usually swap roles next round.

2.3. All 28 tiles are shuffled again before every round. Each player draws **7 tiles**; **14** are
left in the boneyard.

2.4. The first player draws their 7 tiles **face up** straight away. The second player draws
**face down** and keeps their hand hidden until the turn first passes (§3).

2.5. **The right to move first.**
- In the first round of a match it is decided at random — a coin toss, lowest tile drawn, whatever.
- In every round after that, the **winner of the previous round** moves first (§10.4).
- If the previous round was a **draw**, there is no winner and the players simply **swap**: whoever
  moved second last round now moves first.

> The first player’s position is assumed to be slightly the weaker one: they reveal their hand
> before moving, knowing nothing about the opponent’s. That is why the first move goes to the
> winner. If the statistics say otherwise — that the first player wins more often — the rule will
> change to “the loser of the previous round moves first”.

## 3. Open hands — the defining feature

3.1. The game is played **with open hands**: both players’ tiles lie face up and are visible to
everyone.

3.2. **The one exception is the very first turn.** The first player is open from the moment the
tiles are drawn (§2.4), that is, **before** their first move. The second player keeps their tiles
hidden until the first player’s turn is over.

3.3. As soon as the first player’s turn ends — **however it ends**: they played the root, drew a
tile, passed — the second player reveals their hand.

3.4. From then until the end of the round both hands are open. The asymmetry in §3.2 applies **once
per round** and compensates for the right to move first.

3.5. **The boneyard is always face down.** This is deliberate: hands are open as in chess, and the
boneyard is left as the only source of chance in the game. Its contents can be worked out (28 minus
everything visible), but the order of the tiles is unknown.

## 4. The core rule: you must play if you can

4.1. The player to move **must play if they are able to**. This holds for the whole round — during
the search for the root and after it.

4.2. Passing when a legal play exists is not allowed. Drawing from the boneyard when a legal play
exists is not allowed either.

4.3. Consequences:
- holding a double while no root has been played → the player must play the root (§5.2);
- drawing a double during the search for the root → they must play it (§5.3);
- drawing a tile that fits → they must play it (§8.2);
- the only legal play is a bad one → the player must make it anyway. The trap in §11.1 is built on
  exactly this.

## 5. Starting a round: finding the root

5.1. A round always starts with a double — **any** double. It becomes the root.

5.2. The player to move must play a double as the root if they hold one (§4.1). If they hold
several, they choose which one becomes the root.

5.3. If they hold no double, they draw one tile from the boneyard (§8).
- Drew a double → they must play it as the root.
- Drew anything else → they keep it and pass the turn.

5.4. The §5.2–5.3 cycle repeats until somebody plays the root.

5.5. This cannot deadlock: the set contains 7 doubles, so once the boneyard is empty every double is
guaranteed to be in the players’ hands.

## 6. Play after the root

6.1. The player must play a tile matching one of the open ends (§4.1).

6.2. **The root develops in one direction only.** The left side of the root is not in play, and
branches do not grow above or below it either. In effect the root offers **one** open end.

```
not in play ←── [4|4] ──→ open end "4"
```

6.3. An ordinary (non-double) tile is played either **straight** or **as a fork**.

**Straight** — the tile continues the branch in the same direction. The half that is joined seals
the old end, the free half becomes the new one. The number of open ends does not change:

```
before:  … ── [3|5] ──→ end "5"
after:   … ── [3|5] ── [5|4] ──→ end "4"
```

**As a fork** — the tile is joined to the free end of the branch but turned through 90°. This
creates a **fork**: two free directions bearing **different** numbers:

- the **straight end** — the number the tile was joined to (“5” in the example); it stays live and
  the branch keeps its direction;
- the **fork end** — the free half of the tile that was joined (“4” in the example); this branch
  runs at 90° to the straight direction.

```
before:  … ── [3|5] ──→ end "5"

after:   … ── [3|5] ──→ straight end "5"
                   │
                  [5]
                  [4]
                   ↓
              fork end "4"
```

*A fork does not consume the old end, it **adds** a new one: the number of open ends grows by 1.*

**Placing a forking tile on the table.** Physically it can be butted up in two ways: with the joined
half running along the straight branch, or set off to the side straight away. This makes no
difference to the rules — either way you get the same two ends, straight and fork. Choose whichever
suits the space on your table and keeps the branches clear of one another.

![The forking tile 6:1 set flush with the row](docs/img/turn-inline.jpg)

*Option 1: the 6:1 tile is set flush with the row — its “6” half runs along the straight branch.*

![The same 6:1 tile set off to the side and shifted down](docs/img/turn-sideways.jpg)

*Option 2: the same 6:1 tile shifted down and set off to the side. The play and the resulting ends are identical — only the table layout differs.*

Both photographs also show a **closed end** at the top: the vertical branch runs into the double 1:1
laid crosswise across it (§7.1).

6.4. **The fresh-end restriction.** The first tile joined to either end of a fork — the straight one
or the fork one — must be played **straight**. It may neither create another fork nor close the end
with a double played crosswise.

In other words: **a fork immediately after a fork is forbidden**, and **an end that has just been
created cannot be closed either**.

The restriction applies to each end separately and lifts as soon as one tile has been joined to that
end. After that, both forking and closing are available there again.

*Example.* A fork with ends “5” (straight) and “4” (fork). You may not play 4:1 as a fork, you may
not play 5:6 as a fork, and you may close neither “5” nor “4” with a double. You may play, say, 5:6
straight — after which the end grown from “5” is open to any play again, while the “4” end is still
fresh.

6.5. Forking is available on **any** turn except the case in §6.4.

6.6. **The one exception is the first tile after the root.** It may be played as a fork even though
the root’s end is “fresh” too. This is a right, not an obligation.

## 7. The double and closing a branch

7.1. The double is a special tile. It can be played in **two ways only**:

- **straight** — the double lies **along** the branch like an ordinary tile; the end stays open and
  keeps the **same** number:

```
… ── [3|5] ── [5|5] ──→ end "5"
```

- **crosswise** — the double is set **across the direction of the branch**; the branch is **closed**
  and can no longer be developed:

```
                ┌───┐
                │ 5 │
… ── [3|5] ─────┤   │   ✕ branch closed
                │ 5 │
                └───┘
```

For a real example of a closed branch, see the photographs in §6.3: the vertical branch at the top
runs into the double 1:1 laid crosswise across it.

7.2. **A double cannot be played as a fork.** You cannot create a fork with a double.

7.3. An end can only be closed by the **matching** double — the one whose number equals the number
of the end.

7.4. A fresh end cannot be closed (§6.4). A double played as the first tile on such an end can only
be laid **straight**.

## 8. Drawing from the boneyard

8.1. On their turn a player draws **at most one tile** from the boneyard — both while the root is
being sought and in the main phase.

8.2. A player only draws when they have no legal play (§4.1). Then:
- the drawn tile gives them a play → they must play it, and the turn ends;
- the drawn tile does not help → they keep it, play nothing and pass the turn.

8.3. If the boneyard is empty and there is no legal play, the player does nothing and passes.

## 9. Ending a round

A round ends for one of two reasons.

9.1. **Block** — nobody can play a tile: every open end is either closed (§7.1) or dead (no tile
that fits is left in either hand or in the boneyard, because all 7 tiles bearing that number are
already on the table). One particular case of this is every single end being closed.

9.2. **Going out** — a player has played the last tile from their hand and holds nothing.

9.3. On a block, no tiles are drawn from the boneyard — the points are counted straight away (§10).

## 10. Scoring and winning the match

10.1. When the round ends, each player counts the **pip total of the tiles left in their hand** —
the sum of the numbers on both halves of every tile. A player who went out (§9.2) has a total of
zero.

10.2. **The double 0:0 is priced specially.** If 0:0 is the player’s **only** remaining tile, it
counts as **25 points**. If they hold at least one other tile, 0:0 counts as **0**, as usual.

10.3. **Only the player whose total is strictly lower scores nothing.** Everyone else adds their own
total to their running score. With two players this means:

- the totals differ → the higher one adds their total to their own score, the lower one gets
  nothing;
- the totals are **equal** → **both** add theirs.

10.4. **The winner of the round** is the player with the strictly lower total, that is, the one who
scored nothing. If the totals are equal, the round has no winner. The winner moves first in the next
round (§2.5).

10.5. **End of the match.** As soon as at least one player reaches **100 points or more** after a
count, the match ends. **The player with the higher running score loses.** If the running scores are
equal (103 and 103, say), the match is a **draw** and has no winner.

## 11. Rule variants

11.1. **“The double only closes.”** A double may not be played straight — it can only close a branch
(crosswise). It follows automatically that a double cannot be the first tile on a fresh end: closing
is not allowed there (§6.4), and in this variant a double has no other option.

**This is the original version of the rules** — it is how the game was first conceived. Playing a
double straight was introduced the same evening, during the first rounds (§14).

The variant creates a **trap**: the double stops being a safe tile, and an opponent can be forced to
end the round at the worst possible moment. Example: the root is 2:2 and the second player plays 2:1
straight. If the first player holds nothing but 1:1, they must play (§4.1), and their only way to
play it is crosswise — which closes the sole end and cuts the round short, however many points they
are still holding.

The variant in §7.1 is currently treated as the main one: a double can both extend and close. It is
gentler and offers more decisions, but it removes the trap — so both are worth trying.

## 12. Deferred

12.1. **A mode for 3+ players.** To be revisited once the two-player game has been implemented.
(28 tiles: three players with 7 each → a boneyard of 7; four players with 7 each → no boneyard.)

## 13. Notes on balance

*Not rules, but consequences of the mechanics — recorded so they need not be worked out again.*

13.1. **The balance of ends.** Straight → the number of ends is unchanged; a fork → +1; closing with
a crosswise double → −1. A round starts with a single end (§6.2).

13.2. **The game can be blocked very quickly.** The shortest possible round: root → one tile
straight → a crosswise double. Three tiles on the table and both players holding almost a full hand.
That is exactly the fast win for whoever has the lower total.

13.3. **The defence against a fast close is the fork.** It is always available: any suitable
non-double tile can be played as a fork, and §6.4 stops the opponent from closing a fresh end right
away. So a player with a heavy hand stretches the round out with forks, while a player with a light
one strangles it with closures. The length of the round is fought over directly, and that is the
central conflict of the game. Over the first live rounds the mechanic feels balanced; wider testing
will settle it.

13.4. **A ceiling on forks.** To bring the number of ends down to 0, there must be one more closure
than there were forks. There are 7 doubles and one went to the root → at most 6 closures → at most 5
forks per round. Once **6 or more forks have been made, blocking the game by closing every end
becomes impossible** — the round can then only end by someone going out or by the ends dying. Every
double played straight lowers the ceiling by one more.

13.5. **A double played straight burns the key for good.** There is no second copy of it, so from
then on no end bearing that number can ever be closed — it can only be starved out.

13.6. **Two roads to zero.** Going out (§9.2) guarantees a total of 0, which is certain to be
strictly lower, so it never costs a single point. That gives a player two distinct plans: block the
game while holding the lighter hand, or empty the hand entirely. Forking serves the second plan,
closing serves the first.

13.7. **Why 0:0 is worth 25 (§10.2).** Without that rule 0:0 would be the perfect tile to sit on: it
could be held to the end for free, and a player holding nothing but 0:0 would have a total of 0 — so
they would not pay even against an opponent who went out (0 against 0 is a tie, and both pay
nothing). The rule turns this on its head: a last remaining 0:0 becomes the most expensive tile in
the set.

13.8. **A tie punishes both players.** On equal totals both pay (§10.3), so the only safe place is a
strictly lower total. Together with the fact that the loser adds their **whole** total rather than
the difference, this makes the endgame sharp: 41 against 40 means a single point costs 41.

13.9. **A short match is fine.** The average tile in the set is worth 6 points, so a full hand of 7
comes to about 42. A fast block (§13.2) leaves almost all of that in hand, meaning one such round
hands the loser 40–50 points at once and a match to 100 is over in 2–3 rounds. This is accepted as
it stands: the length of a match is not a constant but the result of the fight. The player in the
worse position has every reason to fork and stretch the round out to shed more tiles, and how well
they manage it is exactly what decides whether the match is short or long.

13.10. **The right to move first: amplifier or catch-up?** The first move goes to the winner (§2.5).
If the first player’s position really is the weaker one, this works as a catch-up mechanic and keeps
the match close. If moving first turns out to be an advantage instead, the rule will do the
opposite and widen the leader’s gap. That is what the statistics have to show.

13.11. **Open hands plus compulsory play means perfect information.** A player’s decisions come down
to which of the fitting tiles to play and how to orient it. The only chance left is in the face-down
boneyard (§3.5).

## 14. How the game came about

I made this game for my beloved wife Olechka on the evening of 31 July 2026.

What bothered me about ordinary dominoes was how much rides on chance: far too often the outcome is
settled not by the player’s choice but by which tile happened to turn up. Yet I did not want to take
chance out altogether — without it the thrill goes. Hence the defining feature of these rules: the
hands lie open like pieces in chess, and the only source of chance left is the face-down boneyard
(§3.5).

I sketched the idea out quickly and we sat down to play at once. We played all evening. My first
version was stricter: a double could only be laid crosswise, so it always closed a branch (§11.1).
Olechka suggested allowing it to be played straight as well — that gave the player a choice, and the
rule became the main one (§7.1).

We enjoyed the game, and that is why I wrote the rules down.
