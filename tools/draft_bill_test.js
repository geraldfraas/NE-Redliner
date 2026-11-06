const puppeteer = require('/tmp/pp/node_modules/puppeteer-core');
const path = require('path');
const failed = [];
const check = function (name, ok, extra) {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? ' ' + extra : ''));
  if (!ok) failed.push(name);
};
(async function () {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
  let errors = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', function (e) { errors.push(String(e)); });
    await page.evaluateOnNewDocument(function () { window.CompressionStream = undefined; });
    await page.goto('file://' + path.resolve('index.html'));
    const r = await page.evaluate(async function () {
      const out = {};
      const pdfText = async function () {
        const bytes = await window.__bill.buildPDF(window.__bill.model);
        let s = '';
        for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
        return s;
      };
      out.newSelHidden = document.getElementById('newSel').hidden;
      out.toolbarButton = !!document.getElementById('bDraft');
      out.welcomeButton = !!document.getElementById('wDraft');
      adopt(nrNewDraftBill());
      await new Promise(function (res) { setTimeout(res, 400); });
      out.chip = document.getElementById('typeChip').textContent;
      out.previewPages = document.querySelectorAll('#preview .pagebox').length;
      out.previewWatermarks = Array.prototype.filter.call(document.querySelectorAll('#preview .page .t'), function (e) {
        return e.textContent === NR_WATERMARK && e.style.transform.indexOf('rotate') >= 0;
      }).length;
      const draftPdf = await pdfText();
      out.pdfHeader = draftPdf.slice(0, 5);
      out.pdfRotated = draftPdf.indexOf('0.7071 0.7071 -0.7071 0.7071') >= 0;
      out.pdfGray = draftPdf.indexOf('0.72 0.72 0.72 rg') >= 0;
      const plain = nrNewDraftBill();
      plain.draftBill = false;
      adopt(plain);
      await new Promise(function (res) { setTimeout(res, 200); });
      const plainPdf = await pdfText();
      out.plainRotated = plainPdf.indexOf('0.7071 0.7071 -0.7071 0.7071') >= 0;
      out.plainWatermarks = Array.prototype.filter.call(document.querySelectorAll('#preview .page .t'), function (e) {
        return e.textContent === NR_WATERMARK;
      }).length;
      out.draftName = nrDraftFilename(new Date(2026, 10, 6));
      out.redlineName = nrRedlineFilename('LB650', new Date(2026, 10, 2));
      return out;
    });
    console.log(JSON.stringify(r));
    check('New bill/New amendment selector still hidden', r.newSelHidden === true);
    check('Toolbar button present', r.toolbarButton === true);
    check('Start-screen button present', r.welcomeButton === true);
    check('Preview has pages', r.previewPages >= 1, String(r.previewPages));
    check('Watermark in preview', r.previewWatermarks >= 1, String(r.previewWatermarks));
    check('Chip says draft bill', /Draft bill/.test(r.chip), r.chip);
    check('PDF header', r.pdfHeader === '%PDF-', r.pdfHeader);
    check('PDF watermark rotated', r.pdfRotated === true);
    check('PDF watermark gray', r.pdfGray === true);
    check('Non-draft PDF has no watermark', r.plainRotated === false);
    check('Non-draft preview has no watermark', r.plainWatermarks === 0);
    check('Draft file name', r.draftName === 'Draft Bill 110626.pdf', r.draftName);
    check('Redline file name unchanged', r.redlineName === 'LB650 Redline 110226.pdf', r.redlineName);
    check('No page errors', errors.length === 0, errors.join(' | '));
  } catch (e) {
    console.log('ERROR ' + (e && e.stack ? e.stack : e));
    failed.push('exception');
  } finally {
    await browser.close();
  }
  console.log(failed.length ? 'FAILED: ' + failed.join(', ') : 'ALL CHECKS PASSED');
  process.exit(failed.length ? 1 : 0);
})();
