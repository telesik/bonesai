#!/usr/bin/env python3
"""Собирает PDF правил Bonesai из docs/RULES.ru.md и docs/RULES.en.md.

Использование:
    python3 tools/build-pdf.py          — собрать обе версии
    python3 tools/build-pdf.py ru       — только русскую
    python3 tools/build-pdf.py en       — только английскую

Результат: build/bonesai-rules.pdf и build/bonesai-rules-en.pdf

Требуется установленный Google Chrome (используется headless-печать).
Markdown конвертируется встроенным конвертером — внешних зависимостей нет.
"""

import html
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"  # исходники правил и картинки лежат в docs/
OUT_DIR = ROOT / "build"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

TITLE = "Bonesai"
LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/"

# --- Метаданные публикации по языкам -----------------------------------------

ABSTRACT_RU = """
**Bonesai** — настольная игра для двоих на обычном наборе домино (28 костей, дубль-шесть).
Дополнительных компонентов не требуется.

Правила не имеют отношения к классическому домино. Партия начинается с дубля — **корня**, от
которого растёт дерево. Обычная кость, поставленная под 90°, создаёт **развилку** и добавляет
новый открытый конец. Дубль, поставленный поперёк, **закрывает** ветку навсегда.

Партия заканчивается, когда поставить кость не может никто («рыба») или когда игрок выложил
последнюю кость. Очки получает тот, у кого на руках осталось больше, а проигрывает в матче тот,
кто первым наберёт 100. Отсюда основной конфликт игры: игрок с лёгкой рукой стремится оборвать
партию закрытиями, игрок с тяжёлой — растянуть её развилками, чтобы успеть сбросить кости.
Длина партии становится предметом прямой борьбы.

Вторая особенность — **открытые руки**: кости обоих игроков лежат лицом вверх, как фигуры
в шахматах. Единственный источник случайности — закрытый базар.
"""

ABSTRACT_EN = """
**Bonesai** is a two-player board game played with an ordinary domino set (28 tiles, double-six).
Nothing else is needed.

The rules have nothing to do with conventional dominoes. A round begins with a double — the
**root** — from which a tree grows. An ordinary tile played at 90° creates a **fork** and adds a
new open end. A double played crosswise **closes** a branch for good.

A round ends when nobody can play a tile (a “block”) or when a player plays their last tile.
Points go to whoever is left holding more, and the first player to reach 100 loses the match.
Hence the central conflict: a player with a light hand tries to cut the round short with closures,
while a player with a heavy one stretches it out with forks in order to shed tiles. The length of
the round is fought over directly.

The second distinctive feature is **open hands**: both players’ tiles lie face up, like pieces in
chess. The only source of chance is the face-down boneyard.
"""

APPENDIX_RU = """
## Приложение. Место в семействе домино-игр

Bonesai принадлежит к семейству ветвящихся домино-игр — Pagat относит их к категории *tree games*.
Ниже перечислены известные прецеденты для каждой механики и отличия Bonesai от них. Ни одна из
перечисленных игр не совпадает с Bonesai целиком: оригинальна не отдельная механика, а их сочетание.

| Механика | Прецедент | Отличие Bonesai |
|---|---|---|
| Ветвление, «деревья» | Chicken Foot, Cross Dominoes, Sebastopol, Double Nine Cross, Mexican Train с ветвлением | Там ветку создаёт **дубль** (spinner). Здесь наоборот: развилку делает **обычная кость** под 90°, а дубль ветку **закрывает** |
| Закрытие ветки дублем | Русская «закрывашка»: выставивший дубль вправе перевернуть его лицом вниз, с этой стороны ставить нельзя | Здесь это не привилегия, а штатный способ постановки (поперёк), плюс ограничение свежего конца |
| Открытые руки | Contack (Parker Brothers, 1939) — треугольные фишки, руки лицом вверх | На стандартном наборе домино аналог не найден. Асимметрия раскрытия на первом ходе (первый игрок открыт до хода, второй после) не встречается |
| Счёт до порога, проигрывает набравший | Русский «Козёл» — до 101 | Здесь до 100; очки получает тот, у кого сумма **больше**, а не победитель получает сумму соперника; при равных суммах платят оба |
| Дорогой дубль 0:0 | Chicken Foot — кость 0-0 всегда стоит 50 очков | Здесь 25 и только когда она осталась **единственной** костью на руке |

Своим в Bonesai выглядит следующее сочетание: развилку создаёт обычная кость, а дубль её закрывает
(в известных tree-играх ветвящим элементом служит как раз дубль); свежий конец защищён от
немедленного закрытия и повторного поворота; и вытекающая отсюда борьба за длину партии между
поворотом и закрытием.

### Источники

- Pagat, Domino Tree Games — https://www.pagat.com/domino/tree/
- Pagat, Chicken Foot — https://www.pagat.com/domino/tree/chickenfoot.html
- Contack (Parker Brothers, 1939) — https://en.wikipedia.org/wiki/Contack
- Правила домино, вариант «закрывашка» — https://minigames.mail.ru/info/article/domino_pravila
"""

