# NERedliner: notes for Claude

Owner: Gerald Fraas, Nebraska State Legislature. Browser tool to open a bill or amendment PDF from the drafting system, edit it, and save a redlined PDF.

## What it does (all working and tested)
- Opens PDFs from the drafting system (Antenna House, Liberation Mono) with its own reader (`src/reader.js`, `src/extract.js`). No PDF library; the sandbox could not reach CDNs or npm.
- Detects bill vs. amendment. Amendments: 27 numbered lines on page 1, then 31 per page. Bills: page 1 is content-driven (see "Page 1 of a bill" below), then 31 per page. Last page takes the remainder.
- Line numbers, page breaks and `-n-` page numbers are rebuilt on every edit.
- Underline = new text, strike-through = deleted text, red = changed text, bold, paragraph styles (indented, flush, hanging).
- Saves a PDF with embedded Liberation Mono and fractional justification matching the originals.
- Every page: red "NERedliner" bottom left; small red "Redlined by <author> · <version/date>" line under it.
- No sample menu. The page opens on a "Start with a PDF" screen. "New bill" / "New amendment" start from cover templates.

## Change page (added 10/31/2026)
- Save PDF appends a last page, "CHANGES TO THE ORIGINAL", listing every edit as a drafter notation keyed to the ORIGINAL page and line (the PDF as it was opened), e.g. `Page 2, Lines 26-27, strike "sports complex" and insert "convention center."`
- Wording: replacement = `strike "x" and insert "y."`; pure insert = `after "x" insert "y."` (or `before` at the very start); pure delete = `strike "x."`. The closing period goes inside the quotes. Spans over 14 words read `strike beginning with "..." through "..."`. A span over a page break reads `Page 2, Line 31 through Page 3, Line 1`.
- Struck-through text counts as deleted, and new text that is already struck counts as nothing. Red, bold and underline are ignored; only the words matter.
- It carries the running header and the red NERedliner footer but no `-n-` page number. It continues onto "(continued)" pages if there are too many notations for one.
- A "Change page" checkbox next to Save PDF turns it off. Documents started from New bill / New amendment have no original, so they never get one (`model.tracked`).
- Code: the "change tracker" section of `app.html` (`wordsOf`, `matchWords`, `changeList`, `changePageItems`), wired into `buildPDF` and `renderPreview`.
- Not listed: splitting or merging paragraphs, and re-opening text that was struck.

## Page 1 of a bill (branch `page1-layout`)
- Page 1 is the cover plus the summary ("A BILL FOR AN ACT ..."), and it ends with "Be it enacted by the people of the State of Nebraska," when that line lands on page 1; Section 1 then starts page 2. The old code gave a bill a fixed number of lines on page 1 (6 for New bill, or whatever the opened file happened to hold), which pushed a longer summary onto page 2 and let Section 1 start on page 1 after a shorter one. Page and line numbers, and so the change page, were wrong in both cases.
- Now `layout()` fills page 1 up to what physically fits (last line starts at 738.1pt: 23 lines for a bill, 27 for an amendment, `pageOneCap`) and ends the page right after the enacting clause when `layout.enactBreak` is on (bills only). If the summary is long enough that the clause lands on page 2, as in LB650 (clause at page 2, line 7), there is no break and Section 1 follows on the same page.
- `pageLine()` (change page notations) reads the real pagination of the original, so a short page 1 is respected.
- Setup panel, for bills: "Most numbered lines on page 1" and a checkbox to turn the enacting-clause break off.
- Evidence is thin: the break is what Gerald described plus the old 6-line bill template. LB650 never exercises it (its summary runs onto page 2), so it has not been checked against a real short-summary bill.

## Source, build and test
- The repo holds only `app.html` (plus this file and the README). The `src/`, `tools/` and `tests/` folders described in the README were never uploaded and cannot be recovered, so `python3 src/build.py` does not exist. Edit `app.html` directly; the fonts, cover templates and PDF reader are embedded in it.
- Inside `app.html`, in order: `TEMPLATES` and `FONTS` data, layout and `pageItems`, `buildPDF` (PDF writer), the change tracker, `PDFR` (PDF reader), `extractModel`, then the editor and toolbar code.
- Tests are not in the repo. They need the original sample PDFs, which are not in the repo because they are legislative documents. To test, open `app.html` in Playwright with the system Chrome (`/usr/bin/google-chrome`), set the file on `#pdfIn`, then call `buildPDF(model)` and compare with the original using pdfplumber or `pdftotext -layout`. `window.__bill` exposes the pieces.
- Verified on LB650 (87 pages): a no-edit re-export has identical text and every glyph in the same position (0.00 pt), and re-opening a saved PDF reproduces it. The older amendment sample was verified the same way in an earlier session. The change page was checked with 7 mixed edits and with 70 edits (3 pages).

## Facts learned from the real PDFs
- Page: 612x792, 10pt, 6pt glyphs, 22pt line pitch. Text x=99, indented first line x=127.8, right edge 538.2. 73 columns, 68 for indented lines.
- Underline rule at 8.3pt below the char top, strike at 4.6pt.
- Bill cover (page 1) has a hanging first paragraph and 18pt bold title. Running header: 2 lines on bills, 3 on amendments.
- A line ending at x >= 537.6 is a full justified line; the next line continues the paragraph.
- Section headings "Sec. 2." to "Sec. 32." in LB650 have one bold space after the number. "Sec. 33." to "Sec. 37." have two plain spaces, and that changes where the line wraps. The reader keeps a double space after a period and collapses every other run of spaces.

## Publishing
- Published as a claude.ai artifact (the Artifact tool). The page uses the `downloads` capability to save files.
- Push changes to GitHub yourself when asked (geraldfraas/NE-Redliner, private). Commits end with the Co-Authored-By and Claude-Session lines the session gives you.

## Known gaps / next ideas
- Only tested on a bill (LB650) and an amendment. Resolutions and other types may read wrong; ask for more samples.
- Check the page 1 rule against a real bill whose summary ends on page 1 (ask for one). Bills made by this tool before the `page1-layout` branch have a fixed `firstN` and no `enactBreak` in saved drafts, so they keep the old behavior.
- Justified spacing matches the original exactly on LB650. It may still differ on documents not yet tested.
- The README still lists `src/`, `tools/` and `tests/`. It should be corrected or the folders re-created.
