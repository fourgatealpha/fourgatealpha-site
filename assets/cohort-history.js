'use strict';
let modelCohortData=JSON.parse(document.getElementById('modelCohortFallback').textContent);
function renderModelCohorts(){
 const panel=document.getElementById('modelCohortPanel');
 const key=panel.dataset.cohortSystem==='etf'?'ETF':selected.replaceAll(' ','');
 const rows=panel.dataset.cohortSystem==='etf'?modelCohortData.etf:modelCohortData.tiers[key];
 if(!rows)throw Error('Model tier unavailable');
 const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const percent=n=>Number((100*n).toFixed(1))+'%';
 document.getElementById('modelCohortCount').textContent=rows.length+' weeks · '+key;
 const dates=rows.map(r=>r.performance_as_of).filter(Boolean).sort();
 document.getElementById('modelCohortAsOf').textContent='Newest first · full history · Weekly backtest through '+modelCohortData.end+' · Sleeve status through '+(modelCohortData.history_as_of||dates.at(-1)||modelCohortData.end);
 document.getElementById('modelCohortRows').innerHTML=[...rows].reverse().map(r=>{
  const valid=r.status==='Closed'&&Number.isFinite(r.gain_loss);
  const gain=valid?(r.gain_loss>=0?'+':'')+(100*r.gain_loss).toFixed(2)+'%':r.status==='Closed'?'Pending':'—';
  const color=valid?(r.gain_loss>=0?'return-positive':'return-negative'):'';
  const mix=Object.entries(r.allocation).filter(([,v])=>v>0).map(([k,v])=>(k==='STOCKS'?'<button type="button" data-stock-date="'+safe(r.trade_date)+'" style="border:0;background:none;padding:0;color:#16705e;text-decoration:underline;font:inherit;cursor:pointer" aria-label="View stocks for '+safe(r.trade_date)+'">Stocks</button>':safe(k==='CASH'?'Cash':k))+' '+percent(v)).join(' · ');
  const status=r.status||'Awaiting update';
  const planned=status!=='Closed'&&r.scheduled_close_date;
  const close=safe(r.close_date||planned||'—')+(planned?'<small class="muted" style="display:block">Scheduled</small>':'');
  return '<tr><td style="white-space:nowrap">'+safe(r.trade_date)+'</td><td>'+safe(r.sleeve)+'</td><td>'+safe(r.state)+'</td><td>'+mix+'</td><td>'+safe(r.companies)+'</td><td><span title="As of '+safe(r.performance_as_of||modelCohortData.end)+'" class="history-status '+safe(status.toLowerCase())+'">'+safe(status)+'</span></td><td style="white-space:nowrap">'+close+'</td><td class="num '+color+'" title="'+safe(r.performance_note||r.return_basis||modelCohortData.return_basis)+'">'+gain+'</td></tr>';
 }).join('');
 document.dispatchEvent(new Event('fga-tier-changed'));
}
renderModelCohorts();
document.getElementById('modelCohortPanel').addEventListener('click',event=>{
 const button=event.target.closest('[data-stock-date]');if(!button)return;
 const key=selected.replaceAll(' ','');const row=modelCohortData.tiers[key].find(r=>r.trade_date===button.dataset.stockDate);
 if(!row)return;
 const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 document.getElementById('stockSleeveTitle').textContent='Stocks · '+row.trade_date+' · Sleeve '+row.sleeve+' · '+key;
 const rows=[...(row.stocks||[])].sort((a,b)=>b.weight-a.weight||a.symbol.localeCompare(b.symbol));
 document.getElementById('stockSleeveDetails').innerHTML='<div class="tablewrap"><table><thead><tr><th>Stock</th><th class="num">Sleeve weight</th><th>Entry</th><th>Exit</th><th class="num">Gain/loss</th></tr></thead><tbody>'+rows.map(r=>{
  const valid=Number.isFinite(r.gain_loss)&&row.status==='Closed';
  const gain=valid?(r.gain_loss>=0?'+':'')+(100*r.gain_loss).toFixed(2)+'%':row.status==='Closed'?'Pending':'—';
  return '<tr><td>'+safe(r.symbol)+'</td><td class="num">'+(100*r.weight).toFixed(2)+'%</td><td style="white-space:nowrap">'+safe(r.entry_date)+'</td><td style="white-space:nowrap">'+safe(r.exit_date||(row.status!=='Closed'&&row.scheduled_close_date)||'—')+(row.status!=='Closed'&&row.scheduled_close_date?'<small class="muted" style="display:block">Scheduled</small>':'')+'</td><td class="num '+(valid?(r.gain_loss>=0?'return-positive':'return-negative'):'')+'" title="'+safe(r.note||r.return_basis||'')+'">'+gain+'</td></tr>';
 }).join('')+'</tbody></table></div>'+(row.status!=='Closed'?'<p class="muted">'+safe(row.status)+' sleeve · individual closed returns are not available yet.</p>':'');
 document.getElementById('stockSleeveDialog').showModal();
});
(async()=>{
 try{
  const response=await fetch('/assets/sleeve-history.json',{cache:'no-store'});
  if(!response.ok)throw Error('History unavailable');
  const data=await response.json();
  if(data.end!==modelCohortData.end||data.record_kind!=='WEEKLY_MODEL_SLEEVE_HISTORY'||data.etf.length<52||Object.values(data.tiers).some(rows=>rows.length<52))throw Error('History endpoint differs');
  modelCohortData=data;renderModelCohorts();
 }catch(error){document.getElementById('modelCohortAsOf').textContent+=' · Saved history shown.';}
})();