APPENDIX_EN = """
## Appendix. Where Bonesai sits among domino games

Bonesai belongs to the family of branching domino games that Pagat classifies as *tree games*.
Listed below are the known precedents for each mechanic and how Bonesai differs from them. None of
these games matches Bonesai as a whole: what is original is not any single mechanic but the
combination.

| Mechanic | Precedent | How Bonesai differs |
|---|---|---|
| Branching, “trees” | Chicken Foot, Cross Dominoes, Sebastopol, Double Nine Cross, Mexican Train with branching | There it is the **double** (the spinner) that creates a branch. Here it is the other way round: an **ordinary tile** at 90° makes the fork, and the double **closes** the branch |
| Closing a branch with a double | The Russian *zakryvashka*: whoever plays a double may turn it face down, after which nothing may be played on that side | Here this is not a privilege but a standard way of placing the tile (crosswise), plus the fresh-end restriction |
| Open hands | Contack (Parker Brothers, 1939) — triangular tiles, hands held face up | No equivalent found using a standard domino set. The asymmetry on the first turn (first player open before the move, second player after) does not appear anywhere |
| Playing to a threshold, whoever reaches it loses | The Russian *Kozyol* — played to 101 | Here it is 100; points go to the player with the **higher** total rather than the winner collecting the opponent’s; on equal totals both pay |
| An expensive 0:0 | Chicken Foot — the 0-0 tile is always worth 50 points | Here it is 25, and only when it is the **last remaining** tile in hand |

What looks original in Bonesai is this combination: an ordinary tile makes the fork while the double
closes it (in the known tree games the branching element is the double); a fresh end is protected
from being closed or forked again immediately; and the resulting fight over the length of the round,
fork against closure.

### Sources

- Pagat, Domino Tree Games — https://www.pagat.com/domino/tree/
- Pagat, Chicken Foot — https://www.pagat.com/domino/tree/chickenfoot.html
- Contack (Parker Brothers, 1939) — https://en.wikipedia.org/wiki/Contack
- Russian domino rules, the *zakryvashka* variant — https://minigames.mail.ru/info/article/domino_pravila
"""

