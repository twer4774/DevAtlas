import type { Node, Edge as RFEdge } from '@xyflow/react'
import type { ArchitectureNode } from '@/types'

// Mirrors constants.ts — duplicated here so the generated HTML is self-contained
const TYPE_COLORS: Record<string, string> = {
  service: '#6366f1', backend: '#6366f1', api: '#8b5cf6',
  frontend: '#3b82f6', database: '#06b6d4', storage: '#14b8a6',
  broker: '#f59e0b', queue: '#f97316', function: '#10b981',
  worker: '#84cc16', cache: '#06b6d4', 'cloud-service': '#60a5fa',
  'auth-service': '#f43f5e', device: '#a78bfa', 'device-planned': '#a78bfa',
  gateway: '#fb923c', network: '#94a3b8',
  Program: '#a78bfa', Capability: '#f43f5e', Feature: '#fbbf24',
  Policy: '#34d399', External: '#94a3b8',
}

const TYPE_LABELS: Record<string, string> = {
  service: 'Service', backend: 'Backend', api: 'API', frontend: 'Frontend',
  database: 'Database', storage: 'Storage', broker: 'Message Broker',
  queue: 'Queue', function: 'Function', worker: 'Worker', cache: 'Cache',
  'cloud-service': 'Cloud Service', 'auth-service': 'Auth Service',
  device: 'Device', 'device-planned': 'Device (Planned)',
  gateway: 'Gateway', network: 'Network',
  Program: 'Program', Capability: 'Capability', Feature: 'Feature',
  Policy: 'Policy', External: 'External',
}

const GROUP_COLORS = ['#60a5fa', '#a78bfa', '#4ade80', '#fb923c', '#9ca3af']

const STATUS_COLORS: Record<string, string> = {
  live: '#22c55e', future: '#3b82f6', deprecated: '#f59e0b', removed: '#ef4444',
}

