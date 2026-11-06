/* NERedliner personal branch: "New working draft" with a watermark line at the top of every page.
   Appended to app.html by .github/workflows/build-draft-bill.yml. Not part of main. */
const NR_WATERMARK = 'THIS IS NOT A FORMALIZED REQ OF THE NEBRASKA LEGISLATURE.';

function nrNewDraftBill() {
  const run = (t, b) => ({ t: t, b: !!b, u: false, s: false, r: false });
  const m = clone(TEMPLATES.lb);
  m.running = ['WORKING DRAFT'];
  m.front = [
    { t: 'WORKING DRAFT', top: 123.2, size: 18, bold: true, cx: 300.6 },
    { t: 'Prepared by ____', top: 189.1, size: 10, bold: false, x: 99.0 },
    { t: 'Not introduced and not assigned a bill number', top: 210.1, size: 10, bold: false, x: 99.0 }
  ];
  m.paras = [
    { style: 'hang', runs: [run('A BILL FOR AN ACT relating to ____; to amend section ____, Reissue Revised Statutes of Nebraska; and to repeal the original section.')] },
    { style: 'flush', runs: [run('Be it enacted by the people of the State of Nebraska,')] },
    { style: 'indent', runs: [run('Section 1. ', true), run('Type or paste the bill text here.')] }
  ];
  m.docType = 'bill';
  m.author = '';
  m.note = '';
  m.tracked = false;
  m.draftBill = true;
  return m;
}

/* Watermark in the PDF: one small bold gray line near the top of every page, drawn first. */
const nrOriginalPageItems = pageItems;
pageItems = function (m, pg) {
  const items = nrOriginalPageItems(m, pg);
  if (!m || !m.draftBill) return items;
  const size = 9, width = NR_WATERMARK.length * size * 0.6;
  return [{ x: 306 - width / 2, top: 40, size: size, t: NR_WATERMARK, bold: true, gray: 0.35 }].concat(items);
};

/* Preview: tint the same line dark gray and relabel the status chip. */
const nrOriginalRenderPreview = renderPreview;
renderPreview = function () {
  nrOriginalRenderPreview();
  if (!(hasDoc && model && model.draftBill)) return;
  document.querySelectorAll('#preview .page .t').forEach(function (e) {
    if (e.textContent === NR_WATERMARK) e.style.color = '#595959';
  });
  const chip = document.getElementById('typeChip');
  if (chip) chip.textContent = 'Working draft (not an LB)';
};

/* Saved PDFs of a working draft are named "Working Draft MMDDYY.pdf". */
function nrDraftFilename(date) {
  const d = date || new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return 'Working Draft ' + mm + dd + yy + '.pdf';
}
const nrPreDraftSaveFile = saveFile;
saveFile = async function (name, data) {
  if (model && model.draftBill && /\.pdf$/i.test(name)) return nrOriginalSaveFile(nrDraftFilename(), data);
  return nrPreDraftSaveFile(name, data);
};

/* Controls: toolbar button and start-screen button. */
function nrAddDraftControls() {
  const make = function (id) {
    const b = document.createElement('button');
    b.id = id;
    b.textContent = 'New working draft';
    b.title = 'Start a personal working draft (marked as not a formal REQ of the Legislature)';
    b.addEventListener('mousedown', function (e) { e.preventDefault(); });
    b.addEventListener('click', function () { adopt(nrNewDraftBill()); });
    return b;
  };
  const bar = document.querySelector('.bar');
  const open = document.getElementById('bOpen');
  if (bar && open && !document.getElementById('bDraft')) bar.insertBefore(make('bDraft'), open);
  const wb = document.querySelector('.welcome .wbtns');
  if (wb && !document.getElementById('wDraft')) wb.appendChild(make('wDraft'));
}
nrAddDraftControls();
new MutationObserver(nrAddDraftControls).observe(document.body, { childList: true, subtree: true });