LANGS = {
    "ru": {
        "src": "docs/RULES.ru.md",
        "out": "bonesai-rules.pdf",
        "html_lang": "ru",
        "subtitle": "Настольная игра на обычном наборе домино",
        "tagline": "Правила игры вдвоём",
        "authors": "Алексей Киселёв · Ольга Попова",
        "authors_alt": "Alexey Kiselyov · Olga Popova",
        "date": "1 августа 2026",
        "version": "Версия 1.0",
        "license_line": "Лицензия",
        "heading": "Bonesai — правила игры вдвоём",
        "abstract_heading": "Аннотация",
        "abstract": ABSTRACT_RU,
        "appendix": APPENDIX_RU,
        "license_note": "Документ опубликован под лицензией Creative Commons Attribution 4.0 "
                        "International. Лицензия распространяется на текст и схемы; игровые "
                        "механики как система объектом авторского права не являются.",
    },
    "en": {
        "src": "docs/RULES.en.md",
        "out": "bonesai-rules-en.pdf",
        "html_lang": "en",
        "subtitle": "A board game played with an ordinary domino set",
        "tagline": "Two-player rules",
        "authors": "Alexey Kiselyov · Olga Popova",
        "authors_alt": "Алексей Киселёв · Ольга Попова",
        "date": "1 August 2026",
        "version": "Version 1.0",
        "license_line": "Licence",
        "heading": "Bonesai — Two-player rules",
        "abstract_heading": "Abstract",
        "abstract": ABSTRACT_EN,
        "appendix": APPENDIX_EN,
        "license_note": "Published under the Creative Commons Attribution 4.0 International "
                        "licence. The licence covers the text and the diagrams; the game "
                        "mechanics as a system are not subject to copyright.",
    },
}

# --- Минимальный конвертер Markdown -----------------------------------------


def inline(text):
    """Инлайновая разметка. HTML экранируется, код защищается от дальнейшей обработки."""
    placeholders = []

    def stash(match):
        placeholders.append(html.escape(match.group(1)))
        return f"\x00{len(placeholders) - 1}\x00"

    text = re.sub(r"`([^`]+)`", stash, text)
    text = html.escape(text)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<em>\1</em>", text)
    text = re.sub(r"\x00(\d+)\x00", lambda m: f"<code>{placeholders[int(m.group(1))]}</code>", text)
    return text


def is_block_start(line):
    return (
        line.startswith("```")
        or line.startswith("|")
        or line.startswith(">")
        or line.startswith("![")
        or re.match(r"^#{1,6} ", line)
        or re.match(r"^[-*] ", line)
        or re.match(r"^\d+\.\s", line)
        or not line.strip()
    )


def md_to_html(md):
    lines = md.split("\n")
    out, i = [], 0

    while i < len(lines):
        line = lines[i]

        if not line.strip():
            i += 1
            continue

        # Блок кода
        if line.startswith("```"):
            i += 1
            block = []
            while i < len(lines) and not lines[i].startswith("```"):
                block.append(lines[i])
                i += 1
            i += 1
            out.append(f"<pre><code>{html.escape(chr(10).join(block))}</code></pre>")
            continue

        # Таблица
        if line.startswith("|") and i + 1 < len(lines) and re.match(r"^\|[\s:|-]+\|\s*$", lines[i + 1]):
            def cells(row):
                return [c.strip() for c in row.strip().strip("|").split("|")]

            header = cells(line)
            i += 2
            body = []
            while i < len(lines) and lines[i].startswith("|"):
                body.append(cells(lines[i]))
                i += 1
            th = "".join(f"<th>{inline(c)}</th>" for c in header)
            trs = "".join(
                "<tr>" + "".join(f"<td>{inline(c)}</td>" for c in row) + "</tr>" for row in body
            )
            out.append(f"<table><thead><tr>{th}</tr></thead><tbody>{trs}</tbody></table>")
            continue

        # Цитата
        if line.startswith(">"):
            block = []
            while i < len(lines) and lines[i].startswith(">"):
                block.append(lines[i].lstrip(">").strip())
                i += 1
            paras = "".join(f"<p>{inline(p.strip())}</p>" for p in " ".join(block).split("  ") if p.strip())
            out.append(f"<blockquote>{paras or inline(' '.join(block))}</blockquote>")
            continue

        # Изображение; следующая непустая строка целиком курсивом становится подписью
        img = re.match(r"^!\[([^\]]*)\]\(([^)]+)\)\s*$", line)
        if img:
            alt, src = img.group(1), img.group(2)
            if not src.startswith(("http://", "https://", "file://")):
                # Пути картинок в маркдауне — относительно docs/
                src = (DOCS / src).as_uri()
            i += 1
            caption = ""
            j = i
            while j < len(lines) and not lines[j].strip():
                j += 1
            if j < len(lines):
                cap = re.match(r"^\*([^*].*)\*$", lines[j].strip())
                if cap:
                    caption = f"<figcaption>{inline(cap.group(1))}</figcaption>"
                    i = j + 1
            out.append(f'<figure><img src="{src}" alt="{html.escape(alt)}">{caption}</figure>')
            continue

        # Заголовок
        heading = re.match(r"^(#{1,6}) (.+)$", line)
        if heading:
            level = len(heading.group(1))
            out.append(f"<h{level}>{inline(heading.group(2))}</h{level}>")
            i += 1
            continue

        # Списки
        list_match = re.match(r"^([-*]) (.+)$", line) or re.match(r"^(\d+)\.\s+(.+)$", line)
        if list_match:
            ordered = line[0].isdigit()
            items = []
            while i < len(lines):
                m = re.match(r"^[-*] (.+)$", lines[i]) if not ordered else re.match(r"^\d+\.\s+(.+)$", lines[i])
                if not m:
                    break
                item = [m.group(1)]
                i += 1
                while i < len(lines) and lines[i].startswith("  ") and lines[i].strip():
                    item.append(lines[i].strip())
                    i += 1
                items.append(" ".join(item))
            tag = "ol" if ordered else "ul"
            lis = "".join(f"<li>{inline(x)}</li>" for x in items)
            out.append(f"<{tag}>{lis}</{tag}>")
            continue

        # Абзац
        para = [line]
        i += 1
        while i < len(lines) and not is_block_start(lines[i]):
            para.append(lines[i])
            i += 1
        out.append(f"<p>{inline(' '.join(para))}</p>")

    return "\n".join(out)