function esc(s: unknown): string {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

interface NodeInfo {
  id: string; type: string
  x: number; y: number; w: number; h: number
  nodeType: string; title: string
  description?: string; status?: string; colorIdx: number
}

interface EdgeInfo {
  id: string; source: string; target: string
  label?: string; stroke: string; parallelOffset?: number
}

export function generateExportHtml(
  rfNodes: Node[],
  rfEdges: RFEdge[],
  title = 'Architecture Map',
): string {
  const NODE_W = 210

  const nodeInfos: NodeInfo[] = rfNodes.map(n => {
    const archNode = (n.data as { node?: ArchitectureNode }).node
    const meta = (archNode?.metadata_ ?? {}) as Record<string, unknown>
    const isGroup = n.type === 'groupArea'
    const w = isGroup
      ? ((n.style?.width as number) ?? (meta.width as number) ?? 400)
      : NODE_W
    const h = isGroup
      ? ((n.style?.height as number) ?? (meta.height as number) ?? 280)
      : (n.measured?.height ?? 120)
    return {
      id: n.id, type: n.type ?? 'archNode',
      x: n.position.x, y: n.position.y, w, h,
      nodeType: archNode?.type ?? '',
      title: archNode?.title ?? '',
      description: meta.description as string | undefined,
      status: meta.status as string | undefined,
      colorIdx: (meta.colorIdx as number) ?? 0,
    }
  })

  const edgeInfos: EdgeInfo[] = rfEdges.map(e => {
    const d = (e.data ?? {}) as Record<string, unknown>
    return {
      id: e.id, source: e.source, target: e.target,
      label: e.label as string | undefined,
      stroke: (d.stroke as string) ?? (e.style?.stroke as string) ?? '#374151',
      parallelOffset: d.parallelOffset as number | undefined,
    }
  })

  const pad = 100
  const all = nodeInfos.length ? nodeInfos : [{ x: 0, y: 0, w: 800, h: 600 } as NodeInfo]
  const bbox = {
    minX: Math.min(...all.map(n => n.x)) - pad,
    minY: Math.min(...all.map(n => n.y)) - pad,
    maxX: Math.max(...all.map(n => n.x + n.w)) + pad,
    maxY: Math.max(...all.map(n => n.y + n.h)) + pad,
  }

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow:hidden;background:#030810;color:#e5e7eb;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
#wrap{position:relative;width:100vw;height:100vh;overflow:hidden;cursor:grab;user-select:none}
#wrap.dragging{cursor:grabbing}
#svg-layer{position:absolute;inset:0;width:100%;height:100%}
#html-layer{position:absolute;top:0;left:0;transform-origin:0 0;pointer-events:none}
.node-card{
  position:absolute;width:210px;border-radius:12px;overflow:hidden;
  cursor:pointer;transition:opacity .2s,box-shadow .15s;
  box-shadow:0 4px 20px rgba(0,0,0,.4);pointer-events:auto}
.node-card:hover{opacity:1!important;z-index:10;position:absolute}
.node-card.dimmed{opacity:.45}
.accent{height:2px}
.card-header{display:flex;align-items:center;gap:8px;padding:9px 12px 4px}
.icon-badge{display:flex;align-items:center;justify-content:center;
  width:26px;height:26px;border-radius:7px;flex-shrink:0;
  font-size:11px;font-weight:700;letter-spacing:.04em}
.type-lbl{font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
  flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.card-body{padding:0 12px 10px}
.node-ttl{font-size:13px;font-weight:700;color:#f9fafb;line-height:1.35;margin-bottom:3px;
  overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.node-dsc{font-size:10px;color:#6b7280;line-height:1.5;margin-top:2px;
  overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.status-pill{display:inline-block;font-size:9px;font-weight:600;
  padding:1px 7px;border-radius:10px;margin-top:5px}

#panel{position:fixed;right:0;top:0;width:290px;height:100%;
  background:rgba(7,12,24,.97);border-left:1px solid #1f2937;
  padding:28px 18px 18px;display:none;flex-direction:column;gap:14px;
  overflow-y:auto;z-index:200;backdrop-filter:blur(14px)}
#panel.open{display:flex}
.p-x{position:absolute;top:12px;right:14px;background:none;border:none;
  color:#6b7280;cursor:pointer;font-size:18px;line-height:1}
.p-x:hover{color:#e5e7eb}
.p-badge{display:inline-block;font-size:10px;font-weight:700;text-transform:uppercase;
  letter-spacing:.08em;padding:2px 8px;border-radius:4px;margin-bottom:6px}
.p-title{font-size:17px;font-weight:700;color:#f9fafb;line-height:1.3}
.p-desc{font-size:13px;color:#9ca3af;line-height:1.6}
.p-sec{font-size:10px;font-weight:600;text-transform:uppercase;
  letter-spacing:.08em;color:#4b5563;margin:14px 0 6px}
.p-conn{display:flex;align-items:center;gap:8px;padding:6px 0;
  border-bottom:1px solid #111827}
.p-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.p-cname{font-size:12px;color:#d1d5db}
.p-tag{display:inline-block;font-size:11px;padding:2px 8px;
  border-radius:10px;margin:2px}

#hud{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);
  display:flex;align-items:center;gap:8px;
  background:rgba(17,24,39,.95);border:1px solid #374151;
  border-radius:999px;padding:6px 16px;font-size:12px;color:#9ca3af;
  z-index:100;backdrop-filter:blur(8px);white-space:nowrap}
.hsep{width:1px;height:14px;background:#374151}
#hud button{background:none;border:none;color:#9ca3af;cursor:pointer;
  padding:2px 8px;border-radius:4px;font-size:12px}
#hud button:hover{background:rgba(255,255,255,.08);color:#e5e7eb}
.htitle{color:#e5e7eb;font-weight:600}
.hbadge{background:rgba(255,255,255,.06);border-radius:4px;padding:1px 6px;
  font-size:10px;color:#6b7280}

#elabel{position:absolute;pointer-events:none;font-size:10px;font-weight:500;
  border-radius:4px;padding:2px 6px;display:none;z-index:80;
  transform:translate(-50%,-120%)}
</style>
</head>
<body>
<div id="wrap">
  <svg id="svg-layer">
    <defs>
      <radialGradient id="rg" cx="50%" cy="35%" r="70%">
        <stop offset="0%" stop-color="#0c1929"/>
        <stop offset="100%" stop-color="#030810"/>
      </radialGradient>
      <pattern id="grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
        <line x1="16" y1="12" x2="16" y2="20" stroke="#162032" stroke-width="1"/>
        <line x1="12" y1="16" x2="20" y2="16" stroke="#162032" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#rg)"/>
    <rect id="grid-bg" width="100%" height="100%" fill="url(#grid)"/>
    <g id="svg-vp">
      <g id="groups-g"></g>
      <g id="edges-g"></g>
    </g>
  </svg>
  <div id="html-layer"></div>
  <div id="elabel"></div>
</div>

<div id="panel">
  <button class="p-x" id="p-close">✕</button>
  <div id="p-body"></div>
</div>

<div id="hud">
  <span class="htitle">${esc(title)}</span>
  <div class="hsep"></div>
  <span class="hbadge">${nodeInfos.filter(n => n.type === 'archNode').length} nodes</span>
  <div class="hsep"></div>
  <button id="btn-fit">전체 보기</button>
  <div class="hsep"></div>
  <span id="zdsp">100%</span>
</div>

<script>
(function(){
const NODES=${JSON.stringify(nodeInfos)};
const EDGES=${JSON.stringify(edgeInfos)};
const GC=${JSON.stringify(GROUP_COLORS)};
const TC=${JSON.stringify(TYPE_COLORS)};
const TL=${JSON.stringify(TYPE_LABELS)};
const SC=${JSON.stringify(STATUS_COLORS)};
const BBOX=${JSON.stringify(bbox)};

let T={x:0,y:0,s:1},drag=false,dp={mx:0,my:0,tx:0,ty:0},selId=null;

const wrap=document.getElementById('wrap');
const svgVp=document.getElementById('svg-vp');
const hl=document.getElementById('html-layer');
const gg=document.getElementById('groups-g');
const eg=document.getElementById('edges-g');
const gridPat=document.getElementById('grid');
const zdsp=document.getElementById('zdsp');
const panel=document.getElementById('panel');
const pbody=document.getElementById('p-body');
const elabel=document.getElementById('elabel');

function applyT(){
  svgVp.setAttribute('transform','translate('+T.x+','+T.y+') scale('+T.s+')');
  hl.style.transform='translate('+T.x+'px,'+T.y+'px) scale('+T.s+')';
  gridPat.setAttribute('patternTransform','translate('+(T.x%32)+','+(T.y%32)+') scale('+T.s+')');
  zdsp.textContent=Math.round(T.s*100)+'%';
}

function svgE(tag,attrs){
  const el=document.createElementNS('http://www.w3.org/2000/svg',tag);
  for(const[k,v]of Object.entries(attrs))if(v!=null)el.setAttribute(k,String(v));
  return el;
}

function esc(s){
  if(s==null)return'';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function nodeById(id){return NODES.find(n=>n.id===id)}

function handles(node){
  const h=node.h||120;
  return{r:{x:node.x+node.w,y:node.y+h/2},l:{x:node.x,y:node.y+h/2}};
}

function bezier(sx,sy,tx,ty,off){
  off=off||0;
  const dx=Math.abs(tx-sx),c=0.25;
  const cp1x=sx+dx*c,cp2x=tx-dx*c;
  const vx=tx-sx,vy=ty-sy,len=Math.sqrt(vx*vx+vy*vy)||1;
  const ox=(-vy/len)*off,oy=(vx/len)*off;
  return'M '+sx+','+sy+' C '+(cp1x+ox)+','+(sy+oy)+' '+(cp2x+ox)+','+(ty+oy)+' '+tx+','+ty;
}

// Groups
function renderGroups(){
  gg.innerHTML='';
  NODES.filter(n=>n.type==='groupArea').forEach(n=>{
    const color=GC[n.colorIdx%GC.length]||'#6b7280';
    const g=svgE('g',{});
    g.appendChild(svgE('rect',{x:n.x,y:n.y,width:n.w,height:n.h,rx:16,
      fill:color+'12',stroke:color+'44','stroke-width':1}));
    g.appendChild(svgE('rect',{x:n.x,y:n.y,width:n.w*0.45,height:2,rx:1,fill:color+'88'}));
    const t=svgE('text',{x:n.x+30,y:n.y+22,fill:color,'font-size':11,'font-weight':700,'font-family':'system-ui,sans-serif'});
    t.textContent=n.title;
    g.appendChild(t);
    gg.appendChild(g);
  });
}

// Edges
function renderEdges(){
  const defs=document.querySelector('defs');
  EDGES.forEach(e=>{
    const mid='m'+e.id.replace(/[^a-z0-9]/gi,'_');
    if(!document.getElementById(mid)){
      const m=svgE('marker',{id:mid,markerWidth:10,markerHeight:7,refX:9,refY:3.5,orient:'auto'});
      const p=svgE('path',{d:'M0,0 L0,7 L10,3.5 z',fill:e.stroke});
      m.appendChild(p);defs.appendChild(m);
    }
  });
  eg.innerHTML='';
  EDGES.forEach(e=>{
    const src=nodeById(e.source),tgt=nodeById(e.target);
    if(!src||!tgt)return;
    const sh=handles(src),th=handles(tgt);
    const d=bezier(sh.r.x,sh.r.y,th.l.x,th.l.y,e.parallelOffset||0);
    const mid='m'+e.id.replace(/[^a-z0-9]/gi,'_');
    const g=svgE('g',{});
    const path=svgE('path',{d,fill:'none',stroke:e.stroke,'stroke-width':1.5,
      opacity:.4,'marker-end':'url(#'+mid+')','data-eid':e.id,class:'ep',
      style:'pointer-events:none'});
    g.appendChild(path);
    // wider hit area
    const hit=svgE('path',{d,fill:'none',stroke:'transparent','stroke-width':14,
      style:'cursor:pointer;pointer-events:stroke'});
    hit.addEventListener('mouseenter',()=>{
      path.setAttribute('opacity','1');
      path.setAttribute('stroke-width','2.5');
      if(e.label){
        const mx=(sh.r.x+th.l.x)/2*T.s+T.x;
        const my=(sh.r.y+th.l.y)/2*T.s+T.y;
        elabel.textContent=e.label;
        elabel.style.cssText='display:block;left:'+mx+'px;top:'+my+'px;position:absolute;'+
          'background:rgba(17,24,39,.92);border:1px solid '+e.stroke+'44;color:'+e.stroke+';'+
          'font-size:10px;font-weight:500;border-radius:4px;padding:2px 6px;'+
          'z-index:80;transform:translate(-50%,-120%);pointer-events:none';
      }
    });
    hit.addEventListener('mouseleave',()=>{
      path.setAttribute('opacity',selId?'0.06':'0.4');
      path.setAttribute('stroke-width','1.5');
      elabel.style.display='none';
    });
    g.appendChild(hit);
    eg.appendChild(g);
  });
}

// Nodes (HTML cards)
function renderNodes(){
  hl.innerHTML='';
  NODES.filter(n=>n.type==='archNode').forEach(n=>{
    const color=TC[n.nodeType]||'#6b7280';
    const label=TL[n.nodeType]||n.nodeType||'?';
    const card=document.createElement('div');
    card.className='node-card';
    card.dataset.id=n.id;
    card.style.cssText='left:'+n.x+'px;top:'+n.y+'px;'+
      'background:linear-gradient(145deg,'+color+'12 0%,#0d1117 55%);'+
      'border:1px solid '+color+'22';
    const statusHtml=n.status&&SC[n.status]
      ?'<div class="status-pill" style="background:'+SC[n.status]+'20;color:'+SC[n.status]+';border:1px solid '+SC[n.status]+'40">'+esc(n.status)+'</div>'
      :'';
    card.innerHTML=
      '<div class="accent" style="background:linear-gradient(90deg,'+color+'cc,'+color+'00)"></div>'+
      '<div class="card-header">'+
        '<div class="icon-badge" style="background:'+color+'20;border:1px solid '+color+'40;color:'+color+'">'+
          esc(label.slice(0,2))+
        '</div>'+
        '<span class="type-lbl" style="color:'+color+'bb">'+esc(label)+'</span>'+
      '</div>'+
      '<div class="card-body">'+
        '<div class="node-ttl">'+esc(n.title)+'</div>'+
        (n.description?'<div class="node-dsc">'+esc(n.description)+'</div>':'')+
        statusHtml+
      '</div>';
    card.addEventListener('click',ev=>{ev.stopPropagation();selectNode(n.id)});
    hl.appendChild(card);
  });
}

function selectNode(id){
  selId=id;
  const node=NODES.find(n=>n.id===id);
  if(!node)return;
  const color=TC[node.nodeType]||'#6b7280';
  document.querySelectorAll('.node-card').forEach(el=>{
    const nid=el.dataset.id;
    if(nid===id){
      el.classList.remove('dimmed');
      el.style.border='1.5px solid '+color+'99';
      el.style.boxShadow='0 0 0 1px '+color+'44,0 0 24px '+color+'44,0 8px 32px rgba(0,0,0,.5)';
    } else {
      el.classList.add('dimmed');
      el.style.border='';el.style.boxShadow='';
    }
  });
  document.querySelectorAll('.ep').forEach(el=>{
    const eid=el.getAttribute('data-eid');
    const edge=EDGES.find(e=>e.id===eid);
    const connected=edge&&(edge.source===id||edge.target===id);
    el.setAttribute('opacity',connected?'0.9':'0.06');
    el.setAttribute('stroke-width',connected?'2':'1.5');
  });
  showPanel(node);
}

function closePanel(){
  selId=null;
  panel.classList.remove('open');
  document.querySelectorAll('.node-card').forEach(el=>{
    el.classList.remove('dimmed');el.style.border='';el.style.boxShadow='';
  });
  document.querySelectorAll('.ep').forEach(el=>{
    el.setAttribute('opacity','0.4');el.setAttribute('stroke-width','1.5');
  });
}

function showPanel(node){
  const color=TC[node.nodeType]||'#6b7280';
  const label=TL[node.nodeType]||node.nodeType||'';
  const connEdges=EDGES.filter(e=>e.source===node.id||e.target===node.id);
  const connIds=[...new Set(connEdges.flatMap(e=>[e.source,e.target]).filter(id=>id!==node.id))];
  const connNodes=connIds.map(id=>nodeById(id)).filter(Boolean);
  const statusHtml=node.status&&SC[node.status]
    ?'<span class="p-tag" style="background:'+SC[node.status]+'20;color:'+SC[node.status]+';border:1px solid '+SC[node.status]+'33">'+esc(node.status)+'</span>'
    :'';
  const connsHtml=connNodes.length
    ?'<div class="p-sec">연결된 노드 ('+connNodes.length+')</div>'+
      connNodes.map(cn=>{
        const cc=TC[cn.nodeType]||'#6b7280';
        return'<div class="p-conn"><div class="p-dot" style="background:'+cc+'"></div><span class="p-cname">'+esc(cn.title)+'</span></div>';
      }).join('')
    :'';
  const uniqueLabels=[...new Set(connEdges.filter(e=>e.label).map(e=>e.id+':'+e.label+':'+e.stroke))];
  const tagsHtml=uniqueLabels.length
    ?'<div class="p-sec">관계 타입</div>'+
      uniqueLabels.map(s=>{
        const[,lbl,sc]=s.split(':');
        return'<span class="p-tag" style="background:'+sc+'20;color:'+sc+';border:1px solid '+sc+'33">'+esc(lbl)+'</span>';
      }).join('')
    :'';
  pbody.innerHTML=
    '<span class="p-badge" style="background:'+color+'20;color:'+color+';border:1px solid '+color+'30">'+esc(label)+'</span>'+
    (statusHtml?'&nbsp;'+statusHtml:'')+
    '<div class="p-title">'+esc(node.title)+'</div>'+
    (node.description?'<div class="p-desc">'+esc(node.description)+'</div>':'')+
    connsHtml+tagsHtml;
  panel.classList.add('open');
}

// Pan/Zoom
wrap.addEventListener('mousedown',e=>{
  if(e.target.closest('.node-card'))return;
  drag=true;dp={mx:e.clientX,my:e.clientY,tx:T.x,ty:T.y};
  wrap.classList.add('dragging');
});
window.addEventListener('mousemove',e=>{
  if(!drag)return;
  T.x=dp.tx+(e.clientX-dp.mx);T.y=dp.ty+(e.clientY-dp.my);applyT();
});
window.addEventListener('mouseup',()=>{drag=false;wrap.classList.remove('dragging')});
wrap.addEventListener('wheel',e=>{
  e.preventDefault();
  const f=e.deltaY>0?.9:1.1;
  const r=wrap.getBoundingClientRect();
  const mx=e.clientX-r.left,my=e.clientY-r.top;
  const ns=Math.max(.05,Math.min(3,T.s*f)),ratio=ns/T.s;
  T.x=mx-ratio*(mx-T.x);T.y=my-ratio*(my-T.y);T.s=ns;applyT();
},{passive:false});
wrap.addEventListener('click',e=>{
  if(!e.target.closest('.node-card')&&!e.target.closest('#panel'))closePanel();
});
document.getElementById('p-close').addEventListener('click',closePanel);

function fitView(){
  const vw=wrap.clientWidth,vh=wrap.clientHeight;
  const bw=BBOX.maxX-BBOX.minX,bh=BBOX.maxY-BBOX.minY;
  if(!bw||!bh)return;
  const s=Math.min(vw/bw,vh/bh)*.88;
  T.s=s;T.x=(vw-bw*s)/2-BBOX.minX*s;T.y=(vh-bh*s)/2-BBOX.minY*s;applyT();
}
document.getElementById('btn-fit').addEventListener('click',fitView);

renderGroups();renderEdges();renderNodes();fitView();
})();
</script>
</body>
</html>`
}
