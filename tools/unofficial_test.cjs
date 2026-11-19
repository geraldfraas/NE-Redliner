const puppeteer=require('puppeteer');
const path=require('path');
(async()=>{
  const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
  try {
    const page=await browser.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto('file://'+path.resolve('index.html'));
    const checks=await page.evaluate(async()=>{
      const checks=[];
      const check=(name,ok)=>{checks.push(name);if(!ok)throw new Error(name);};
      check('On-screen notice',!!document.getElementById('nrUnofficialNotice'));
      check('Idempotent labels',nrLabel('AM123 Redline / LB456 Redline')==='AM123 Redline / LB456 Redline');
      check('Filename unchanged',nrRedlineFilename('AM123',new Date(2026,10,19))==='AM123 Redline 111926.pdf');
      for(const kind of ['bill','amendment']) {
        const m=newDoc(kind);
        m.running=kind==='bill'?['LB542','2025']:['AM2839','LB959','DLM - 03/19/2026'];
        if(kind==='bill')m.front=m.front.filter(f=>!/^Read first time/.test(f.t));
        adopt(m);
        const raw=JSON.stringify(m);
        const base=nrBasePageItems(m,layout(m)[0]);
        const items=pageItems(m,layout(m)[0]);
        check(kind+' disclaimer above source',items[0].t===NR_DISCLAIMER && items[0].top<items[1].top && items[1].top+items[1].size<22.7);
        check(kind+' header label',items.some(i=>i.top===22.7 && /Redline/.test(i.t||'')));
        check(kind+' title label',items.some(i=>i.top>55 && /Redline/.test(i.t||'')));
        check(kind+' model unchanged by rendering',JSON.stringify(m)===raw);
        check(kind+' numbered text unchanged',JSON.stringify(items.filter(i=>i.ln||i.segs))===JSON.stringify(base.filter(i=>i.ln||i.segs)));
        check(kind+' source date',nrSource(m).date===(kind==='bill'?'2025 (year only)':'03/19/2026'));
        const sheets=changePageItems(m,[{text:'Page 1, Line 1, insert test.'}]);
        check(kind+' change page marked',sheets.length===1 && sheets[0][0].t===NR_DISCLAIMER);
        const before=m.paras.map(p=>p.runs.map(r=>r.t).join('')).join(' ');
        const pdf=await buildPDF(m);
        check(kind+' valid PDF',new TextDecoder().decode(pdf.slice(0,5))==='%PDF-');
        const reopened=await modelFromPDF(pdf);
        check(kind+' round-trip body',reopened.paras.map(p=>p.runs.map(r=>r.t).join('')).join(' ')===before);
        check(kind+' source preserved',JSON.stringify(nrSource(reopened))===JSON.stringify(nrSource(m)));
        check(kind+' notices not imported as headers',!JSON.stringify([reopened.running,reopened.front]).includes('UNOFFICIAL'));
        check(kind+' no duplicate Redline',!JSON.stringify(pageItems(reopened,layout(reopened)[0])).includes('Redline Redline'));
        const readerPages=await PDFR.readAll(pdf);
        check(kind+' gray PDF notice',readerPages.every(p=>p.chars.some(c=>c.top<10 && c.color.every(v=>Math.abs(v-.35)<.001))));
      }
      check('Missing date explicit',nrSource({running:['AM1'],front:[]}).date==='unavailable');
      check('First-reading date labeled',nrSource({running:['LB1','2025'],front:[{t:'Read first time January 22, 2025'}]}).date==='January 22, 2025 (first reading)');
      return checks;
    });
    checks.forEach(c=>console.log('PASS '+c));
    if(errors.length)throw new Error(errors.join(' | '));
    console.log('ALL CHECKS PASSED: '+checks.length);
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
