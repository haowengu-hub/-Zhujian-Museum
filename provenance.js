function setupProvenance({GEO,UX,UY,US,O,$,esc,getHoverEra}){
/* Shares the original map's city anchors, zoom and colour palette. */
let provenanceRows=[],productionRows=[],provenanceOn=true;
const routeSVG=document.createElementNS('http://www.w3.org/2000/svg','svg');
routeSVG.id='provenance';routeSVG.setAttribute('viewBox','0 0 1000 780');
$('#topB').insertBefore(routeSVG,$('#lamps'));
const routePanel=document.createElement('div');routePanel.id='routePanel';
routePanel.innerHTML='<button id="routeToggle" aria-pressed="true">来处 <span>→</span> 现藏</button><small class="route-key"><i class="dig"></i>出土地<i class="made"></i>生产地 · 窑口</small><small id="routeCount" role="status">正在加载连线</small><small>城市示意；两者都有时只画出土地</small>';
$('#stage').appendChild(routePanel);
const routeStyle=document.createElement('style');routeStyle.textContent=`
#provenance{pointer-events:none;overflow:visible}
.provenance-group,.provenance-group:focus,.provenance-group:focus-visible{outline:none}
.provenance-group:focus-visible .provenance-route{stroke:#ffe6c2;stroke-width:2;opacity:1}
#lamps{pointer-events:none}#lamps .city{pointer-events:all}
.provenance-route{fill:none;stroke:#c6a46c;stroke-width:1;opacity:.32;vector-effect:non-scaling-stroke}
.provenance-flow{fill:none;stroke:#ffe6c2;stroke-width:1.4;stroke-linecap:round;stroke-dasharray:6 94;animation:provenanceFlow 6s linear infinite;vector-effect:non-scaling-stroke;pointer-events:none;opacity:.8}
.provenance-hit{fill:none;stroke:transparent;stroke-width:8;pointer-events:stroke;cursor:help;vector-effect:non-scaling-stroke}
.provenance-group.made .provenance-route{stroke:#9db7c9;stroke-dasharray:3 4;opacity:.42}
.provenance-group.made .provenance-flow{stroke:#dbe8f0}
.route-key{display:flex!important;align-items:center;gap:6px;color:var(--dim)}
.route-key i{display:inline-block;width:18px;height:0;border-top:1.5px solid #c6a46c;margin-left:4px}
.route-key i.made{border-top:1.5px dashed #9db7c9;margin-left:10px}
.provenance-group:hover .provenance-route,.provenance-group:focus .provenance-route{stroke:#ffe6c2;opacity:1;stroke-width:2}
#routePanel{position:absolute;right:28px;top:100px;z-index:5;text-align:right;max-width:260px;color:var(--dim);font-size:11px;line-height:1.9;letter-spacing:.12em}
#routePanel button{font-size:14px;color:var(--txt);border-bottom:1px solid #c6a46c66;padding:0 0 7px;margin-bottom:8px;letter-spacing:.15em}
#routePanel button[aria-pressed="false"]{color:var(--dim);border-color:var(--hair)}
#routePanel span{color:#c6a46c;padding:0 9px}#routePanel small{display:block;font-size:10px}
@keyframes provenanceFlow{to{stroke-dashoffset:-100}}
@media(prefers-reduced-motion:reduce){.provenance-flow{animation:none}}
@media(max-width:760px){#routePanel{top:85px;right:16px;max-width:205px;font-size:10px}#routePanel button{font-size:12px}}
`;
document.head.appendChild(routeStyle);
function showProvenanceTip(g,x,y){
  const tip=$('#tip');tip.textContent=g.querySelector('title').textContent;
  tip.style.whiteSpace='pre-line';tip.style.maxWidth='min(360px,85vw)';tip.style.left=Math.max(190,Math.min(innerWidth-190,x))+'px';tip.style.top=y+'px';tip.classList.add('on');
}
routeSVG.addEventListener('pointerover',e=>{const g=e.target.closest('.provenance-group');if(g)showProvenanceTip(g,e.clientX,e.clientY)});
routeSVG.addEventListener('pointerout',()=>{$('#tip').classList.remove('on')});
routeSVG.addEventListener('focusin',e=>{const g=e.target.closest('.provenance-group');if(g){const r=g.getBoundingClientRect();showProvenanceTip(g,r.x+r.width/2,r.y)}});
routeSVG.addEventListener('focusout',()=>{$('#tip').classList.remove('on')});
function provenanceAnchor(city){
  const name=(city||'').replace(/^美国\s*[·・]\s*/,'').trim();
  if(/^美国/.test(city||'')){const p=GEO.upts[name];return p?[UX+8+p[0]*US,UY+20+p[1]*US]:null}
  return GEO.pts[name]||null;
}
function provenanceOriginCity(origin){
  // Match explicit administrative city names, never infer a city from a museum.
  return Object.keys(GEO.pts).sort((a,b)=>b.length-a.length).find(n=>origin.includes(n+'市'))||null;
}
function provenancePath(a,b){
  const [x,y]=a,[u,v]=b,dx=u-x,dy=v-y,dist=Math.hypot(dx,dy);
  if(dist<1)return null;
  const bend=Math.min(110,Math.max(30,dist*.24));
  return `M ${x} ${y} Q ${(x+u)/2+dy/dist*bend} ${(y+v)/2-dx/dist*bend} ${u} ${v}`;
}
function renderProvenance(){
  const groups=new Map();const unlocated=[];let linked=0,pending=0,sameCity=0;
  const dug=new Set(provenanceRows.map(r=>r.key));
  [...provenanceRows.map(r=>({...r,origin:r.excavationLocation,kind:'出土'})),...productionRows.filter(r=>!dug.has(r.key))].forEach(row=>{
    const old=O.find(o=>o.k===row.key);
    const era=getHoverEra();if(era!=null&&(!old||old.g!==era))return;
    const city=provenanceOriginCity(row.origin),a=provenanceAnchor(city),b=provenanceAnchor(row.city);
    if(!a||!b){pending++;unlocated.push(row.name+'：'+row.origin+' → '+row.mus);return}
    if(Math.hypot(a[0]-b[0],a[1]-b[1])<1){sameCity++;return}linked++;
    const key=row.kind+'|'+city+'|'+row.city;
    if(!groups.has(key))groups.set(key,{city,dest:row.city,a,b,kind:row.kind,rows:[]});
    groups.get(key).rows.push(row);
  });
  routeSVG.style.display=provenanceOn?'':'none';
  routeSVG.innerHTML=[...groups.values()].map((g,i)=>{
    const d=provenancePath(g.a,g.b),label=`${g.kind==='产地'?'产于':'出土于'}${g.city} → 现藏${g.dest} · ${g.rows.length}件`;
    const details=g.rows.map(r=>`${r.name}：${r.origin} → ${r.mus}`).join('\n');
    return `<g class="provenance-group${g.kind==='产地'?' made':''}" tabindex="0" role="img" aria-label="${esc(label+'；'+details)}"><title>${esc(label+'\n'+details)}</title><path class="provenance-route" d="${d}"/><path class="provenance-flow" pathLength="100" d="${d}" style="animation-delay:-${i*.3}s"/><path class="provenance-hit" d="${d}"/></g>`;
  }).join('');
  $('#routeCount').textContent=provenanceOn?'':'连线已隐藏';
  $('#routeCount').removeAttribute('title');
  $('#routeToggle').setAttribute('aria-pressed',String(provenanceOn));
}
$('#routeToggle').onclick=()=>{provenanceOn=!provenanceOn;renderProvenance()};
async function refreshProvenance(){
  try{
    const r=await fetch('provenance.json',{cache:'no-store'});if(!r.ok)throw Error(r.status);
    const data=await r.json();if(!Array.isArray(data.items))throw Error('数据格式错误');
    if(JSON.stringify(provenanceRows)!==JSON.stringify(data.items)||$('#routeCount').textContent.startsWith('连线暂不可用')){provenanceRows=data.items;renderProvenance()}
    else if(!data.items.length)$('#routeCount').textContent='暂无可展示的流转路线';
  }catch(e){$('#routeCount').textContent='连线暂不可用'}
}
fetch('production.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(d=>{if(!d||!d.items)return;productionRows=Object.entries(d.items).map(([key,origin])=>{const o=O.find(o=>o.k===key);return o&&o.m?{key,name:o.n,origin,kind:'产地',city:(o.ab?'美国 · ':'')+o.c,mus:o.m,era:o.e}:null}).filter(Boolean);renderProvenance()}).catch(()=>{});
refreshProvenance();
setInterval(()=>{if(!document.hidden)refreshProvenance()},5000);

return renderProvenance;
}
