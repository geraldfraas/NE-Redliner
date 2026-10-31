# NERedliner: notes for Claude

Owner: Gerald Fraas, Nebraska State Legislature. Browser tool to open a bill or amendment PDF from the drafting system, edit it, and save a redlined PDF.

## What it does (all working and tested)
- Opens PDFs from the drafting system (Antenna House, Liberation Mono) with its own reader (`src/reader.js`, `src/extract.js`). No PDF library; the sandbox could not reach CDNs or npm.
- Detects bill vs. amendment. Layout presets: bill 6 numbered lines on page 1 (cover), amendment 27, then 31 per page. Last page takes the remainder.
- Line numbers, page breaks and `-n-` page numbers are rebuilt on every edit.
- Underline = new text, strike-through = deleted text, red = changed text, bold, paragraph styles (indented, flush, hanging).
- Saves a PDF with embedded Liberation Mono and fractional justification matching the originals.
- Every page: red "NERedliner" bottom left; small red "Redlined by <author> · <version/date>" line under it.
- No sample menu. The page opens on a "Start with a PDF" screen. "New bill" / "New amendment" start from cover templates.

## Build and test
- `python3 src/build.py` writes `app.html` from `src/template.html`, `src/fonts.json`, `src/am.json`, `src/lb.json`.
- `reader.js` and `extract.js` are spliced into `template.html`. Edit the template and rebuild.
- Tests: `tests/test_upload_export.js` (Playwright) and `tests/compare_pdfs.py` (pdfplumber). They need the original sample PDFs, which are not in the repo because they are legislative documents.
- Verified: both sample PDFs re-export with identical text and line positions, and a saved PDF re-opens to the same text, underline, strike and red marks.

## Facts learned from the real PDFs
- Page: 612x792, 10pt, 6pt glyphs, 22pt line pitch. Text x=99, indented first line x=127.8, right edge 538.2. 73 columns, 68 for indented lines.
- Underline rule at 8.3pt below the char top, strike at 4.6pt.
- Bill cover (page 1) has a hanging first paragraph and 18pt bold title. Running header: 2 lines on bills, 3 on amendments.
- A line ending at x >= 537.6 is a full justified line; the next line continues the paragraph.

## Publishing
- Published as a claude.ai artifact (the Artifact tool). The page uses the `downloads` capability to save files.
- Push changes to GitHub yourself when asked (geraldfraas/NE-Redliner, private). Commits end with the Co-Authored-By and Claude-Session lines the session gives you.

## Known gaps / next ideas
- Only tested on two documents. Resolutions and other types may read wrong; ask for more samples.
- Justified spacing is close but not identical to the drafting software.
