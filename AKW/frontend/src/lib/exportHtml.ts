import type { Node, Edge as RFEdge } from '@xyflow/react'
import type { ArchitectureNode, Document } from '@/types'

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
  'cloud-service': 'Cloud', 'auth-service': 'Auth', device: 'Device',
  'device-planned': 'Device', gateway: 'Gateway', network: 'Network',
  Program: 'Program', Capability: 'Capability', Feature: 'Feature',
  Policy: 'Policy', External: 'External',
}

// Short 2-3 letter badges for the icon area
const TYPE_ICONS: Record<string, string> = {
  service: 'SVC', backend: 'SVC', api: 'API', frontend: 'FE',
  database: 'DB', storage: 'STG', broker: 'MQ', queue: 'QUE',
  function: 'FN', worker: 'WK', cache: 'C', 'cloud-service': 'CSP',
  'auth-service': 'AUTH', device: 'DEV', 'device-planned': 'DEV',
  gateway: 'GW', network: 'NET',
  Program: 'PGM', Capability: 'CAP', Feature: 'FTR', Policy: 'POL', External: 'EXT',
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
  // absolute positions (child nodes converted from relative)
  x: number; y: number; w: number; h: number
  nodeType: string; title: string
  description?: string; status?: string
  colorIdx: number; hasChildren: boolean
}

interface EdgeInfo {
  id: string; source: string; target: string
  label?: string; stroke: string; parallelOffset?: number
}

interface DocInfo {
  id: string; title: string; type: string; linkedNodeIds: string[]; content: string | null
}

