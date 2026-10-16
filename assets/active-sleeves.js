(function(){
 'use strict';
 const anchor=document.getElementById('modelCohortPanel');if(!anchor)return;
 const stock=anchor.dataset.cohortSystem==='stocks';let data=null;
 const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const panel=document.createElement('article');panel.className='panel active-sleeves';panel.id='activeSleevePanel';
 panel.innerHTML='<div class="panelhead"><h2>Active sleeve performance</h2><span class="pill" id="activeSleeveTier"></span></div><p id="activeSleeveAsOf" class="muted" role="status">Loading closing-price returns…</p><div class="active-sleeve-grid" id="activeSleeveCards"></div><p class="footnote" id="activeSleeveBasis"></p>';
 anchor.before(panel);
 const date=d=>new Date(d+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'America/New_York'});
 function render(){
  if(!data)return;
  const key=stock?selected.replaceAll(' ',''):'ETF';const rows=stock?data.tiers[key]:data.etf;
  if(!rows||rows.length!==3)throw Error('Three sleeves required');
  const archive=stock?modelCohortData.tiers[key]:modelCohortData.etf;
  document.getElementById('activeSleeveTier').textContent=stock?selected:'ETF System';
  document.getElementById('activeSleeveAsOf').textContent=(Date.now()>Date.parse(data.refresh_due_at)?'Update overdue · ':'')+'Closing prices: '+date(data.as_of)+' · Since each sleeve’s last rotation';
  document.getElementById('activeSleeveCards').innerHTML=rows.map(r=>{
   const current=archive.filter(x=>x.sleeve===r.sleeve&&x.trade_date<=data.as_of).sort((a,b)=>a.trade_date.localeCompare(b.trade_date)).at(-1);
   const allocationMatches=current&&r.allocation&&Object.keys(current.allocation).length===Object.keys(r.allocation).length&&Object.entries(current.allocation).every(([s,w])=>Math.abs(w-r.allocation[s])<1e-9);
   const valid=current&&current.trade_date===r.trade_date&&allocationMatches&&r.status==='Holding'&&Number.isFinite(r.gain_loss);
   const tone=valid?(r.gain_loss>=0?'return-positive':'return-negative'):'';
   const value=valid?(r.gain_loss>=0?'+':'−')+Math.abs(100*r.gain_loss).toFixed(2)+'%':'Pending';
   const benchmarks=[['SPY','SPY'],['SPY_80_20','80/20 SPY/IEF']].map(([key,label])=>{
    const b=r.benchmarks?.[key];const ready=valid&&b?.status==='Holding'&&b.trade_date===r.trade_date&&b.as_of===data.as_of&&Number.isFinite(b.gain_loss);
    const text=ready?(b.gain_loss>=0?'+':'−')+Math.abs(100*b.gain_loss).toFixed(2)+'%':'Pending';
    return '<div><span>'+label+'</span><span class="'+(ready?(b.gain_loss>=0?'return-positive':'return-negative'):'')+'">'+text+'</span></div>';
   }).join('');
   return '<section class="active-sleeve-card"><h3>Sleeve '+r.sleeve+'</h3><p>Rotated '+(r.trade_date?date(r.trade_date):'—')+'</p><strong class="active-sleeve-return '+tone+'">'+value+'</strong><div class="active-sleeve-benchmarks" aria-label="Benchmark returns for the same rotation period">'+benchmarks+'</div><span>'+(valid?'Return since rotation':safe(r.note||'Awaiting a verified mark for this allocation.'))+'</span></section>';
  }).join('');
  document.getElementById('activeSleeveBasis').textContent=data.basis;
 }
 document.addEventListener('fga-tier-changed',render);
 async function refresh(){try{
  const response=await fetch('/assets/sleeve-performance.json',{cache:'no-store'});if(!response.ok)throw Error('Marks unavailable');
  const latest=await response.json();if(latest.record_kind!=='ACTIVE_MODEL_SLEEVE_PERFORMANCE'||!/^\d{4}-\d{2}-\d{2}$/.test(latest.as_of)||!latest.refresh_due_at)throw Error('Invalid mark feed');
  if(data&&latest.as_of<data.as_of)throw Error('Older mark rejected');data=latest;render();
 }catch(error){document.getElementById('activeSleeveAsOf').textContent=data?'Refresh unavailable · last verified closing prices: '+date(data.as_of):'Closing-price returns are not available yet.';}}
 refresh();setInterval(()=>{if(document.visibilityState==='visible')refresh();},15*60*1000);
})();