# --- Сборка страницы ---------------------------------------------------------

CSS = """
@page { size: A4; margin: 20mm 18mm; }
* { box-sizing: border-box; }
body {
  font: 10.5pt/1.55 Georgia, "Times New Roman", serif;
  color: #1a1a1a; margin: 0; hyphens: auto;
}
h1, h2, h3, h4 {
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  line-height: 1.25; break-after: avoid; margin: 1.6em 0 0.5em;
}
h1 { font-size: 19pt; margin-top: 0; }
h2 { font-size: 14pt; border-bottom: 1px solid #d8d8d8; padding-bottom: 0.25em; }
h3 { font-size: 11.5pt; }
p, ul, ol, table, pre, blockquote, figure { break-inside: avoid-page; }
/* Соседние figure встают в ряд — так два снимка сравниваются рядом, а не через страницу */
figure { display: inline-block; width: 49%; vertical-align: top; margin: 0 0 1.1em;
         text-align: center; }
figure img { width: 100%; border: 1px solid #ddd; border-radius: 4px; }
figcaption { font-size: 8pt; line-height: 1.45; color: #5a5a5a; font-style: italic;
             margin: 0.45em 0 0; text-align: left; }
p { margin: 0 0 0.75em; text-align: justify; }
ul, ol { margin: 0 0 0.9em; padding-left: 1.4em; }
li { margin-bottom: 0.3em; }
code { font-family: Menlo, Monaco, monospace; font-size: 0.85em; background: #f2f2f2;
       padding: 0.1em 0.3em; border-radius: 3px; }
pre {
  font-family: Menlo, Monaco, monospace; font-size: 8.5pt; line-height: 1.4;
  background: #f7f7f5; border: 1px solid #e2e2de; border-radius: 4px;
  padding: 0.8em 1em; overflow: visible; white-space: pre; margin: 0 0 1em;
}
pre code { background: none; padding: 0; font-size: inherit; }
blockquote {
  margin: 0 0 1em; padding: 0.6em 1em; background: #f7f7f5;
  border-left: 3px solid #b8b8b0; font-size: 0.95em;
}
blockquote p { margin: 0 0 0.4em; }
blockquote p:last-child { margin-bottom: 0; }
table { border-collapse: collapse; width: 100%; margin: 0 0 1.1em; font-size: 9pt; }
th, td { border: 1px solid #d8d8d8; padding: 0.45em 0.6em; text-align: left; vertical-align: top; }
th { background: #f2f2f0; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
     font-size: 8.5pt; }
a { color: #1a1a1a; text-decoration: none; border-bottom: 1px solid #c4c4c4; }

.title-page { height: 247mm; display: flex; flex-direction: column; justify-content: center;
              text-align: center; break-after: page; }
.title-page .name {
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 46pt; font-weight: 300; letter-spacing: 0.06em; margin: 0 0 0.35em;
}
.title-page .rule { width: 60px; height: 2px; background: #1a1a1a; margin: 0 auto 1.6em; }
.title-page .sub { font-size: 13pt; margin: 0 0 0.3em; }
.title-page .tag { font-size: 11pt; color: #5a5a5a; font-style: italic; margin: 0 0 3.5em; }
.title-page .author { font-size: 12.5pt; margin: 0 0 0.2em; }
.title-page .author-alt { font-size: 9.5pt; color: #6a6a6a; margin: 0 0 2.8em; }
.title-page .meta { font-size: 9pt; color: #6a6a6a; line-height: 1.9; }
.abstract { margin-bottom: 2.5em; }
.abstract h2 { border: none; font-size: 12pt; }
.abstract p { font-size: 10pt; }
.doi-note { font-size: 8.5pt; color: #8a8a8a; margin-top: 1.2em; }
.appendix { break-before: page; }
.appendix h2 { margin-top: 0; }
"""


