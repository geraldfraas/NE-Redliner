# NERedliner

Single-file browser tool for redlining Nebraska Legislature bills and amendments.

- Opens PDFs produced by the legislature's drafting system (Antenna House output) and rebuilds the text.
- Keeps line numbers (27 on page 1 of an amendment, 6 on a bill cover, 31 per page after) and page numbers correct as you edit.
- Underline (new text), strike-through (deleted text) and red (changes), plus bold and paragraph styles.
- Detects bill vs. amendment; "Redlined by" and version note print at the bottom of every page with a red NERedliner mark.
- Saves a PDF set in embedded Liberation Mono that matches the original layout.

## Use
Open `app.html` in a browser (nothing to install), or publish it as a claude.ai artifact.

## Layout
- `src/template.html` page source; `src/reader.js` and `src/extract.js` are the PDF reader and model builder (also spliced into the template).
- `src/build.py` assembles `app.html` from the template, subset fonts (`fonts.json`) and cover templates.
- `tools/extract_bill.py` Python reference extractor (pdfplumber) used to check the JavaScript reader.
- `tests/` Playwright upload/export check and a PDF comparison script.

Note: `reader.js` and `extract.js` are copied into `template.html`; edit the template and rebuild.