export function generateExportHtml(
  rfNodes: Node[],
  rfEdges: RFEdge[],
  docs: (Document & { content: string | null })[] = [],
  title = 'Architecture Map',
): string {
  const NODE_W = 210
  const NODE_H_BASE = 110
  const DESC_H = 20
  const ACTION_H = 28

  // ── Compute absolute positions for all nodes ──────────────────────────────
  // Nodes inside a groupArea have parentId set → position is relative to parent.
  // We need absolute positions for the HTML canvas.
  const posMap = new Map<string, { x: number; y: number }>()

  // First pass: nodes without a parent (absolute positions)
  rfNodes.forEach(n => {
    if (!n.parentId) posMap.set(n.id, n.position)
  })
  // Second pass: nodes with a parent (add parent's absolute position)
  rfNodes.forEach(n => {
    if (n.parentId) {
      const parentPos = posMap.get(n.parentId) ?? { x: 0, y: 0 }
      posMap.set(n.id, {
        x: parentPos.x + n.position.x,
        y: parentPos.y + n.position.y,
      })
    }
  })

  const nodeInfos: NodeInfo[] = rfNodes.map(n => {
    const archNode = (n.data as { node?: ArchitectureNode }).node
    const meta = (archNode?.metadata_ ?? {}) as Record<string, unknown>
    const isGroup = n.type === 'groupArea'
    const absPos = posMap.get(n.id) ?? n.position

    const w = isGroup
      ? ((n.style?.width as number) ?? (meta.width as number) ?? 500)
      : NODE_W

    const hasChildren = Boolean((n.data as Record<string, unknown>).hasChildren)
    const estimatedH = NODE_H_BASE
      + (meta.description ? DESC_H : 0)
      + (hasChildren ? ACTION_H : 0)

    const h = isGroup
      ? ((n.style?.height as number) ?? (meta.height as number) ?? 380)
      : (n.measured?.height ?? estimatedH)

    return {
      id: n.id, type: n.type ?? 'archNode',
      x: absPos.x, y: absPos.y, w, h,
      nodeType: archNode?.type ?? '',
      title: archNode?.title ?? '',
      description: meta.description as string | undefined,
      status: meta.status as string | undefined,
      colorIdx: (meta.colorIdx as number) ?? 0,
      hasChildren,
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

  const pad = 120
  const all = nodeInfos.length ? nodeInfos : [{ x: 0, y: 0, w: 800, h: 600 } as NodeInfo]
  const bbox = {
    minX: Math.min(...all.map(n => n.x)) - pad,
    minY: Math.min(...all.map(n => n.y)) - pad,
    maxX: Math.max(...all.map(n => n.x + n.w)) + pad,
    maxY: Math.max(...all.map(n => n.y + n.h)) + pad,
  }

  const docInfos: DocInfo[] = docs.map(d => ({
    id: d.id, title: d.title, type: d.type,
    linkedNodeIds: d.linked_node_ids, content: d.content,
  }))

  const archCount = nodeInfos.filter(n => n.type === 'archNode').length

  // Prevent </script> inside user-generated content from closing the script tag.
  // JSON-encoding a forward-slash with \/ is valid JSON and won't be parsed as </script>.
  const sj = (obj: unknown): string =>
    JSON.stringify(obj).replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--')

  // String.raw preserves \n, \d, \s etc. so regex escapes survive template-literal embedding.
  const renderMdFn = String.raw`function renderMd(md){
  if(!md)return'';
  var blocks=[];
  md=md.replace(/\x60\x60\x60([\s\S]*?)\x60\x60\x60/g,function(_,c){
    var idx=blocks.length;
    blocks.push('<pre><code>'+e(c.trim())+'</code></pre>');
    return'\x01'+idx+'\x01';
  });
  md=md.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  md=md.replace(/\x60([^\x60\n]+)\x60/g,'<code>$1</code>');
  md=md.replace(/\*\*\*([^*]+)\*\*\*/g,'<strong><em>$1</em></strong>');
  md=md.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  md=md.replace(/\*([^*\n]+)\*/g,'<em>$1</em>');
  md=md.replace(/^### (.+)$/gm,'<h3>$1</h3>');
  md=md.replace(/^## (.+)$/gm,'<h2>$1</h2>');
  md=md.replace(/^# (.+)$/gm,'<h1>$1</h1>');
  md=md.replace(/^---$/gm,'<hr>');
  md=md.replace(/^> (.+)$/gm,'<blockquote>$1</blockquote>');
  md=md.replace(/((?:^[ \t]*[-*] .+\n?)+)/gm,function(m){return'<ul>'+m.replace(/^[ \t]*[-*] (.+)$/gm,'<li>$1</li>')+'</ul>';});
  md=md.replace(/((?:^\d+\. .+\n?)+)/gm,function(m){return'<ol>'+m.replace(/^\d+\. (.+)$/gm,'<li>$1</li>')+'</ol>';});
  md=md.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank">$1</a>');
  md=md.split(/\n\n+/).map(function(p){
    p=p.trim();
    if(!p||/^(<(h[1-6]|ul|ol|pre|hr|blockquote)|\x01)/.test(p))return p;
    return'<p>'+p.replace(/\n/g,'<br>')+'</p>';
  }).join('\n');
  md=md.replace(/\x01(\d+)\x01/g,function(_,i){return blocks[+i];});
  return md;
}`

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

/* Node cards */
.nc{
  position:absolute;width:210px;border-radius:12px;overflow:hidden;
  cursor:pointer;pointer-events:auto;
  transition:opacity .2s,box-shadow .15s;
  box-shadow:0 4px 24px rgba(0,0,0,.5)}
.nc:hover{opacity:1!important;z-index:20}
.nc.dimmed{opacity:.45}
.nc-accent{height:2px;flex-shrink:0}
.nc-head{display:flex;align-items:center;gap:8px;padding:8px 10px 3px}
.nc-icon{display:flex;align-items:center;justify-content:center;
  width:28px;height:28px;border-radius:7px;flex-shrink:0;
  font-size:9px;font-weight:800;letter-spacing:.03em;line-height:1}
.nc-type{font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
  flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nc-body{padding:2px 10px 10px}
.nc-title{font-size:13px;font-weight:700;color:#f9fafb;line-height:1.35;
  overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.nc-desc{font-size:10px;color:#6b7280;line-height:1.5;margin-top:3px;
  overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.nc-status{display:inline-block;font-size:9px;font-weight:600;
  padding:1px 7px;border-radius:10px;margin-top:5px}
.nc-expand{display:flex;align-items:center;gap:4px;
  font-size:11px;font-weight:600;padding:4px 8px;border-radius:6px;
  margin:0 10px 8px;color:rgba(255,255,255,.6);
  background:rgba(255,255,255,.05)}

/* Detail panel */
#panel{position:fixed;right:0;top:0;width:290px;height:100%;
  background:rgba(7,12,24,.97);border-left:1px solid #1e2d3d;
  padding:28px 18px 18px;display:none;flex-direction:column;gap:14px;
  overflow-y:auto;z-index:200;backdrop-filter:blur(14px)}
#panel.open{display:flex}
.px{position:absolute;top:12px;right:14px;background:none;border:none;
  color:#6b7280;cursor:pointer;font-size:18px;line-height:1;padding:4px}
.px:hover{color:#e5e7eb}
.p-badge{display:inline-block;font-size:10px;font-weight:700;text-transform:uppercase;
  letter-spacing:.08em;padding:2px 8px;border-radius:4px}
.p-title{font-size:17px;font-weight:700;color:#f9fafb;line-height:1.3;margin-top:6px}
.p-desc{font-size:13px;color:#9ca3af;line-height:1.65}
.p-sec{font-size:10px;font-weight:600;text-transform:uppercase;
  letter-spacing:.08em;color:#4b5563;margin:16px 0 6px}
.p-conn{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #111827}
.p-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.p-cname{font-size:12px;color:#d1d5db;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.p-tag{display:inline-block;font-size:11px;padding:2px 8px;border-radius:10px;margin:2px}
.p-doc{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #111827;
  cursor:pointer;user-select:none}
.p-doc:hover .p-cname{color:#f9fafb}
.p-doc-arrow{font-size:10px;color:#4b5563;margin-left:auto;flex-shrink:0;transition:transform .2s}
.p-doc-arrow.open{transform:rotate(90deg)}
.p-doc-body{overflow:hidden;max-height:0;transition:max-height .3s ease;
  background:rgba(255,255,255,.03);border-radius:6px;margin-bottom:4px}
.p-doc-body.open{max-height:2000px}
.p-doc-md{padding:10px 12px;font-size:12px;color:#9ca3af;line-height:1.7;overflow-wrap:break-word}
.p-doc-md h1,.p-doc-md h2,.p-doc-md h3{color:#e5e7eb;font-weight:700;margin:10px 0 4px}
.p-doc-md h1{font-size:15px}.p-doc-md h2{font-size:13px}.p-doc-md h3{font-size:12px}
.p-doc-md p{margin:4px 0}
.p-doc-md ul,.p-doc-md ol{padding-left:16px;margin:4px 0}
.p-doc-md li{margin:2px 0}
.p-doc-md code{background:rgba(255,255,255,.08);border-radius:3px;padding:1px 5px;
  font-size:11px;font-family:monospace}
.p-doc-md pre{background:rgba(0,0,0,.4);border-radius:6px;padding:8px 10px;
  overflow-x:auto;margin:6px 0}
.p-doc-md pre code{background:none;padding:0}
.p-doc-md strong{color:#e5e7eb;font-weight:600}
.p-doc-md a{color:#60a5fa}
.p-doc-md hr{border:none;border-top:1px solid #1e2d3d;margin:8px 0}
.p-doc-md blockquote{border-left:2px solid #374151;margin:6px 0;padding:2px 10px;color:#6b7280}

/* HUD */
#hud{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);
  display:flex;align-items:center;gap:8px;
  background:rgba(17,24,39,.95);border:1px solid #374151;
  border-radius:999px;padding:6px 16px;font-size:12px;color:#9ca3af;
  z-index:100;backdrop-filter:blur(8px);white-space:nowrap}
.hs{width:1px;height:14px;background:#374151}
#hud button{background:none;border:none;color:#9ca3af;cursor:pointer;
  padding:2px 8px;border-radius:4px;font-size:12px}
#hud button:hover{background:rgba(255,255,255,.08);color:#e5e7eb}
.ht{color:#e5e7eb;font-weight:600}
.hb{background:rgba(255,255,255,.06);border-radius:4px;padding:1px 6px;
  font-size:10px;color:#6b7280}

#elabel{position:absolute;pointer-events:none;z-index:80;
  font-size:10px;font-weight:500;border-radius:4px;padding:2px 6px;
  display:none;transform:translate(-50%,-130%)}
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
      <g id="gg"></g>
      <g id="eg"></g>
    </g>
  </svg>
  <div id="html-layer"></div>
  <div id="elabel"></div>
</div>

<div id="panel">
  <button class="px" id="p-close">✕</button>
  <div id="p-body"></div>
</div>

<div id="hud">
  <span class="ht">${esc(title)}</span>
  <div class="hs"></div>
  <span class="hb">${archCount} nodes · ${edgeInfos.length} edges</span>
  <div class="hs"></div>
  <button id="btn-fit">전체 보기</button>
  <div class="hs"></div>
  <span id="zdsp">100%</span>
</div>

<script>
(function(){
try{
const NODES=${sj(nodeInfos)};
const EDGES=${sj(edgeInfos)};
const GC=${JSON.stringify(GROUP_COLORS)};
const TC=${JSON.stringify(TYPE_COLORS)};
const TL=${JSON.stringify(TYPE_LABELS)};
const TI=${JSON.stringify(TYPE_ICONS)};
const SC=${JSON.stringify(STATUS_COLORS)};
const BBOX=${JSON.stringify(bbox)};
const DOCS=${sj(docInfos)};

let T={x:0,y:0,s:1},drag=false,dp={},selId=null;

${renderMdFn}

const wrap=document.getElementById('wrap');
const svgVp=document.getElementById('svg-vp');
const hl=document.getElementById('html-layer');
const gg=document.getElementById('gg');
const eg=document.getElementById('eg');
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

function e(s){
  if(s==null)return'';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function hexRgb(hex,a){
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return'rgba('+r+','+g+','+b+','+a+')';
}

function nodeById(id){return NODES.find(n=>n.id===id)}

// Picks the best source/target handles based on relative node positions.
// MARGIN keeps the path endpoint just outside the node card so the arrowhead is visible.
function chooseHandles(src,tgt){
  const MARGIN=2;
  const sh=src.h||120, th=tgt.h||120;
  const srcCX=src.x+src.w/2, srcCY=src.y+sh/2;
  const tgtCX=tgt.x+tgt.w/2, tgtCY=tgt.y+th/2;
  const dx=tgtCX-srcCX, dy=tgtCY-srcCY;
  if(Math.abs(dx)>=Math.abs(dy)){
    if(dx>=0){
      return{sx:src.x+src.w,sy:srcCY,sp:'right', tx:tgt.x-MARGIN,        ty:tgtCY,tp:'left'};
    } else {
      return{sx:src.x,      sy:srcCY,sp:'left',  tx:tgt.x+tgt.w+MARGIN,  ty:tgtCY,tp:'right'};
    }
  } else {
    if(dy>=0){
      return{sx:srcCX,sy:src.y+sh,sp:'bottom', tx:tgtCX,ty:tgt.y-MARGIN,      tp:'top'};
    } else {
      return{sx:srcCX,sy:src.y,   sp:'top',    tx:tgtCX,ty:tgt.y+th+MARGIN,   tp:'bottom'};
    }
  }
}

// Direction-aware cubic bezier — control points follow the handle direction.
function bezierPath(sx,sy,sp,tx,ty,tp,off){
  off=off||0;
  const dx=Math.abs(tx-sx), dy=Math.abs(ty-sy), c=0.35;
  let cp1x=sx,cp1y=sy;
  if(sp==='right') cp1x+=dx*c; else if(sp==='left') cp1x-=dx*c;
  else if(sp==='bottom') cp1y+=dy*c; else if(sp==='top') cp1y-=dy*c;
  let cp2x=tx,cp2y=ty;
  if(tp==='left') cp2x-=dx*c; else if(tp==='right') cp2x+=dx*c;
  else if(tp==='top') cp2y-=dy*c; else if(tp==='bottom') cp2y+=dy*c;
  const vx=tx-sx, vy=ty-sy, len=Math.sqrt(vx*vx+vy*vy)||1;
  const ox=(-vy/len)*off, oy=(vx/len)*off;
  return'M '+sx+','+sy+' C '+(cp1x+ox)+','+(cp1y+oy)+' '+(cp2x+ox)+','+(cp2y+oy)+' '+tx+','+ty;
}

// ── Groups ────────────────────────────────────────────────────────────────
function renderGroups(){
  gg.innerHTML='';
  NODES.filter(n=>n.type==='groupArea').forEach(n=>{
    const color=GC[n.colorIdx%GC.length]||'#6b7280';
    const g=svgE('g',{});
    g.appendChild(svgE('rect',{
      x:n.x,y:n.y,width:n.w,height:n.h,rx:16,
      fill:hexRgb(color,.07),
      stroke:hexRgb(color,.3),
      'stroke-width':1,
    }));
    // accent bar
    g.appendChild(svgE('rect',{
      x:n.x,y:n.y,width:n.w*0.45,height:2,rx:1,
      fill:hexRgb(color,.55),
    }));
    // title
    const t=svgE('text',{
      x:n.x+28,y:n.y+21,
      fill:color,
      'font-size':11,'font-weight':700,
      'font-family':'system-ui,-apple-system,sans-serif',
    });
    t.textContent=n.title;
    g.appendChild(t);
    gg.appendChild(g);
  });
}

// ── Edges ─────────────────────────────────────────────────────────────────
function renderEdges(){
  const defs=document.querySelector('defs');
  EDGES.forEach(e=>{
    const mid='m'+e.id.replace(/[^a-z0-9]/gi,'_');
    if(!document.getElementById(mid)){
      const m=svgE('marker',{id:mid,markerWidth:10,markerHeight:7,refX:10,refY:3.5,orient:'auto'});
      m.appendChild(svgE('path',{d:'M0,0 L0,7 L10,3.5 z',fill:e.stroke}));
      defs.appendChild(m);
    }
  });
  eg.innerHTML='';
  EDGES.forEach(e=>{
    const src=nodeById(e.source), tgt=nodeById(e.target);
    if(!src||!tgt)return;
    const h=chooseHandles(src,tgt);
    const d=bezierPath(h.sx,h.sy,h.sp,h.tx,h.ty,h.tp,e.parallelOffset||0);
    const mid='m'+e.id.replace(/[^a-z0-9]/gi,'_');
    const grp=svgE('g',{});

    const path=svgE('path',{
      d,fill:'none',stroke:e.stroke,
      'stroke-width':1.5,opacity:.65,
      'marker-end':'url(#'+mid+')',
      'data-eid':e.id,class:'ep',
      style:'pointer-events:none',
    });
    grp.appendChild(path);

    // wide transparent hit area
    const hit=svgE('path',{
      d,fill:'none',stroke:'transparent',
      'stroke-width':14,
      style:'cursor:pointer;pointer-events:stroke',
    });
    hit.addEventListener('mouseenter',()=>{
      path.setAttribute('opacity','1');
      path.setAttribute('stroke-width','2.5');
      if(e.label){
        const mx=(h.sx+h.tx)/2*T.s+T.x;
        const my=(h.sy+h.ty)/2*T.s+T.y;
        elabel.textContent=e.label;
        elabel.style.cssText=
          'display:block;position:absolute;left:'+mx+'px;top:'+my+'px;'+
          'background:rgba(17,24,39,.92);border:1px solid '+hexRgb(e.stroke,.27)+';'+
          'color:'+e.stroke+';font-size:10px;font-weight:500;border-radius:4px;'+
          'padding:2px 6px;transform:translate(-50%,-130%);pointer-events:none;z-index:80';
      }
    });
    hit.addEventListener('mouseleave',()=>{
      path.setAttribute('opacity',selId?'0.06':'0.65');
      path.setAttribute('stroke-width','1.5');
      elabel.style.display='none';
    });
    grp.appendChild(hit);
    eg.appendChild(grp);
  });
}

// ── Node HTML cards ───────────────────────────────────────────────────────
function renderNodes(){
  hl.innerHTML='';
  NODES.filter(n=>n.type==='archNode').forEach(n=>{
    const color=TC[n.nodeType]||'#6b7280';
    const label=TL[n.nodeType]||n.nodeType||'';
    const icon=TI[n.nodeType]||label.slice(0,3).toUpperCase();

    const card=document.createElement('div');
    card.className='nc';
    card.dataset.id=n.id;
    card.style.left=n.x+'px';
    card.style.top=n.y+'px';
    card.style.background='linear-gradient(145deg,'+hexRgb(color,.07)+' 0%,#0d1117 55%)';
    card.style.border='1px solid '+hexRgb(color,.18);

    const statusHtml=n.status&&SC[n.status]
      ?'<div class="nc-status" style="background:'+hexRgb(SC[n.status],.12)+';color:'+SC[n.status]+';border:1px solid '+hexRgb(SC[n.status],.3)+'">'+e(n.status)+'</div>'
      :'';

    const expandHtml=n.hasChildren
      ?'<div class="nc-expand">▸ 하위 노드 있음</div>'
      :'';

    card.innerHTML=
      '<div class="nc-accent" style="background:linear-gradient(90deg,'+color+' 0%,'+hexRgb(color,0)+' 100%)"></div>'+
      '<div class="nc-head">'+
        '<div class="nc-icon" style="background:'+hexRgb(color,.18)+';border:1px solid '+hexRgb(color,.35)+';color:'+color+'">'+
          e(icon)+
        '</div>'+
        '<span class="nc-type" style="color:'+hexRgb(color,.75)+'">'+e(label)+'</span>'+
      '</div>'+
      '<div class="nc-body">'+
        '<div class="nc-title">'+e(n.title)+'</div>'+
        (n.description?'<div class="nc-desc">'+e(n.description)+'</div>':'')+
        statusHtml+
      '</div>'+
      expandHtml;

    card.addEventListener('click',ev=>{ev.stopPropagation();selectNode(n.id)});
    hl.appendChild(card);
  });
}

// ── Selection ─────────────────────────────────────────────────────────────
function selectNode(id){
  selId=id;
  const node=NODES.find(n=>n.id===id);
  if(!node)return;
  const color=TC[node.nodeType]||'#6b7280';

  document.querySelectorAll('.nc').forEach(el=>{
    const nid=el.dataset.id;
    if(nid===id){
      el.classList.remove('dimmed');
      el.style.border='1.5px solid '+hexRgb(color,.65);
      el.style.boxShadow='0 0 0 1px '+hexRgb(color,.27)+',0 0 24px '+hexRgb(color,.27)+',0 8px 32px rgba(0,0,0,.5)';
    } else {
      el.classList.add('dimmed');
      el.style.border='';
      el.style.boxShadow='';
    }
  });

  document.querySelectorAll('.ep').forEach(el=>{
    const edge=EDGES.find(ee=>ee.id===el.getAttribute('data-eid'));
    const connected=edge&&(edge.source===id||edge.target===id);
    el.setAttribute('opacity',connected?'0.9':'0.06');
    el.setAttribute('stroke-width',connected?'2':'1.5');
  });

  showPanel(node);
}

function closePanel(){
  selId=null;
  panel.classList.remove('open');
  document.querySelectorAll('.nc').forEach(el=>{
    el.classList.remove('dimmed');
    el.style.border='';
    el.style.boxShadow='';
  });
  document.querySelectorAll('.ep').forEach(el=>{
    el.setAttribute('opacity','0.65');
    el.setAttribute('stroke-width','1.5');
  });
}

function showPanel(node){
  const color=TC[node.nodeType]||'#6b7280';
  const label=TL[node.nodeType]||node.nodeType||'';
  const connEdges=EDGES.filter(ee=>ee.source===node.id||ee.target===node.id);
  const connIds=[...new Set(connEdges.flatMap(ee=>[ee.source,ee.target]).filter(id=>id!==node.id))];
  const connNodes=connIds.map(id=>nodeById(id)).filter(Boolean);

  const statusHtml=node.status&&SC[node.status]
    ?'<span class="p-tag" style="background:'+hexRgb(SC[node.status],.12)+';color:'+SC[node.status]+';border:1px solid '+hexRgb(SC[node.status],.3)+'">'+e(node.status)+'</span>&nbsp;'
    :'';

  const connsHtml=connNodes.length
    ?'<div class="p-sec">연결 ('+connNodes.length+')</div>'+
      connNodes.map(cn=>{
        const cc=TC[cn.nodeType]||'#6b7280';
        const dir=connEdges.filter(ee=>(ee.source===node.id&&ee.target===cn.id)||(ee.target===node.id&&ee.source===cn.id));
        const arrow=dir.some(ee=>ee.source===node.id)?'→':'←';
        return'<div class="p-conn">'+
          '<div class="p-dot" style="background:'+cc+'"></div>'+
          '<span class="p-cname">'+arrow+' '+e(cn.title)+'</span>'+
          '</div>';
      }).join('')
    :'';

  // Deduplicate labels by label text (not edge id)
  const seenLabels=new Set();
  const tagsHtml=connEdges.filter(ee=>{
    if(!ee.label||seenLabels.has(ee.label))return false;
    seenLabels.add(ee.label);return true;
  }).map(ee=>'<span class="p-tag" style="background:'+hexRgb(ee.stroke,.12)+';color:'+ee.stroke+';border:1px solid '+hexRgb(ee.stroke,.3)+'">'+e(ee.label)+'</span>').join('');

  const linkedDocs=DOCS.filter(d=>d.linkedNodeIds.includes(node.id));
  const docsHtml=linkedDocs.length
    ?'<div class="p-sec">문서 ('+linkedDocs.length+')</div>'+
      linkedDocs.map(d=>{
        const hasContent=d.content!=null&&d.content.trim().length>0;
        const arrow=hasContent?'<span class="p-doc-arrow">›</span>':'';
        return'<div class="p-doc" data-doc-id="'+e(d.id)+'" style="'+(hasContent?'':'cursor:default')+'">'
          +'<div class="p-dot" style="background:#6b7280"></div>'
          +'<span class="p-cname">📄 '+e(d.title)+'</span>'
          +arrow+'</div>'
          +(hasContent?'<div class="p-doc-body" id="db-'+e(d.id)+'">'
            +'<div class="p-doc-md">'+renderMd(d.content)+'</div>'
            +'</div>':'');
      }).join('')
    :'';

  pbody.innerHTML=
    '<div><span class="p-badge" style="background:'+hexRgb(color,.12)+';color:'+color+';border:1px solid '+hexRgb(color,.25)+'">'+e(label)+'</span>&nbsp;'+statusHtml+'</div>'+
    '<div class="p-title">'+e(node.title)+'</div>'+
    (node.description?'<div class="p-desc">'+e(node.description)+'</div>':'')+
    connsHtml+
    (tagsHtml?'<div class="p-sec">관계 타입</div>'+tagsHtml:'')+
    docsHtml;

  panel.classList.add('open');

  // Accordion toggle for doc items with content
  pbody.querySelectorAll('.p-doc[data-doc-id]').forEach(el=>{
    const did=el.getAttribute('data-doc-id');
    const body=document.getElementById('db-'+did);
    if(!body)return;
    el.addEventListener('click',()=>{
      const open=body.classList.toggle('open');
      const arrow=el.querySelector('.p-doc-arrow');
      if(arrow)arrow.classList.toggle('open',open);
    });
  });
}

// ── Pan / Zoom ─────────────────────────────────────────────────────────────
wrap.addEventListener('mousedown',ev=>{
  if(ev.target.closest('.nc'))return;
  drag=true;
  dp={mx:ev.clientX,my:ev.clientY,tx:T.x,ty:T.y};
  wrap.classList.add('dragging');
});
window.addEventListener('mousemove',ev=>{
  if(!drag)return;
  T.x=dp.tx+(ev.clientX-dp.mx);
  T.y=dp.ty+(ev.clientY-dp.my);
  applyT();
});
window.addEventListener('mouseup',()=>{drag=false;wrap.classList.remove('dragging')});

wrap.addEventListener('wheel',ev=>{
  ev.preventDefault();
  const f=ev.deltaY>0?.88:1.12;
  const r=wrap.getBoundingClientRect();
  const mx=ev.clientX-r.left, my=ev.clientY-r.top;
  const ns=Math.max(.04,Math.min(3,T.s*f)), ratio=ns/T.s;
  T.x=mx-ratio*(mx-T.x);
  T.y=my-ratio*(my-T.y);
  T.s=ns;
  applyT();
},{passive:false});

wrap.addEventListener('click',ev=>{
  if(!ev.target.closest('.nc')&&!ev.target.closest('#panel'))closePanel();
});
document.getElementById('p-close').addEventListener('click',closePanel);

function fitView(){
  const vw=wrap.clientWidth, vh=wrap.clientHeight;
  const bw=BBOX.maxX-BBOX.minX, bh=BBOX.maxY-BBOX.minY;
  if(!bw||!bh)return;
  const s=Math.min(vw/bw,vh/bh)*.88;
  T.s=s;
  T.x=(vw-bw*s)/2-BBOX.minX*s;
  T.y=(vh-bh*s)/2-BBOX.minY*s;
  applyT();
}
document.getElementById('btn-fit').addEventListener('click',fitView);

renderGroups();
renderEdges();
renderNodes();
fitView();
}catch(err){
  document.body.style.cssText='display:flex;align-items:center;justify-content:center;height:100vh;background:#030810;color:#ef4444;font-family:monospace;text-align:center;padding:40px';
  document.body.innerHTML='<div><div style="font-size:18px;font-weight:700;margin-bottom:12px">Export rendering error</div><div style="font-size:12px;color:#9ca3af;white-space:pre-wrap">'+err.message+'</div></div>';
}
})();
</script>
</body>
</html>`
}
