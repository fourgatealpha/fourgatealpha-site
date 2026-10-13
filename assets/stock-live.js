'use strict';
Object.assign(names,{FXF:'Invesco CurrencyShares Swiss Franc Trust',IBIT:'iShares Bitcoin Trust ETF'});
let publishedStock=null;
let stockHistoryData=JSON.parse(document.getElementById('stockHistoryFallback').textContent);
const stockDate=d=>new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
const stockShort=d=>new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
function datedStockUI(){
 let exceptions=$('stockModelExceptions');
 if(!exceptions){exceptions=document.createElement('article');exceptions.id='stockModelExceptions';exceptions.className='panel';$('stockHistory').closest('article').before(exceptions);}
 const actions=D.signal.retained_sleeve_actions||[];
 exceptions.hidden=!actions.length;
 exceptions.innerHTML='<h2>Retained model sleeve updates</h2>'+actions.map(a=>'<p><strong>Sleeve '+esc(a.sleeve)+' · '+esc(a.symbol)+'</strong><br>'+esc(a.instruction)+'</p>').join('');
 document.getElementById('stockSleeve').textContent='Sleeve '+D.signal.sleeve;
 const date=D.signal.signal_date,trade=publishedStock?.trade_date||'2026-10-12',close=stockDate(date),execution=stockDate(trade);
 document.querySelector('#today .statusstamp strong').textContent=close;
 document.querySelector('#today .statusstamp>span:last-child').textContent='Closing data · '+stockShort(trade)+' rotation';
 document.querySelector('[data-stock-signal]').textContent=stockShort(date).toUpperCase()+' SIGNAL';
 document.querySelector('.signalstrip strong').textContent=D.signal.state+' · Model allocation';
 const researchState=window.FGAAnalysis?.state();
 const votes=researchState?.signal_date===D.signal.signal_date?researchState.spy_trend_votes:D.signal.spy_trend_votes;
 document.querySelector('.signalstrip>span:nth-child(3)').textContent=(Number.isFinite(votes)?'SPY: '+votes+' of 3 SMA trend votes (at least 2 required). ':'SPY trend composite. ')+D.signal.favorable_count+' of three secondary signals are favorable.';
 const timeline=document.querySelectorAll('.timelineitem small');timeline[0].textContent=close+' · closing data';timeline[1].textContent=execution+' · next market session';
 document.querySelector('.timeline').closest('article').querySelector('.panelhead .pill').textContent='Sleeve '+D.signal.sleeve+' rotation';
 const priceLabels=document.querySelectorAll('#portfolio .sizingpolicy');priceLabels[1].textContent=stockShort(date);
 $('sizingCaption').textContent=tier()[1]+' · '+price(sizing?.budget)+' hypothetical sleeve · '+stockShort(date)+' reference closes';
 const picks=[...new Set(D.signal.picks.map(p=>p.symbol))].map(symbol=>({symbol,buckets:D.signal.picks.filter(p=>p.symbol===symbol)}));
 $('selectionCount').textContent=picks.length;
 renderSelectionRanks();
 const selectionTargets=targets();
 $('pickSpotlight').innerHTML=picks.map(p=>{
  const weight=selectionTargets.filter(r=>r.kind==='STOCK'&&r.symbol===p.symbol).reduce((n,r)=>n+r.weight,0);
  const ranks=p.buckets.map(r=>esc(r.bucket)+' #'+esc(r.rank)).join(' · ');
  return '<div class="picktile"><span class="rank">'+ranks+'</span><strong>'+esc(p.symbol)+'</strong><small>'+esc(names[p.symbol]||p.symbol)+'</small><span class="weight">'+pct(weight,2)+' sleeve weight</span></div>';
 }).join('');
 const overlaps=[...new Set(D.signal.picks.map(p=>p.symbol))].filter(s=>new Set(D.signal.picks.filter(p=>p.symbol===s).map(p=>p.bucket)).size>1);
 $('pickSpotlight').closest('article').querySelector('.footnote').textContent='Shown in bucket rank order.'+(overlaps.length?' '+overlaps.join(', ')+' appear in both buckets; weights are combined in the portfolio.':'');
 const cards=document.querySelectorAll('#sourceCards .metric');cards[0].querySelector('.value').textContent=stockShort(date);cards[0].querySelector('.detail').textContent='Closing data for this signal';cards[1].querySelector('.value').textContent=stockShort(date);
 const etfParts=Object.entries(D.signal.etf_weights).filter(([k,v])=>v>0).map(([k,v])=>k+' '+pct(v,1)).join(' / ');
 document.querySelector('.allocationpanel .footnote').textContent='The ETF endpoint currently allocates '+etfParts+'.';
 const mark=document.querySelector('.sidebar .localdot');if(mark)mark.nextSibling.textContent=' Public model dashboard';
 renderStockAllocationBar();
}
function renderSelectionRanks(){
 $('pickRows').innerHTML=D.signal.picks.map(p=>'<tr><td>'+esc(p.rank)+'</td><td><span class="securitysymbol">'+esc(p.symbol)+'</span><span class="securityname">'+esc(names[p.symbol]||p.symbol)+'</span></td><td>'+esc(p.bucket)+'</td></tr>').join('');
}
function renderStockAllocationBar(){
 const rows=targets(),stock=rows.filter(r=>r.kind==='STOCK').reduce((n,r)=>n+r.weight,0),etfs=rows.filter(r=>r.kind==='ETF'&&r.symbol!=='CASH');
 const etf=etfs.reduce((n,r)=>n+r.weight,0),cash=rows.filter(r=>r.symbol==='CASH').reduce((n,r)=>n+r.weight,0);
 const header=$('stockTarget').parentElement;header.style.gap='0';
 let cashLabel=$('stockCashTarget');if(!cashLabel){cashLabel=document.createElement('span');cashLabel.id='stockCashTarget';header.append(cashLabel);}
 const groups=[['Stocks',stock,$('stockTarget')],['ETFs',etf,$('etfTarget')],['Cash',cash,cashLabel]];
 groups.forEach(([label,weight,node])=>{node.hidden=weight<1e-10;node.style.flex='0 0 '+(100*weight)+'%';node.style.textAlign='center';node.innerHTML=pct(weight,0)+'<small>'+label+'</small>';});
 let start=0,braces='';
 groups.filter(([,weight])=>weight>1e-10).forEach(([label,weight])=>{
  const left=start*1000+1,right=(start+weight)*1000-1,middle=(left+right)/2,bend=Math.min(20,(right-left)/8);
  braces+='<path d="M '+left+' 29 Q '+left+' 11 '+(left+bend)+' 11 L '+(middle-bend)+' 11 Q '+middle+' 11 '+middle+' 1 Q '+middle+' 11 '+(middle+bend)+' 11 L '+(right-bend)+' 11 Q '+right+' 11 '+right+' 29" fill="none" stroke="#286d82" stroke-width="1.5" vector-effect="non-scaling-stroke"/>';start+=weight;
 });
 const palette={SPY:'#7f92ae',QQQ:'#b99545',SHY:'var(--chart-reserve)',TLT:'#70899b',UUP:'var(--chart-currency)',GLD:'#ba9b55',FXF:'#8e7cae',IBIT:'#ae7d5a'};
 const parts=[...(stock>1e-10?[['Stocks',stock,'var(--chart-model)']]:[]),...etfs.filter(r=>r.weight>1e-10).map(r=>[r.symbol,r.weight,palette[r.symbol]||'#70899b']),...(cash>1e-10?[['Cash',cash,'#899c93']]:[])];
 const bar=$('allocationBar');bar.style.height='auto';bar.style.display='block';bar.style.overflow='visible';bar.style.marginTop='0';bar.style.borderRadius='0';
 bar.innerHTML='<svg viewBox="0 0 1000 31" preserveAspectRatio="none" aria-hidden="true" style="display:block;width:100%;height:31px">'+braces+'</svg><div role="img" aria-label="'+esc(parts.map(([name,weight])=>name+' '+pct(weight,1)).join(', '))+'" style="display:flex;height:46px;border-radius:6px;overflow:hidden">'+parts.map(([name,weight,color])=>'<div title="'+esc(name+' '+pct(weight,1))+'" style="flex:0 0 '+(weight*100)+'%;background:'+color+';color:white;display:flex;align-items:center;justify-content:center;font-size:'+(weight<.12?'12':'16')+'px;font-weight:650;white-space:nowrap;overflow:hidden">'+(weight>=.05?esc(name):'')+'</div>').join('')+'</div>';
}
const stockRender=render,stockSizing=renderSizing;
render=function(){stockRender();datedStockUI();renderStockHistory();if(typeof renderModelCohorts==='function')renderModelCohorts();};
renderSizing=function(){stockSizing();if(document.querySelector('#sourceCards .metric'))datedStockUI();};
async function loadStock(){
 const notice=$('stockFreshness');
 try{
   const response=await fetch('/stock-signal.json',{cache:'no-store'});if(!response.ok)throw Error('Unavailable');
   const v=await response.json();
   const researchResponse=await fetch('/assets/stock-report.json',{cache:'no-store'});
   if(!researchResponse.ok)throw Error('Research unavailable');
   const research=await researchResponse.json();
   if(research.end!==v.signal_date||research.verification?.status!=='PASS')throw Error('Research endpoint differs from signal');
   if(v.schema_version!==1||v.integrity!=='verified'||!v.signal?.tiers?.length||v.signal_date!==v.signal.signal_date||!v.quotes)throw Error('Invalid snapshot');
   for(const t of tiers){const rows=v.signal.tiers.filter(r=>r.tier.replaceAll(' ','')===t[0]);if(!rows.length||Math.abs(rows.reduce((n,r)=>n+r.weight,0)-1)>1e-6)throw Error('Invalid weights');for(const r of rows){if(r.weight>0&&r.symbol!=='CASH'&&(!(v.quotes[r.symbol]?.price>0)||v.quotes[r.symbol]?.date!==v.signal_date))throw Error('Invalid quote');}}
   publishedStock=v;D.signal=v.signal;D.quotes=v.quotes;D.report=research;
   const overdue=!v.refresh_due_at||Date.now()>Date.parse(v.refresh_due_at);
   notice.classList.toggle('warning',overdue);notice.textContent='Published stock signal: '+stockDate(v.signal_date)+' · Applies '+stockDate(v.trade_date)+(overdue?' · Refresh overdue; this is the last verified signal.':' · Latest published snapshot loaded.');
   renderSelectionRanks();
   render();renderSources();datedStockUI();
 }catch(e){notice.classList.add('warning');notice.textContent='Could not refresh stock data. Showing the saved '+stockDate(D.signal.signal_date)+' snapshot; these are not live quotes.';datedStockUI();}
 try{const r=await fetch('/stock-signals.json',{cache:'no-store'});if(!r.ok)throw Error();const h=await r.json();if(!Array.isArray(h))throw Error();stockHistoryData=h;renderStockHistory();}catch(e){renderStockHistory();$('stockHistoryAsOf').textContent+=' Could not refresh history; saved history shown.';}
}
function renderStockHistory(){
 const rows=[...stockHistoryData].sort((a,b)=>b.trade_date.localeCompare(a.trade_date));
 $('stockHistoryCount').textContent=rows.length+(rows.length===1?' week · ':' weeks · ')+tier()[1]+' · full history';
 $('stockHistory').innerHTML='<table><thead><tr><th>Trade date</th><th>Sleeve</th><th>System state</th><th>Companies</th><th>Status</th><th class="num">Closed gain/loss</th></tr></thead><tbody>'+rows.map(x=>{
   const status=['Holding','Closed','Scheduled'].includes(x.status)?x.status:'Awaiting update';
   const value=x.gain_loss_by_tier?.[selected.replaceAll(' ','')],valid=status==='Closed'&&Number.isFinite(value);
   const gain=valid?(value>0?'+':'')+pct(value,2):(status==='Closed'?'Pending':'—');
   return `<tr><td>${esc(x.trade_date)}</td><td>${esc(x.public_sleeve??(x.sleeve%3+1))}</td><td>${esc(x.state)}<small class="history-close-date">v${esc(x.strategy_version||"1.0")}</small></td><td>${esc(x.picks.length)}</td><td><span class="history-status ${status.toLowerCase().replace(' ','-')}">${esc(status)}</span>${status==='Closed'?'<small class="history-close-date">'+esc(x.close_date)+'</small>':''}</td><td class="num ${valid?(value>=0?'return-positive':'return-negative'):''}" title="${esc(x.performance_note||x.return_basis||'')}">${gain}</td></tr>`;
 }).join('')+'</tbody></table>';
 const dates=rows.map(x=>x.performance_as_of).filter(Boolean).sort();
 $('stockHistoryAsOf').textContent=dates.length?'Status and return checks through '+stockDate(dates[dates.length-1])+'.':'Performance refresh pending.';
}
renderStockHistory();
$('exportTargets').onclick=()=>{if(!sizing?.usable)return;download('FGA-'+selected+'-model-targets-'+D.signal.signal_date+'.csv','signal_date,tier,symbol,model_weight,estimated_shares,reference_price,estimated_value\r\n'+sizing.rows.map(r=>[D.signal.signal_date,selected,r.symbol,r.weight,r.quantity,r.price.toFixed(6),r.value.toFixed(2)].join(',')).join('\r\n'),'text/csv');};
loadStock();
