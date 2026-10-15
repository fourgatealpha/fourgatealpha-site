(function(){
 'use strict';
 const node=id=>document.getElementById(id),safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pct=(v,d=1)=>Number.isFinite(v)?(100*v).toFixed(d).replace('-','−')+'%':'—';
 const stock=document.body.classList.contains('stocksite');let data=null;
 const key=()=>stock?tier()[2]:'ETF_BASE';
 const label=()=>stock?'4D Stock Picker · '+tier()[1]:'4D ETF System';
 const series=()=>[[key(),label(),'var(--chart-model)'],['SPY','SPY','#7f92ae'],['SPY_80_20','80/20 SPY/IEF','#b99545']];
 const tone=v=>v>=0?'return-positive':'return-negative';
 function table(head,body){return '<table><thead><tr>'+head.map((s,i)=>'<th'+(i?' class="num"':'')+'>'+s+'</th>').join('')+'</tr></thead><tbody>'+body+'</tbody></table>';}
 function cells(values){return values.map(v=>'<td class="num '+tone(v)+'">'+pct(v,2)+'</td>').join('');}
 function chart(id,underwater=false){
  const all=series().map(([k,name,color])=>({name,color,points:data.paths[k]})),W=1000,H=340,L=72,R=24,T=18,B=55;
  const count=all[0].points.length,ys=all.flatMap(s=>s.points.map(p=>Math.log10(p[1]*10000))),low=Math.floor(Math.min(...ys)),high=Math.ceil(Math.max(...ys));
  const x=i=>L+i/(underwater?250:count-1)*(W-L-R),y=v=>T+(underwater?1-v:(high-v)/(high-low))*(H-T-B);
  let svg='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+(underwater?'Share of trading sessions below each drawdown level':'Growth of $10,000, model, SPY and 80/20 SPY/IEF')+'">';
  for(let i=0;i<=4;i++){const v=underwater?i/4:low+(high-low)*i/4;svg+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="#dce5e1"/><text x="'+(L-10)+'" y="'+(y(v)+4)+'" text-anchor="end">'+(underwater?pct(v,0):'$'+Math.round(10**v).toLocaleString())+'</text>';}
  for(const s of [...all].reverse()){
   let points=[];
   if(underwater){const depths=Array.from({length:251},()=>0);for(const p of s.points){const last=Math.min(250,Math.floor(-p[2]*1000+1e-9));if(last>=0){depths[0]++;if(last<250)depths[last+1]--;}}let cumulative=0;points=depths.map((v,i)=>{cumulative+=v;return [i,cumulative/count];});}
   else{for(let i=0;i<count;i+=8){let a=i,z=i;for(let j=i;j<Math.min(i+8,count);j++){if(s.points[j][1]<s.points[a][1])a=j;if(s.points[j][1]>s.points[z][1])z=j;}for(const j of new Set([i,a,z,Math.min(count-1,i+7)].sort((a,b)=>a-b)))points.push([j,Math.log10(s.points[j][1]*10000)]);}}
   svg+='<path d="'+points.map(([i,v],j)=>(j?'L':'M')+x(i).toFixed(2)+','+y(v).toFixed(2)).join(' ')+'" fill="none" stroke="'+s.color+'" stroke-width="2" vector-effect="non-scaling-stroke"/>';
  }
  for(let i=0;i<=5;i++){const j=Math.round((underwater?250:count-1)*i/5);svg+='<text x="'+x(j)+'" y="'+(H-B+23)+'" text-anchor="'+(i===0?'start':i===5?'end':'middle')+'">'+(underwater?(i?'−'+i*5:'0')+'%':all[0].points[j][0].slice(0,4))+'</text>';}
  if(underwater)svg+='<text x="'+((W+L-R)/2)+'" y="'+(H-4)+'" text-anchor="middle">Drawdown depth</text><text transform="translate(18,'+((H+T-B)/2)+') rotate(-90)" text-anchor="middle">Time below drawdown level</text>';
  node(id).innerHTML=svg+'</svg>';
  if(!underwater)node(id).onpointermove=e=>{const box=node(id).getBoundingClientRect(),j=Math.max(0,Math.min(count-1,Math.round(((e.clientX-box.left)/box.width*W-L)/(W-L-R)*(count-1))));node('analysisReadout').textContent=all[0].points[j][0]+' · '+all.map(s=>s.name+' $'+Math.round(s.points[j][1]*10000).toLocaleString()).join(' · ');};
 }
 function overview(){
  const row=(title,items,values)=>'<section class="return-row" aria-label="'+title+'"><h3 class="return-row-heading">'+title+'</h3><div class="return-snapshot">'+items.map(h=>'<div><span>'+safe(h.label)+'</span><strong class="'+tone(values[h.key][key()])+'">'+pct(values[h.key][key()],2)+'</strong></div>').join('')+'</div></section>';
  const html=row('Raw total returns',data.horizons,data.recent)+row('Annualized CAGR',data.cagr_horizons,data.annualized);
  if(stock){node('overviewTierLabel').textContent=tier()[1]+' · through '+data.end;node('overviewReturns').innerHTML=html;
   if(data.market_state.signal_date===D.signal.signal_date){const votes=data.market_state.spy_trend_votes;const score=node('signalCards').children[2];score.querySelector('.label').textContent='SPY TREND COMPOSITE';score.querySelector('.value').textContent=votes+' / 3';score.querySelector('.detail').textContent='At least 2 favorable votes required';document.querySelector('.signalstrip>span:nth-child(3)').textContent='SPY: '+votes+' of 3 SMA trend votes. '+D.signal.favorable_count+' of three secondary signals are favorable.';}
   let etfs=node('currentEtfSelection');if(!etfs){const picks=node('pickSpotlight').closest('article');etfs=document.createElement('div');etfs.id='currentEtfSelection';picks.append(etfs);}
   const chosen=targets().filter(r=>r.kind==='ETF'&&r.symbol!=='CASH');
   etfs.innerHTML='<h3>The current ETF selection</h3><div class="etf-selection">'+chosen.map(r=>'<div class="picktile"><strong>'+safe(r.symbol)+'</strong><small>'+safe(names[r.symbol]||r.symbol)+'</small><span class="weight">'+pct(r.weight,2)+' sleeve weight</span></div>').join('')+'</div>'+(chosen.length?'':'<p class="muted">No ETFs in this tier’s current allocation.</p>');
  }else{let strip=node('etfHistoryReturns');if(!strip){strip=document.createElement('div');strip.id='etfHistoryReturns';strip.className='history-return-strip';node('modelCohortPanel').querySelector('.panelhead').append(strip);}strip.innerHTML='<span class="snapshot-label">Portfolio returns · '+data.end+'</span>'+html;}
 }
 function aggregate(){
  if(stock)return;const colors={SPY:'var(--chart-model)',QQQ:'#7f92ae',SHY:'var(--chart-reserve)',TLT:'#70899b',UUP:'var(--chart-currency)',GLD:'#b99545',FXF:'#8e7cae',IBIT:'#718c6d',CASH:'#b9c5bd'};
  if(data.market_state.signal_date===ET.signal.signal_date)node('etfRegime').textContent='SPY: '+data.market_state.spy_trend_votes+' of 3 SMA trend votes · 2 required';
  const weights=Object.entries(data.aggregate_etf.weights);let running=0;
  const segments=weights.map(([k,v])=>{const a=running;running+=v;return colors[k]+' '+(a*100)+'% '+(running*100)+'%';});
  node('aggregateDate').textContent='Model portfolio · '+data.aggregate_etf.as_of+' close';
  node('aggregatePie').innerHTML='<div class="allocation-donut" role="img" aria-label="'+safe(weights.map(([k,v])=>k+' '+pct(v)).join(', '))+'" style="background:conic-gradient('+segments.join(',')+')"><span>3<small>sleeves</small></span></div><div class="aggregate-legend">'+weights.map(([k,v])=>'<div><span><i class="swatch" style="background:'+colors[k]+'"></i>'+safe(k==='CASH'?'Cash':k)+'</span><strong>'+pct(v)+'</strong></div>').join('')+'</div>';
 }
 function render(){
  if(!data)return;overview();aggregate();const ks=series(),m=data.full_metrics[key()];
  node('analysisMetrics').innerHTML=[['CAGR',pct(m.cagr)],['Max drawdown',pct(m.max_drawdown)],['Time ≥10% below peak',pct(m.time_below_10pct)],['Sharpe',m.sharpe.toFixed(2)]].map(([l,v])=>'<div class="metric"><div class="label">'+l+'</div><div class="value">'+v+'</div><div class="detail">'+safe(label())+'</div></div>').join('');
  document.querySelectorAll('.analysisLegend').forEach(n=>n.innerHTML=ks.map(([,l,c])=>'<span><i class="swatch" style="background:'+c+'"></i>'+safe(l)+'</span>').join(''));
  node('analysisRecent').innerHTML=table(['Portfolio',...data.horizons.map(h=>safe(h.label))],ks.map(([k,l])=>'<tr><th scope="row">'+safe(l)+'</th>'+cells(data.horizons.map(h=>data.recent[h.key][k]))+'</tr>').join(''));
  node('analysisAnnualized').innerHTML=table(['Portfolio',...data.cagr_horizons.map(h=>safe(h.label))],ks.map(([k,l])=>'<tr><th scope="row">'+safe(l)+'</th>'+cells(data.cagr_horizons.map(h=>data.annualized[h.key][k]))+'</tr>').join(''));
  node('analysisRecentNote').textContent='Through '+data.end+'. '+data.basis.recent+' '+data.basis.annualized+' '+data.basis.benchmark;
  node('analysisPeriods').innerHTML=table(['Period / portfolio','CAGR','MaxDD','Time ≥10% below peak','Sharpe'],data.five_year.map(p=>'<tr class="period-divider"><th colspan="5">'+safe(p.label)+' · '+p.metrics[key()].start+' to '+p.metrics[key()].end+'</th></tr>'+ks.map(([k,l])=>{const m=p.metrics[k];return '<tr><th scope="row">'+safe(l)+'</th><td class="num">'+pct(m.cagr,2)+'</td><td class="num">'+pct(m.max_drawdown,2)+'</td><td class="num">'+pct(m.time_below_10pct,2)+'</td><td class="num">'+(Number.isFinite(m.sharpe)?m.sharpe.toFixed(2):'—')+'</td></tr>';}).join('')).join(''));
  node('analysisStress').innerHTML=table(['Event / dates',...ks.map(([,l])=>safe(l))],data.stress.map(p=>'<tr><th scope="row">'+safe(p.label)+'<small class="period-dates">'+p.start+'–'+p.end+'</small></th>'+cells(ks.map(([k])=>p.returns[k]))+'</tr>').join(''));
  chart('analysisGrowth');chart('analysisUnderwater',true);
 }
 window.FGAAnalysis={render,state:()=>data?.market_state};
 if(stock){const previous=render; /* Local name is deliberately separate from the retained stock renderer. */
  const stockRefresh=window.render; // Function declarations in the retained classic script live on window.
  window.render=function(){stockRefresh();previous();};
  const sizeRefresh=window.renderSizing;window.renderSizing=function(){sizeRefresh();if(data)overview();};
 }
 (async()=>{try{const response=await fetch('/assets/dashboard-analysis.json',{cache:'no-store'});if(!response.ok)throw Error('Comparison data unavailable');data=await response.json();const expected=stock?D.report.end:ET.researchMetrics.end;if(data.end!==expected)throw Error('Comparison endpoint differs');render();}catch(error){node('analysisDates').textContent='Comparison data could not be loaded. Refresh the dashboard to try again.';node('analysisDates').classList.add('warning');}})();
})();
