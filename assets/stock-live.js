'use strict';
let publishedStock=null;
const stockDate=d=>new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
const stockShort=d=>new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
function datedStockUI(){
 const date=D.signal.signal_date,trade=publishedStock?.trade_date||'2026-10-12',close=stockDate(date),execution=stockDate(trade);
 document.querySelector('#today .statusstamp strong').textContent=close;
 document.querySelector('#today .statusstamp>span:last-child').textContent='Closing data · '+stockShort(trade)+' rotation';
 document.querySelector('[data-stock-signal]').textContent=stockShort(date).toUpperCase()+' SIGNAL';
 document.querySelector('.signalstrip strong').textContent=D.signal.state+' · Model allocation';
 document.querySelector('.signalstrip>span:nth-child(3)').textContent='SPY is '+(D.signal.spy_close>D.signal.spy_sma200?'above':'below')+' its 200-day average. '+D.signal.favorable_count+' of three secondary signals are favorable.';
 const timeline=document.querySelectorAll('.timelineitem small');timeline[0].textContent=close+' · closing data';timeline[1].textContent=execution+' · next market session';
 document.querySelector('.timeline').closest('article').querySelector('.panelhead .pill').textContent='Sleeve '+D.signal.sleeve+' rotation';
 const priceLabels=document.querySelectorAll('#portfolio .sizingpolicy');priceLabels[1].textContent=stockShort(date);
 $('sizingCaption').textContent=tier()[1]+' · '+price(sizing?.budget)+' hypothetical sleeve · '+stockShort(date)+' reference closes';
 $('selectionCount').textContent=new Set(D.signal.picks.map(p=>p.symbol)).size;
 const overlaps=[...new Set(D.signal.picks.map(p=>p.symbol))].filter(s=>new Set(D.signal.picks.filter(p=>p.symbol===s).map(p=>p.bucket)).size>1);
 $('pickSpotlight').closest('article').querySelector('.footnote').textContent='Shown in bucket rank order.'+(overlaps.length?' '+overlaps.join(', ')+' appear in both buckets; weights are combined in the portfolio.':'');
 const cards=document.querySelectorAll('#sourceCards .metric');cards[0].querySelector('.value').textContent=stockShort(date);cards[0].querySelector('.detail').textContent='Closing data for this signal';cards[1].querySelector('.value').textContent=stockShort(date);
 const etfParts=Object.entries(D.signal.etf_weights).filter(([k,v])=>v>0).map(([k,v])=>k+' '+pct(v,1)).join(' / ');
 document.querySelector('.allocationpanel .footnote').textContent='The ETF endpoint currently allocates '+etfParts+'.';
 const mark=document.querySelector('.sidebar .localdot');if(mark)mark.nextSibling.textContent=' Public model dashboard';
}
const stockRender=render,stockSizing=renderSizing;
render=function(){stockRender();datedStockUI();};
renderSizing=function(){stockSizing();if(document.querySelector('#sourceCards .metric'))datedStockUI();};
async function loadStock(){
 const notice=$('stockFreshness');
 try{
   const response=await fetch('/stock-signal.json',{cache:'no-store'});if(!response.ok)throw Error('Unavailable');
   const v=await response.json();
   if(v.schema_version!==1||v.integrity!=='verified'||!v.signal?.tiers?.length||v.signal_date!==v.signal.signal_date||!v.quotes)throw Error('Invalid snapshot');
   for(const t of tiers){const rows=v.signal.tiers.filter(r=>r.tier.replaceAll(' ','')===t[0]);if(!rows.length||Math.abs(rows.reduce((n,r)=>n+r.weight,0)-1)>1e-6)throw Error('Invalid weights');for(const r of rows){if(r.weight>0&&r.symbol!=='CASH'&&(!(v.quotes[r.symbol]?.price>0)||v.quotes[r.symbol]?.date!==v.signal_date))throw Error('Invalid quote');}}
   publishedStock=v;D.signal=v.signal;D.quotes=v.quotes;
   const overdue=!v.refresh_due_at||Date.now()>Date.parse(v.refresh_due_at);
   notice.classList.toggle('warning',overdue);notice.textContent='Published stock signal: '+stockDate(v.signal_date)+' · Applies '+stockDate(v.trade_date)+(overdue?' · Refresh overdue; this is the last verified signal.':' · Latest published snapshot loaded.');
   $('pickRows').innerHTML=D.signal.picks.map(p=>`<tr><td>${esc(p.bucket)}</td><td class="num">${esc(p.rank)}</td><td>${esc(p.symbol)}</td></tr>`).join('');
   render();renderSources();datedStockUI();
 }catch(e){notice.classList.add('warning');notice.textContent='Could not refresh stock data. Showing the saved '+stockDate(D.signal.signal_date)+' snapshot; these are not live quotes.';datedStockUI();}
 try{const r=await fetch('/stock-signals.json',{cache:'no-store'});if(!r.ok)throw Error();const h=await r.json();if(!Array.isArray(h))throw Error();$('stockHistory').innerHTML='<table><thead><tr><th>Signal date</th><th>Trade date</th><th>Sleeve</th><th>State</th><th>Companies</th></tr></thead><tbody>'+h.slice(-6).reverse().map(x=>`<tr><td>${esc(x.signal_date)}</td><td>${esc(x.trade_date)}</td><td>${esc(x.sleeve)}</td><td>${esc(x.state)}</td><td>${esc(x.picks.length)}</td></tr>`).join('')+'</tbody></table>';}catch(e){$('stockHistory').textContent='Published history could not be loaded.';}
}
$('exportTargets').onclick=()=>{if(!sizing?.usable)return;download('FGA-'+selected+'-model-targets-'+D.signal.signal_date+'.csv','signal_date,tier,symbol,model_weight,estimated_shares,reference_price,estimated_value\r\n'+sizing.rows.map(r=>[D.signal.signal_date,selected,r.symbol,r.weight,r.quantity,r.price.toFixed(6),r.value.toFixed(2)].join(',')).join('\r\n'),'text/csv');};
loadStock();
