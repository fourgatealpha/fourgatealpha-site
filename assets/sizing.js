/* Budget-constrained integer sizing over floor/ceiling model share targets. */
(function(root){
 'use strict';
 function size(budget,targets,quotes){
  if(!Number.isFinite(budget)||budget<=0||budget>1e9)return {error:'Enter a sleeve budget between $1 and $1 billion.',rows:[],usable:false};
  const reserve=targets.filter(r=>r.symbol==='CASH').reduce((v,r)=>v+r.weight*budget,0);
  const rows=targets.filter(r=>r.symbol!=='CASH').map(r=>({...r,price:quotes[r.symbol]?.price}));
  if(rows.some(r=>!(Number.isFinite(r.price)&&r.price>0)))return {error:'A reference price is missing. Sizing is unavailable until prices refresh.',rows:[],usable:false};
  const groups=['STOCK','ETF'],goal=groups.map(g=>targets.filter(r=>r.kind===g&&r.symbol!=='CASH').reduce((n,r)=>n+r.weight,0));
  let floorSpend=0;const groupFloor=[0,0];
  for(const r of rows){r.quantity=Math.floor(budget*r.weight/r.price+1e-10);r.value=r.quantity*r.price;floorSpend+=r.value;groupFloor[r.kind==='STOCK'?0:1]+=r.value/budget;}
  const capacity=budget-reserve-floorSpend;
  if(capacity<-.005)return {error:'Model targets exceed the available budget.',rows:[],usable:false};
  // Search every up/down combination around the fractional targets, with valid
  // lower bounds on remaining security error and attainable group exposure.
  const choices=rows.map((r,index)=>{const lo=r.value/budget-r.weight,hi=lo+r.price/budget;return {index,group:r.kind==='STOCK'?0:1,cost:r.price,step:r.price/budget,low:lo*lo,high:hi*hi};})
   .sort((a,b)=>Math.abs(b.low-b.high)-Math.abs(a.low-a.high));
  const n=choices.length,lower=new Array(n+1).fill(0),remaining=Array.from({length:n+1},()=>[0,0]);
  for(let i=n-1;i>=0;i--){lower[i]=lower[i+1]+Math.min(choices[i].low,choices[i].high);remaining[i]=remaining[i+1].slice();remaining[i][choices[i].group]+=choices[i].step;}
  let best=Infinity,bestBits=[],bits=[];
  function groupError(values){return groups.reduce((s,_,g)=>s+(values[g]-goal[g])**2,0);}
  function search(i,spent,values,error){
   let bound=error+lower[i];for(let g=0;g<2;g++){const a=values[g],z=a+remaining[i][g];bound+=(goal[g]<a?a-goal[g]:goal[g]>z?goal[g]-z:0)**2;}
   if(bound>=best-1e-16)return;
   if(i===n){const score=error+groupError(values);if(score<best){best=score;bestBits=bits.slice();}return;}
   const c=choices[i];const order=c.high<c.low?[1,0]:[0,1];
   for(const up of order){if(up&&spent+c.cost>capacity+.000001)continue;bits[i]=up;const next=values.slice();next[c.group]+=up*c.step;search(i+1,spent+up*c.cost,next,error+(up?c.high:c.low));}
  }
  search(0,0,groupFloor,0);
  for(let i=0;i<n;i++){rows[choices[i].index].quantity+=bestBits[i]||0;}
  for(const r of rows)r.value=r.quantity*r.price;
  const stock=rows.filter(r=>r.kind==='STOCK').reduce((s,r)=>s+r.value,0),etf=rows.filter(r=>r.kind==='ETF').reduce((s,r)=>s+r.value,0),cash=budget-stock-etf;
  const error=Math.abs(stock/budget-goal[0])>.06?'Whole shares put stock exposure more than 6 percentage points from the model. Increase the hypothetical budget to track the allocation more closely.':'';
  return {budget,rows,stock,etf,cash,stockTarget:goal[0],error,usable:!error,objective:best,
   basis:'Minimum squared security and stock/ETF group weight error among floor/ceiling share combinations, subject to the budget and model cash reserve.'};
 }
 root.FGASizing={size};if(typeof module!=='undefined')module.exports={size};
})(typeof window==='undefined'?globalThis:window);
