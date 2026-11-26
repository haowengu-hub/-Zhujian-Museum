const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const periods=[['全时期',-4500,1911],['新石器',-4500,-1800],['先秦秦汉',-1800,220],['魏晋隋唐',220,960],['宋元',960,1368],['明',1368,1644],['清',1644,1911]];
let profiles=[],items=[],geo=null,period=0,kind='全部',year=null,selected='后石家河文化';
let detailSignature='',yearFrame=0;
try{const v=JSON.parse(sessionStorage.getItem('zj-culture-view')||'null');if(v){period=Math.max(0,Math.min(periods.length-1,+v.period||0));kind=['全部','考古文化','窑口','艺术群体'].includes(v.kind)?v.kind:'全部';year=Number.isFinite(v.year)?v.year:null;selected=String(v.selected||selected)}}catch{}
const yearText=y=>y===0?'公元前后':y<0?'公元前'+Math.abs(y)+'年':'公元'+y+'年';
const shortYear=y=>y===0?'公元前后':y<0?'前 '+Math.abs(y):String(y);
const matches=(o,p)=>(o.culture||'').split(/[、，,;；|]/).some(t=>[p.name,...p.aliases].includes(t.trim()));
function inWindow(p){const [,a,b]=periods[period];return p.start<=b&&p.end>=a&&(year===null||p.start<=year&&p.end>=year)&&(kind==='全部'||p.kind===kind)}
function currentProfiles(){return profiles.filter(inWindow)}
function choose(name){selected=name;render()}
function regionDecoration(p){return p.areas.map(([x,y,rx,ry])=>{const lx=x>760?x-88:x+34,ly=y-30;return `<ellipse cx="${x}" cy="${y}" rx="${rx*1.6}" ry="${ry*1.6}" fill="url(#cultureCore)"/><path class="leader" d="M${x} ${y} L${x+(lx>x?13:-13)} ${ly+6} H${lx}"/><text class="region-label" x="${lx}" y="${ly}">${esc(p.name)}</text>`}).join('')}
function regionMarkup(p){
 return p.areas.map(([x,y,rx,ry])=>{
  const active=p.name===selected;
  const lx=x>760?x-88:x+34,ly=y-30;
  // A soft core indicates an approximate region, without drawing a false boundary.
  const area=active?`<ellipse cx="${x}" cy="${y}" rx="${rx*1.6}" ry="${ry*1.6}" fill="url(#cultureCore)"/>`:'';
  const label=active?`<path class="leader" d="M${x} ${y} L${x+(lx>x?13:-13)} ${ly+6} H${lx}"/><text class="region-label" x="${lx}" y="${ly}">${esc(p.name)}</text>`:'';
  return `<g class="region${active?' selected':''}" data-name="${esc(p.name)}" role="button" tabindex="0" aria-label="${esc(p.name+'，'+p.region)}"><title>${esc(p.name+' · '+p.region)}</title><circle class="hit" cx="${x}" cy="${y}" r="12"/><circle class="lamp-halo" cx="${x}" cy="${y}" r="${active?12:7}" fill="url(#cultureLamp)"/><circle class="core" cx="${x}" cy="${y}" r="${active?1.8:1.2}"/></g>`;
 }).join('');
}
function renderDetail(p,visible){
 if(!p){$('#detail').innerHTML='<div class="empty">这个时段暂无可展示的文脉。<button data-reset="1">查看整段年代</button></div>';return}
 const related=items.filter(o=>matches(o,p)),rep=related.find(o=>o.image);
 const signature=p.name+'|'+related.map(o=>o.key+o.name+o.image).join('|');if(detailSignature===signature&&$('#detail h2'))return;detailSignature=signature;
 const keepOpen=new Set([...document.querySelectorAll('#detail details[open]')].map(d=>d.id));
 const photo=rep?`<figure class="specimen"><button data-key="${esc(rep.key)}" aria-label="查看${esc(rep.name)}"><img src="${esc(rep.image)}" alt="${esc(rep.name)}"></button><figcaption><span class="object-name">${esc(rep.name)}</span><span class="object-museum">${esc(rep.mus)}</span></figcaption></figure>`:'';
 const thumbs=related.filter(o=>o.image&&o!==rep).slice(0,5);
 const works=related.length?`<section class="works"><div class="works-head"><span>相关作品</span><b>${related.length}</b></div>${thumbs.length?`<div class="thumbs">${thumbs.map(o=>`<button data-key="${esc(o.key)}" title="${esc(o.name)}" aria-label="查看${esc(o.name)}"><img src="${esc(o.image)}" alt="" loading="lazy"></button>`).join('')}</div>`:''}${related.length>1?`<details id="relatedWorks" ${keepOpen.has('relatedWorks')?'open':''}><summary>全部作品名录</summary><div id="works" class="related-list">${related.map(o=>`<button data-key="${esc(o.key)}"><span>${esc(o.name)}</span><small>${esc(o.mus||'')}</small></button>`).join('')}</div></details>`:''}</section>`:'';
 $('#detail').innerHTML=`<div class="folio-nav"><span class="serial">${String(profiles.indexOf(p)+1).padStart(2,'0')}<small> / ${String(profiles.length).padStart(2,'0')}</small></span><button data-step="-1" aria-label="上一组文脉"><i>←</i>上一</button><button data-step="1" aria-label="下一组文脉">下一<i>→</i></button></div><span class="kind">${esc(p.kind)}</span><h2>${esc(p.name)}</h2><dl class="facts"><dt>年代</dt><dd>${esc(p.period)}</dd><dt>地域</dt><dd>${esc(p.region)}</dd></dl>${photo}${works}<details id="profileNotes" class="notes" ${keepOpen.has('profileNotes')?'open':''}><summary>说明与依据</summary>${p.intro?`<p>${esc(p.intro)}</p>`:''}${p.note?`<p>${esc(p.note)}</p>`:''}<p>图中光点表示核心区域、窑口产区或艺术活动中心，不代表精确历史边界。</p><p class="source"><a href="${esc(p.source)}" target="_blank" rel="noopener">年代与地域依据 ↗</a></p></details>`;
}
function niceTicks(a,b){const span=b-a,steps=[50,100,200,250,500,1000,2000],max=innerWidth<760?3:7;const st=steps.find(s=>span/s<=max)||2000;const out=[];for(let y=Math.ceil(a/st)*st;y<=b;y+=st)out.push(y);return out}
function render(){
 if(!geo)return;
 try{sessionStorage.setItem('zj-culture-view',JSON.stringify({period,kind,year,selected}))}catch{}
 const visible=currentProfiles();if(!visible.some(p=>p.name===selected))selected=visible[0]?.name||'';
 const p=profiles.find(p=>p.name===selected);
 $('#periods').innerHTML=periods.map((p,i)=>`<button aria-pressed="${period===i}" data-period="${i}">${p[0]}</button>`).join('');
 $('#filters').innerHTML=['全部','考古文化','窑口','艺术群体'].map(k=>`<button aria-pressed="${kind===k}" data-kind="${k}">${k}</button>`).join('');
 $('#status').textContent=`${visible.length} 组文脉 · ${items.filter(o=>visible.some(p=>matches(o,p))).length} 件作品`;
 $('#catalogCount').textContent=visible.length;
 $('#cultureList').innerHTML=visible.map(p=>`<button data-name="${esc(p.name)}" aria-pressed="${p.name===selected}">${esc(p.name)}${items.some(o=>matches(o,p))?`<small>${items.filter(o=>matches(o,p)).length}</small>`:''}</button>`).join('')||'<p>这个时段暂无文脉，可选择其他年代。</p>';
 // Selected marker comes last so nearby kiln locations do not obscure it.
 $('#regions').innerHTML=visible.filter(x=>x!==p).map(regionMarkup).join('')+(p?regionMarkup(p):'');
 $('#cultureFocus').innerHTML=p?regionDecoration(p):'';
 $('#mapPlace').textContent=p?.areas.length?p.region:p?'跨地域艺术群体，不划定单一范围':'选择时代，查看地域';
 renderDetail(p,visible);
 const [,a,b]=periods[period];$('#year').min=a;$('#year').max=b;$('#year').value=year??Math.round((a+b)/2);
 $('#yearLabel').textContent=year===null?periods[period][0]:shortYear(year);$('#year').setAttribute('aria-valuetext',year===null?'当前显示整段年代，移动滑块查看某一年':yearText(year));
 const tk=niceTicks(a,b);$('#scale').innerHTML=tk.map(y=>`<span style="left:${(y-a)/(b-a)*100}%">${shortYear(y)}</span>`).join('');$('#ticks').innerHTML=tk.map(y=>`<i style="left:${(y-a)/(b-a)*100}%"></i>`).join('');$('#axisName').textContent=p?p.name:'';$('#year').classList.toggle('idle',year===null);
 const l=p?Math.max(0,(p.start-a)/(b-a)*100):0,w=p?Math.max(0,(Math.min(b,p.end)-Math.max(a,p.start))/(b-a)*100):0;
 $('#axisBand').style.left=l+'%';$('#axisBand').style.width=w+'%';$('#axisBand').hidden=!p||w<=0;$('#axisBand').classList.toggle('flip',l>70);
 const tracks=profiles.filter(p=>p.start<=b&&p.end>=a&&(kind==='全部'||kind===p.kind));
 $('#tracks').innerHTML=tracks.map(p=>`<div class="track ${p.name===selected?'selected':''}"><button data-name="${esc(p.name)}">${esc(p.name)}</button><div class="lane"><button class="bar" data-name="${esc(p.name)}" aria-label="${esc(p.name+'：'+p.period)}" title="${esc(p.period)}" style="left:${Math.max(0,(p.start-a)/(b-a)*100)}%;width:${(Math.min(b,p.end)-Math.max(a,p.start))/(b-a)*100}%"></button></div></div>`).join('');
}
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-name],[data-period],[data-kind],[data-key],[data-step],[data-reset]');if(!el)return;
 if(el.dataset.period!==undefined){period=+el.dataset.period;year=null;render()}
 else if(el.dataset.kind){kind=el.dataset.kind;render()}
 else if(el.dataset.name){const p=profiles.find(p=>p.name===el.dataset.name);if(year!==null&&(year<p.start||year>p.end))year=null;choose(p.name);document.querySelectorAll('.more-controls details').forEach(d=>d.open=false)}
 else if(el.dataset.key){parent.postMessage({zjCultureOpen:el.dataset.key},location.origin)}
 else if(el.dataset.step){const ps=currentProfiles(),i=ps.findIndex(p=>p.name===selected);if(ps.length)choose(ps[(i+ +el.dataset.step+ps.length)%ps.length].name)}
 else if(el.dataset.reset){year=null;render()}
});
function previewCulture(name){const p=profiles.find(p=>p.name===name);if(!p)return;document.querySelectorAll('#regions .region').forEach(g=>g.classList.toggle('selected',g.dataset.name===name));$('#cultureFocus').innerHTML=regionDecoration(p);$('#mapPlace').textContent=p.areas.length?p.region:'跨地域艺术群体，不划定单一范围';renderDetail(p,currentProfiles())}
let hoveredName='';
function nearestMapProfile(e){const svg=$('#map'),m=svg.getScreenCTM();if(!m)return null;const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const at=p.matrixTransform(m.inverse());let best=null,distance=24;for(const profile of currentProfiles()){for(const [x,y] of profile.areas){const d=Math.hypot(x-at.x,y-at.y);if(d<distance){distance=d;best=profile.name}}}return best}
$('#map').addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const name=nearestMapProfile(e)||'';if(name===hoveredName)return;hoveredName=name;previewCulture(name||selected)});
$('#map').addEventListener('pointerleave',()=>{hoveredName='';if(selected)previewCulture(selected)});
$('#map').addEventListener('click',e=>{const name=nearestMapProfile(e);if(name){e.preventDefault();e.stopPropagation();choose(name)}});
$('#map').addEventListener('focusin',e=>{const g=e.target.closest('[data-name]');if(g)previewCulture(g.dataset.name)});
$('#map').addEventListener('keydown',e=>{const g=e.target.closest('[data-name]');if(g&&['Enter',' '].includes(e.key)){e.preventDefault();choose(g.dataset.name);$('#regions .selected')?.focus({preventScroll:true})}});
$('#year').addEventListener('input',e=>{year=+e.target.value;$('#yearLabel').textContent=shortYear(year);if(!yearFrame)yearFrame=requestAnimationFrame(()=>{yearFrame=0;render()})});$('#allTime').onclick=()=>{year=null;render()};
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.more-controls details[open]').forEach(d=>d.open=false)});
document.querySelectorAll('.more-controls details').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)document.querySelectorAll('.more-controls details').forEach(other=>{if(other!==d)other.open=false})}));
async function refreshItems(){
 try{const r=await fetch('culture-items.json',{cache:'no-store'});if(!r.ok)throw Error();const d=await r.json();if(JSON.stringify(d.items)!==JSON.stringify(items)){items=d.items;render()}}
 catch{if(geo)$('#status').textContent='作品暂时无法加载'}
}
async function loadAtlas(){
 try{
  const results=await Promise.all(['culture-profiles.json','culture-geography.json','culture-items.json'].map(async path=>{const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw Error(path);return r.json()}));
  [profiles,geo]=results;items=results[2].items;const d=geo.prov.map(p=>p.d).join('');
  const rivers=(geo.rivers||[]).map(r=>`<path class="river${r.r<=1?' major':''}" d="${r.d}"/>`).join('');
  const marks=geo.marks?['黄河','长江'].filter(k=>geo.marks[k]).map(k=>`<text class="water-label" x="${geo.marks[k][0]}" y="${geo.marks[k][1]}">${k}</text>`).join('')+['东海','黄海','南海','渤海'].filter(k=>geo.marks[k]).map(k=>`<text class="sea-label" x="${geo.marks[k][0]}" y="${geo.marks[k][1]}">${k}</text>`).join(''):'';
  $('#map').innerHTML=`<defs><clipPath id="cultureLand"><path d="${d}"/></clipPath><radialGradient id="cultureLamp"><stop stop-color="#ffe6c2" stop-opacity=".55"/><stop offset=".3" stop-color="#ffe6c2" stop-opacity=".2"/><stop offset="1" stop-color="#ffe6c2" stop-opacity="0"/></radialGradient><radialGradient id="cultureCore"><stop stop-color="#c6a46c" stop-opacity=".3"/><stop offset=".45" stop-color="#c6a46c" stop-opacity=".12"/><stop offset="1" stop-color="#c6a46c" stop-opacity="0"/></radialGradient><linearGradient id="landTone" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1c1915"/><stop offset=".6" stop-color="#211d17"/><stop offset="1" stop-color="#26211a"/></linearGradient></defs>${geo.grat?`<path class="grat" d="${geo.grat}"/>`:''}${geo.nb?`<path class="nb" d="${geo.nb}"/>`:''}<path class="coast" d="${d}"/><path class="land" d="${d}"/><image class="terrain" href="shade.webp" width="${geo.W}" height="${geo.H}" clip-path="url(#cultureLand)" preserveAspectRatio="none"/><path class="prov" d="${d}"/><g clip-path="url(#cultureLand)">${geo.lakes?`<path class="lake" d="${geo.lakes}"/>`:''}${rivers}</g>${marks}<g id="regions"></g><g id="cultureFocus" style="pointer-events:none"></g>`;
  render();
 }catch{$('#status').textContent='图谱暂未加载';$('#detail').innerHTML='<div class="empty">图谱暂时无法加载。<button id="retryLoad">重新加载</button></div>';$('#retryLoad').onclick=loadAtlas}
}
loadAtlas();setInterval(()=>{if(!document.hidden&&geo)refreshItems()},5000);