def build(lang):
    cfg = LANGS[lang]
    src = (ROOT / cfg["src"]).read_text(encoding="utf-8")
    # Первый заголовок убираем — его заменяет титульный лист. Врезку со статусом оставляем.
    body = re.sub(r"\A# .*?\n", "", src, count=1).lstrip("\n")

    page = f"""<!doctype html>
<html lang="{cfg['html_lang']}"><head><meta charset="utf-8">
<title>{TITLE} — {cfg['tagline']}</title><style>{CSS}</style></head><body>

<section class="title-page">
  <div class="name">{TITLE}</div>
  <div class="rule"></div>
  <div class="sub">{cfg['subtitle']}</div>
  <div class="tag">{cfg['tagline']}</div>
  <div class="author">{cfg['authors']}</div>
  <div class="author-alt">{cfg['authors_alt']}</div>
  <div class="meta">
    {cfg['date']}<br>{cfg['version']}<br>
    {cfg['license_line']} <a href="{LICENSE_URL}">CC BY 4.0</a>
  </div>
</section>

<section class="abstract">
<h1>{cfg['heading']}</h1>
<h2>{cfg['abstract_heading']}</h2>
{md_to_html(cfg['abstract'].strip())}
<p class="doi-note">{cfg['license_note']}</p>
</section>

{md_to_html(body)}

<section class="appendix">
{md_to_html(cfg['appendix'].strip())}
</section>

</body></html>"""

    OUT_DIR.mkdir(exist_ok=True)
    html_path = OUT_DIR / cfg["out"].replace(".pdf", ".html")
    pdf_path = OUT_DIR / cfg["out"]
    html_path.write_text(page, encoding="utf-8")

    if not Path(CHROME).exists():
        sys.exit(f"Не найден Chrome: {CHROME}")

    subprocess.run(
        [CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer",
         "--virtual-time-budget=4000",
         f"--print-to-pdf={pdf_path}", html_path.as_uri()],
        check=True, capture_output=True,
    )
    print(f"[{lang}] {pdf_path.relative_to(ROOT)} ({pdf_path.stat().st_size // 1024} КБ)")


if __name__ == "__main__":
    requested = sys.argv[1:] or list(LANGS)
    unknown = [x for x in requested if x not in LANGS]
    if unknown:
        sys.exit(f"Неизвестный язык: {', '.join(unknown)}. Доступны: {', '.join(LANGS)}")
    for lang in requested:
        build(lang)
