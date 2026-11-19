/* Presentation only: no changes to file opening, metadata, filenames or numbered text. */
const NR_DISCLAIMER = 'UNOFFICIAL REDLINE — NOT AN OFFICIAL DOCUMENT OF THE NEBRASKA LEGISLATURE.';
function nrLabel(t) {
  return t.replace(/\b((?:LB|AM)\s*(?:\d+[A-Za-z]?|_+)|LEGISLATIVE BILL\s+(?:\d+[A-Za-z]?|_+))(?:\s+Redline)*/gi, '$1 Redline');
}
function nrSource(m) {
  if (m.nrSource) return m.nrSource;
  const id = (m.running || []).filter(t => /^(LB|AM)\s*[\d_]/i.test(t)).map(t => t.replace(/\s+Redline/gi, '')).join(' / ') || 'Unidentified document';
  const dated = (m.running || []).map(t => t.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/)).find(Boolean);
  const read = (m.front || []).map(f => f.t.match(/^Read first time\s+(.+)/i)).find(Boolean);
  const year = (m.running || []).find(t => /^\d{4}$/.test(t.trim()));
  return {id, date:dated ? dated[0] : read ? read[1] + ' (first reading)' : year ? year + ' (year only)' : 'unavailable'};
}
function nrNoticeItems(m) {
  const s = nrSource(m);
  const text = 'Source: ' + s.id + ' | Source date: ' + s.date + ' | NERedliner';
  const size = Math.min(7, 480 / (Math.max(1,text.length) * 0.6));
  return [
    {x:63,top:3,size:6.5,bold:true,gray:0.35,t:NR_DISCLAIMER},
    {x:63,top:13,size,gray:0.35,t:text}
  ];
}
function nrPresentation(m) {
  return {...m, running:m.running.map(nrLabel), front:m.front.map(f => ({...f,t:/^(?:LEGISLATIVE BILL|AMENDMENTS?\b|LB\s*[\d_]|AM\s*[\d_])/i.test(f.t) ? nrLabel(f.t) : f.t}))};
}
const nrBasePageItems = pageItems;
pageItems = function(m, pg) { return nrNoticeItems(m).concat(nrBasePageItems(nrPresentation(m),pg)); };
const nrBaseChangePageItems = changePageItems;
changePageItems = function(m,list) { return nrBaseChangePageItems(nrPresentation(m),list).map(items => nrNoticeItems(m).concat(items)); };
const nrBaseExtractModel = extractModel;
extractModel = function(pages) {
  let savedSource = null;
  const clean = pages.map(pg => {
    const groups = new Map();
    for(const c of pg.chars) { const key=Math.round(c.top); if(!groups.has(key))groups.set(key,[]); groups.get(key).push(c); }
    const remove = new Set();
    for(const chars of groups.values()) {
      const text=chars.slice().sort((a,b)=>a.x0-b.x0).map(c=>c.text).join('').trim();
      const hit=text.match(/^Source: (.*?) \| Source date: (.*?) \| NERedliner$/);
      if(chars[0].top<20 && (text===NR_DISCLAIMER || hit)) {
        chars.forEach(c=>remove.add(c));
        if(hit && !savedSource)savedSource={id:hit[1],date:hit[2]};
      }
    }
    return {...pg,chars:pg.chars.filter(c=>!remove.has(c))};
  });
  const m=nrBaseExtractModel(clean);
  m.running=m.running.map(t=>t.replace(/\s+Redline\b/gi,''));
  m.front=m.front.map(f=>({...f,t:/^(?:LEGISLATIVE BILL|AMENDMENTS?\b|LB\s*[\d_]|AM\s*[\d_])/i.test(f.t) ? f.t.replace(/\s+Redline\b/gi,'') : f.t}));
  m.nrSource=savedSource || nrSource(m);
  return m;
};
const nrBaseRenderPreview=renderPreview;
renderPreview=function() {
  nrBaseRenderPreview();
  document.querySelectorAll('#preview .t').forEach(e=>{if(e.textContent===NR_DISCLAIMER || e.textContent.startsWith('Source: '))e.style.color='#595959';});
};
const nrNotice=document.createElement('p');
nrNotice.id='nrUnofficialNotice';
nrNotice.textContent='Redlines produced here are unofficial and are not official documents of the Nebraska Legislature.';
nrNotice.style.cssText='margin:0;color:var(--muted);font-size:13px';
document.querySelector('header.top').after(nrNotice);
renderPreview();
