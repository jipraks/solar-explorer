import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

/* ================= state ================= */
const LANG_KEY = 'solar-explorer:lang';
function storedLang(){
  try{ const v = localStorage.getItem(LANG_KEY); return (v==='id'||v==='en') ? v : null; }
  catch(e){ return null; }   // localStorage can be blocked (private mode / file://)
}
const savedLang = storedLang();
let lang = savedLang || 'id';   // the ID/EN buttons can change it at any time
const isTouch = matchMedia('(pointer:coarse)').matches;
const isSmall = innerWidth < 641;
let simDays = 0;            // simulated time (days)
let daysPerSec = 10;
let paused = false;
let focusKey = null;
let followObj = null;

const D2R = Math.PI/180;
const el = id => document.getElementById(id);
const t = k => UI[lang][k];

/* ================= renderer ================= */
const renderer = new THREE.WebGLRenderer({antialias:!isSmall, powerPreference:'high-performance', logarithmicDepthBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio, isSmall?2:2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.98;
document.body.appendChild(renderer.domElement);
renderer.domElement.style.position='fixed';
renderer.domElement.style.inset='0';
renderer.domElement.style.zIndex='1';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(52, innerWidth/innerHeight, 0.12, 8000);
const HOME = new THREE.Vector3(0, isSmall?104:118, isSmall?222:252);
camera.position.copy(HOME);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.rotateSpeed = 0.55;
controls.panSpeed = 0.6;
controls.zoomSpeed = 0.9;
controls.minDistance = 1.2;
controls.maxDistance = 1100;
controls.enablePan = true;
controls.touches = {ONE:THREE.TOUCH.ROTATE, TWO:THREE.TOUCH.DOLLY_PAN};

/* ================= lights ================= */
const sunLight = new THREE.PointLight(0xfff2dc, 3.1, 0, 0); // decay 0 → the outer planets stay lit
scene.add(sunLight);
scene.add(new THREE.AmbientLight(0x6f7fb0, 0.26));
const rim = new THREE.DirectionalLight(0x8ea8ff, 0.14); rim.position.set(-1,0.6,-1); scene.add(rim);

/* ================= texture loading ================= */
const manager = new THREE.LoadingManager();
const texLoader = new THREE.TextureLoader(manager);
let loadTotal = 0, loadDone = 0;
const bar = el('bar');
function tick(){ bar.style.width = Math.min(100, Math.round(loadDone/Math.max(1,loadTotal)*100)) + '%'; }

function loadMap(url, mat, slot, srgb=true){
  if(!url) return;
  loadTotal++; tick();
  texLoader.load(url, tex=>{
    if(srgb) tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    mat[slot] = tex; mat.needsUpdate = true;
    loadDone++; tick();
  }, undefined, ()=>{ loadDone++; tick(); });
}

/* fallback: procedural texture (used before, or when an image fails to load) */
function proceduralTex(hex, banded){
  const c = document.createElement('canvas'); c.width=256; c.height=128;
  const x = c.getContext('2d');
  const base = new THREE.Color(hex);
  x.fillStyle = '#'+base.getHexString(); x.fillRect(0,0,256,128);
  for(let i=0;i<(banded?26:260);i++){
    const l = 0.5 + (Math.random()-0.5)*0.5;
    const col = base.clone().offsetHSL(0,0,(l-0.5)*0.5);
    x.fillStyle = 'rgba('+[col.r*255|0,col.g*255|0,col.b*255|0].join(',')+',0.5)';
    if(banded){ const y=Math.random()*128; x.fillRect(0,y,256,2+Math.random()*7); }
    else { const r=2+Math.random()*10; x.beginPath(); x.arc(Math.random()*256,Math.random()*128,r,0,7); x.fill(); }
  }
  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace;
  return tx;
}

/* ================= starfield ================= */
(function stars(){
  const N = isSmall ? 4200 : 8200;
  const pos = new Float32Array(N*3), col = new Float32Array(N*3), siz = new Float32Array(N);
  const c = new THREE.Color();
  for(let i=0;i<N;i++){
    const r = 1000 + Math.random()*700;
    const th = Math.random()*Math.PI*2, ph = Math.acos(2*Math.random()-1);
    pos[i*3]=r*Math.sin(ph)*Math.cos(th); pos[i*3+1]=r*Math.cos(ph)*0.65; pos[i*3+2]=r*Math.sin(ph)*Math.sin(th);
    const h = 0.58 + (Math.random()-0.5)*0.14;
    c.setHSL(h, Math.random()*0.28, 0.5 + Math.random()*0.42);
    col[i*3]=c.r; col[i*3+1]=c.g; col[i*3+2]=c.b;
    siz[i] = Math.random()<0.04 ? 9+Math.random()*8 : 2.2+Math.random()*3.0;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos,3));
  g.setAttribute('color', new THREE.BufferAttribute(col,3));
  g.setAttribute('size', new THREE.BufferAttribute(siz,1));
  const spr = (()=>{ const cv=document.createElement('canvas'); cv.width=cv.height=64;
    const x=cv.getContext('2d'); const gr=x.createRadialGradient(32,32,0,32,32,32);
    gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.25,'rgba(255,255,255,.75)');
    gr.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=gr; x.fillRect(0,0,64,64);
    return new THREE.CanvasTexture(cv); })();
  const m = new THREE.ShaderMaterial({
    uniforms:{map:{value:spr}},
    vertexShader:`attribute float size; varying vec3 vc;
      void main(){ vc=color; vec4 mv=modelViewMatrix*vec4(position,1.);
      gl_PointSize=max(0.8, size*(620.0/-mv.z)); gl_Position=projectionMatrix*mv; }`,
    fragmentShader:`uniform sampler2D map; varying vec3 vc;
      void main(){ vec4 tc=texture2D(map,gl_PointCoord); gl_FragColor=vec4(vc,1.0)*tc; }`,
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, vertexColors:true
  });
  scene.add(new THREE.Points(g,m));
})();

/* ================= sun ================= */
const sunData = BODIES[0];
const sunMat = new THREE.MeshBasicMaterial({map:proceduralTex('#ffb347',false), toneMapped:false});
const sun = new THREE.Mesh(new THREE.SphereGeometry(S.sunR, 64, 48), sunMat);
sun.userData.key = 'sun';
scene.add(sun);
loadMap(sunData.map, sunMat, 'map');

function glowSprite(size, color, opacity){
  const cv = document.createElement('canvas'); cv.width=cv.height=256;
  const x = cv.getContext('2d');
  const g = x.createRadialGradient(128,128,0,128,128,128);
  g.addColorStop(0,'rgba(255,240,205,.95)');
  g.addColorStop(.22,'rgba(255,196,110,.42)');
  g.addColorStop(.5,'rgba(255,140,45,.13)');
  g.addColorStop(1,'rgba(255,110,15,0)');
  x.fillStyle=g; x.fillRect(0,0,256,256);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map:new THREE.CanvasTexture(cv), color, transparent:true, opacity,
    blending:THREE.AdditiveBlending, depthWrite:false, depthTest:true, toneMapped:false}));
  s.scale.setScalar(size);
  return s;
}
const GA = S.sunR*3.4, GB = S.sunR*9.0;
const glowA = glowSprite(GA, 0xffd79a, 0.95); sun.add(glowA);
const glowB = glowSprite(GB, 0xff9b3d, 0.26); sun.add(glowB);

/* ================= planets ================= */
const bodies = [];      // {data, holder, tilt, mesh, hit, orbitLine, labelEl, moons[]}
const hitTargets = [];
const orbitLines = [];
const moonGroups = [];

function makeOrbitLine(a, e, incDeg, nodeDeg, color){
  const b = a*Math.sqrt(1-e*e), c0 = a*e, pts = [];
  for(let i=0;i<=360;i++){
    const th = i*D2R;
    pts.push(new THREE.Vector3(a*Math.cos(th)-c0, 0, b*Math.sin(th)));
  }
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  const m = new THREE.LineBasicMaterial({color, transparent:true, opacity:0.30});
  const line = new THREE.LineLoop(g, m);
  return line;
}

/* Kepler position: yields motion that genuinely slows down at aphelion */
const tmpV = new THREE.Vector3();
function keplerPos(a, e, M, out){
  let E = M;
  for(let i=0;i<4;i++) E = E - (E - e*Math.sin(E) - M)/(1 - e*Math.cos(E));
  const b = a*Math.sqrt(1-e*e);
  out.set(a*(Math.cos(E)-e), 0, b*Math.sin(E));
  return out;
}

function buildRing(cfg, planetR){
  const inner = planetR*cfg.inner, outer = planetR*cfg.outer;
  const g = new THREE.RingGeometry(inner, outer, 160, 1);
  const p = g.attributes.position, uv = g.attributes.uv, v = new THREE.Vector3();
  const mid = (inner+outer)/2;
  for(let i=0;i<p.count;i++){
    v.fromBufferAttribute(p,i);
    uv.setXY(i, v.length() < mid ? 0 : 1, 1);
  }
  const mat = new THREE.MeshBasicMaterial({
    color:0xffffff, side:THREE.DoubleSide, transparent:true,
    opacity: cfg.faint?0.55:0.95, depthWrite:false
  });
  loadMap(cfg.map, mat, 'map');
  loadMap(cfg.alpha, mat, 'alphaMap', false);
  const mesh = new THREE.Mesh(g, mat);
  mesh.rotation.x = -Math.PI/2;
  return mesh;
}

function atmosphere(r, hex, power){
  return new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), new THREE.ShaderMaterial({
    uniforms:{glowColor:{value:new THREE.Color(hex)}, p:{value:power}},
    vertexShader:`varying vec3 vN; varying vec3 vP;
      void main(){ vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.);
      vP=mv.xyz; gl_Position=projectionMatrix*mv; }`,
    fragmentShader:`uniform vec3 glowColor; uniform float p; varying vec3 vN; varying vec3 vP;
      void main(){ float i=pow(clamp(1.0-dot(vN,normalize(-vP)),0.0,1.0),p);
      gl_FragColor=vec4(glowColor, i*0.42); }`,
    side:THREE.BackSide, blending:THREE.AdditiveBlending, transparent:true, depthWrite:false
  }));
}

/* soft halo so small planets stay visible from far away */
const haloTex = (()=>{
  const cv=document.createElement('canvas'); cv.width=cv.height=128;
  const x=cv.getContext('2d'); const g=x.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,'rgba(255,255,255,.95)'); g.addColorStop(.28,'rgba(255,255,255,.42)');
  g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g; x.fillRect(0,0,128,128);
  return new THREE.CanvasTexture(cv);
})();
function halo(color){
  return new THREE.Sprite(new THREE.SpriteMaterial({map:haloTex, color:new THREE.Color(color),
    transparent:true, opacity:0.5, blending:THREE.AdditiveBlending, depthWrite:false, depthTest:false, toneMapped:false}));
}

const labelLayer = el('labels');
function makeLabel(text, cls){
  const d = document.createElement('div');
  d.className = 'lab'+(cls?' '+cls:'');
  d.textContent = text;
  labelLayer.appendChild(d);
  return d;
}

for(const d of BODIES){
  if(d.type === 'star'){
    const L = makeLabel(d.name[lang]);
    bodies.push({data:d, obj:sun, mesh:sun, labelEl:L, dispR:S.sunR, moons:[]});
    // hit target for the Sun
    const hit = new THREE.Mesh(new THREE.SphereGeometry(S.sunR*1.15, 16, 12),
      new THREE.MeshBasicMaterial({transparent:true, opacity:0, depthWrite:false, colorWrite:false}));
    hit.userData.key = 'sun'; sun.add(hit); hitTargets.push(hit);
    continue;
  }

  const r = rDisp(d.radiusKm);
  const a = dDisp(d.dist);
  d._r = r; d._a = a;
  const node = Math.random()*360;

  const orbitGroup = new THREE.Object3D();
  orbitGroup.rotation.y = node*D2R;
  orbitGroup.rotation.x = d.inc*D2R;
  scene.add(orbitGroup);

  const line = makeOrbitLine(a, d.ecc, d.inc, node, new THREE.Color(d.color).lerp(new THREE.Color(0xffffff),0.25));
  orbitGroup.add(line); orbitLines.push(line);

  const holder = new THREE.Object3D();
  orbitGroup.add(holder);

  const tilt = new THREE.Object3D();
  tilt.rotation.z = d.tilt*D2R;
  holder.add(tilt);

  const mat = new THREE.MeshStandardMaterial({
    map: proceduralTex(d.color, d.radiusKm>20000),
    roughness: d.radiusKm>20000 ? 0.95 : 0.86,
    metalness: 0.02
  });
  loadMap(d.map, mat, 'map');
  if(d.bump){ loadMap(d.bump, mat, 'bumpMap', false); mat.bumpScale = 0.035; }
  if(d.spec){ loadMap(d.spec, mat, 'roughnessMap', false); }

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 64, 48), mat);
  mesh.userData.key = d.key;
  tilt.add(mesh);

  // Earth's clouds
  let clouds = null;
  if(d.clouds){
    const cm = new THREE.MeshStandardMaterial({
      transparent:true, opacity:0.62, depthWrite:false,
      blending:THREE.AdditiveBlending, roughness:1, metalness:0, color:0xffffff
    });
    loadMap(d.clouds, cm, 'map');
    clouds = new THREE.Mesh(new THREE.SphereGeometry(r*1.014, 48, 32), cm);
    tilt.add(clouds);
  }
  if(d.atmo) tilt.add(atmosphere(r*(d.key==='earth'?1.055:1.03), d.atmo, d.key==='earth'?2.8:3.2));

  if(d.ring) tilt.add(buildRing(d.ring, r));

  // oversized hit target so it is easy to tap on a touch screen
  const hitR = Math.max(r*2.0, 1.6);
  const hit = new THREE.Mesh(new THREE.SphereGeometry(hitR, 14, 10),
    new THREE.MeshBasicMaterial({transparent:true, opacity:0, depthWrite:false, colorWrite:false}));
  hit.userData.key = d.key;
  holder.add(hit); hitTargets.push(hit);

  // moons
  const moons = [];
  if(d.moons){
    for(const m of d.moons){
      const mg = new THREE.Object3D();
      mg.rotation.x = (Math.random()-0.5)*0.08;
      tilt.add(mg); moonGroups.push(mg);
      const mm = new THREE.MeshStandardMaterial({map:proceduralTex(m.color,false), roughness:0.95, metalness:0});
      if(m.map) loadMap(m.map, mm, 'map');
      const ms = new THREE.Mesh(new THREE.SphereGeometry(m.r, 28, 20), mm);
      ms.position.x = m.d;
      mg.add(ms);
      const mo = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(
          Array.from({length:97},(_,i)=>new THREE.Vector3(Math.cos(i/96*Math.PI*2)*m.d,0,Math.sin(i/96*Math.PI*2)*m.d))),
        new THREE.LineBasicMaterial({color:0x9fb4dd, transparent:true, opacity:0.10}));
      mg.add(mo);
      const ml = makeLabel(m.name[lang], 'moon');
      moons.push({cfg:m, group:mg, mesh:ms, labelEl:ml, orbit:mo});
      const mh = new THREE.Mesh(new THREE.SphereGeometry(Math.max(m.r*2.6,0.9),10,8),
        new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false}));
      mh.userData.key = d.key; ms.add(mh); hitTargets.push(mh);
    }
  }

  const hl = halo(d.color); holder.add(hl);

  const L = makeLabel(d.name[lang]);
  bodies.push({data:d, orbitGroup, holder, tilt, mesh, clouds, labelEl:L, dispR:r, moons, node, halo:hl});
}

/* ================= asteroid belt ================= */
const beltBands = [];
(function belt(){
  const N = isSmall ? 1100 : 2200, BANDS = 6;
  const rIn = dDisp(2.15), rOut = dDisp(3.35);
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const per = Math.ceil(N/BANDS);
  for(let b=0;b<BANDS;b++){
    const g = new THREE.Object3D(); scene.add(g);
    const mat = new THREE.MeshStandardMaterial({color:0x9a8f80, roughness:1, metalness:0.05, flatShading:true});
    const inst = new THREE.InstancedMesh(geo, mat, per);
    const dummy = new THREE.Object3D();
    const f0 = b/BANDS, f1 = (b+1)/BANDS;
    for(let i=0;i<per;i++){
      const rad = rIn + (rOut-rIn)*(f0 + Math.random()*(f1-f0));
      const th = Math.random()*Math.PI*2;
      dummy.position.set(Math.cos(th)*rad, (Math.random()-0.5)*2.0, Math.sin(th)*rad);
      const s = 0.05 + Math.pow(Math.random(),3)*0.20;
      dummy.scale.set(s, s*(0.6+Math.random()*0.7), s*(0.7+Math.random()*0.6));
      dummy.rotation.set(Math.random()*6, Math.random()*6, Math.random()*6);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
    g.add(inst);
    const aMid = 2.15 + (3.35-2.15)*((f0+f1)/2);
    beltBands.push({g, rate: 1/Math.pow(aMid,1.5)});   // Kepler's third law
  }
})();

/* ================= UI: i18n ================= */
function fmt(n, dec=0){
  return n.toLocaleString(lang==='id'?'id-ID':'en-US',{minimumFractionDigits:dec, maximumFractionDigits:dec});
}
function applyLang(){
  document.documentElement.lang = lang;
  el('langID').classList.toggle('on', lang==='id');
  el('langEN').classList.toggle('on', lang==='en');
  document.querySelectorAll('[data-t]').forEach(n => n.textContent = t(n.dataset.t));
  el('loadTxt').textContent = t('loading');
  el('hint').textContent = isTouch ? t('hint') : t('hintDesk');
  bodies.forEach(b=>{
    b.labelEl.textContent = b.data.name[lang];
    b.moons.forEach(m => m.labelEl.textContent = m.cfg.name[lang]);
  });
  el('helpBtn').title = t('helpTitle');
  el('creditsBtn').title = t('creditsTitle');
  buildNav(); buildHelp(); buildCredits(); updateSpeedLabel();
  syncHudHeight();
  if(focusKey) openPanel(focusKey, false);
}
function setLang(l){
  lang = l;
  try{ localStorage.setItem(LANG_KEY, l); }catch(e){}
  applyLang();
}

/* ================= UI: nav chips ================= */
function buildNav(){
  const nav = el('nav'); nav.innerHTML = '';
  const list = [BODIES[0], ...BODIES.slice(1,5), BELT, ...BODIES.slice(5)];
  for(const d of list){
    const b = document.createElement('button');
    b.className = 'chip' + (focusKey===d.key?' on':'');
    b.dataset.k = d.key;
    b.innerHTML = `<span class="dot" style="background:${d.color}"></span>${d.name[lang]}`;
    b.onclick = ()=>{ openPanel(d.key, true); };
    nav.appendChild(b);
  }
}
function syncNav(){
  document.querySelectorAll('.chip').forEach(c=>c.classList.toggle('on', c.dataset.k===focusKey));
}

/* ================= UI: help ================= */
function buildHelp(){
  el('helpCard').innerHTML = `
    <h3>${t('helpTitle')}</h3><div class="sub">${t('helpSub')}</div>
    ${[['🖐️','h1t','h1d'],['🔍','h2t','h2d'],['👆','h3t','h3d'],['⏱️','h4t','h4d'],['🔊','h5t','h5d'],['📏','h6t','h6d']]
      .map(([i,a,b])=>`<div class="hrow"><i>${i}</i><div><b>${t(a)}</b><span>${t(b)}</span></div></div>`).join('')}
    <button id="helpClose">${t('close')}</button>`;
  el('helpClose').onclick = ()=> el('help').classList.remove('open');
}

/* ================= UI: credits ================= */
function buildCredits(){
  el('creditsCard').innerHTML = `
    <h3>${t('creditsTitle')}</h3><div class="sub">${t('creditsSub')}</div>
    ${CREDITS.map(c=>`<div class="hrow crow"><i>${c.ic}</i><div><b>${c.t[lang]}</b><span>${c.d[lang]}</span>
      ${c.links.map(l=>`<a href="${l.url}" target="_blank" rel="noopener noreferrer">${l.label}</a>`).join('')}
      </div></div>`).join('')}
    <div id="crNote">${t('creditsNote')}</div>
    <button id="creditsClose">${t('closeShort')}</button>`;
  el('creditsClose').onclick = ()=> el('credits').classList.remove('open');
}

/* ================= read-aloud narration =================
   Web Speech API — built in to the browser, so no extra dependency and it
   keeps working offline once a voice is installed. Deliberately defensive:
     · getVoices() is asynchronous and returns [] on the first call,
     · some mobile browsers report an empty voice list even though speech works,
       so an empty list must never disable the button,
     · Chrome silently drops utterances longer than ~15 s, so the text is
       queued sentence by sentence instead of in one go,
     · Safari ignores a speak() issued in the same tick as a cancel().        */
const synth = window.speechSynthesis;
const speechOK = !!synth && typeof window.SpeechSynthesisUtterance === 'function';
const ICO_SPEAK = '<svg viewBox="0 0 24 24"><path d="M4 9.4h3.3L11.6 6v12L7.3 14.6H4z"/>' +
  '<path class="wv" d="M15 9.4a3.7 3.7 0 010 5.2"/><path class="wv" d="M17.7 6.8a7.4 7.4 0 010 10.4"/></svg>';
const ICO_STOP  = '<svg viewBox="0 0 24 24"><rect x="6.5" y="6.5" width="11" height="11" rx="2.6"/></svg>';

let voices = [];
let speakQueue = [];     // [{text, block}] — one entry per sentence
let speakIdx = 0;
let speakBlocksRef = []; // [{el, text}] — one entry per highlighted paragraph
let speaking = false;
let speakToken = 0;      // bumped on every stop, so stale callbacks do nothing

function loadVoices(){
  if(!speechOK) return;
  try{ voices = synth.getVoices() || []; }catch(e){ voices = []; }
  updateListenBtn();
}

/* Best available voice for the current language, or null if there is none. */
function pickVoice(){
  const want = lang;   // 'id' | 'en'
  const cand = voices.filter(v => String(v.lang||'').toLowerCase().replace('_','-').startsWith(want));
  if(!cand.length) return null;
  const score = v => {
    const n = String(v.name||'').toLowerCase();
    let s = 0;
    if(/natural|neural|enhanced|premium/.test(n)) s += 4;   // the nicest-sounding tiers
    if(/google/.test(n)) s += 3;
    if(want==='en' && /^en-us/i.test(v.lang)) s += 1;
    if(v.localService) s += 1;                              // works without a network round-trip
    return s;
  };
  return cand.slice().sort((a,b)=>score(b)-score(a))[0];
}

/* Emoji and typographic bullets read out loud as noise — drop them. */
function speakClean(s){
  return String(s)
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}]/gu, ' ')
    .replace(/·/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Split into utterance-sized pieces: sentence first, then a hard wrap for any
   sentence long enough to trip Chrome's cut-off. A full stop only ends a
   sentence when a space follows it, so "1.000 km" stays in one piece. */
function chunkText(text){
  const clean = speakClean(text);
  if(!clean) return [];
  const out = [];
  let buf = '';
  for(let i=0;i<clean.length;i++){
    const ch = clean[i], nx = clean[i+1];
    buf += ch;
    if('.!?…'.indexOf(ch) >= 0 && (nx === undefined || nx === ' ') && buf.trim().length > 24){
      out.push(buf.trim()); buf = '';
    }
  }
  if(buf.trim()) out.push(buf.trim());

  const LIM = 180;
  const wrapped = [];
  for(const s of out){
    let rest = s;
    while(rest.length > LIM){
      let cut = rest.lastIndexOf(', ', LIM);
      if(cut < 60) cut = rest.lastIndexOf(' ', LIM);
      if(cut < 60) cut = LIM;
      wrapped.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).replace(/^[,\s]+/, '');
    }
    if(rest) wrapped.push(rest);
  }
  return wrapped;
}

function clearHighlight(){
  document.querySelectorAll('.speaking').forEach(n => n.classList.remove('speaking'));
}
function highlight(i){
  clearHighlight();
  const b = speakBlocksRef[i];
  if(!b || !b.el || !b.el.isConnected) return;
  b.el.classList.add('speaking');
  const box = el('pbody').getBoundingClientRect(), r = b.el.getBoundingClientRect();
  if(r.top < box.top + 8 || r.bottom > box.bottom - 8)
    b.el.scrollIntoView({behavior:'smooth', block:'center'});
}

function stopSpeak(){
  speakToken++;
  speaking = false; speakQueue = []; speakIdx = 0; speakBlocksRef = [];
  if(speechOK){ try{ synth.cancel(); }catch(e){} }
  clearHighlight();
  updateListenBtn();
}

function speakNext(token){
  if(token !== speakToken) return;
  if(speakIdx >= speakQueue.length){ stopSpeak(); return; }
  const item = speakQueue[speakIdx];
  highlight(item.block);

  const u = new SpeechSynthesisUtterance(item.text);
  const v = pickVoice();
  if(v) u.voice = v;
  u.lang = v ? v.lang : (lang==='id' ? 'id-ID' : 'en-US');
  u.rate = 0.94;    // a touch slower than default — easier for young listeners
  u.pitch = 1.05;
  u.onend = ()=>{ if(token !== speakToken) return; speakIdx++; speakNext(token); };
  u.onerror = ev=>{
    if(token !== speakToken) return;
    const err = ev && ev.error;
    if(err === 'interrupted' || err === 'canceled') return;   // we stopped it on purpose
    speakIdx++; speakNext(token);                             // skip the bad chunk, keep going
  };
  try{ synth.resume(); synth.speak(u); }catch(e){ stopSpeak(); }
}

/* Reads the panel's kid-facing copy: title, description, and the fun facts.
   The long "full explanation" is written for adults and is left out. */
function speakPanel(){
  if(!speechOK) return;
  stopSpeak();
  const token = ++speakToken;

  const blocks = [{el:null, text: el('pname').textContent + '.'}];
  el('pbody').querySelectorAll('[data-sp]').forEach(n => blocks.push({el:n, text:n.textContent}));

  const q = [];
  blocks.forEach((b, bi) => chunkText(b.text).forEach(s => q.push({text:s, block:bi})));
  if(!q.length){ stopSpeak(); return; }

  speakBlocksRef = blocks; speakQueue = q; speakIdx = 0; speaking = true;
  updateListenBtn();
  // Safari drops a speak() fired in the same tick as the cancel() above.
  setTimeout(()=>{ if(token === speakToken) speakNext(token); }, 90);
}

function updateListenBtn(){
  const b = el('listenBtn'), note = el('voiceNote');
  if(!b) return;
  if(!speechOK){ b.classList.remove('show'); note.classList.remove('show'); return; }
  b.classList.toggle('show', !!focusKey);
  b.classList.toggle('on', speaking);
  b.innerHTML = (speaking ? ICO_STOP : ICO_SPEAK) + '<span>' + t(speaking ? 'listenStop' : 'listen') + '</span>';
  b.setAttribute('aria-label', t(speaking ? 'listenStop' : 'listen'));
  // Only warn when the device really has no matching voice — an empty list
  // means "not reported yet", which is common on mobile and speaks fine.
  const missing = voices.length > 0 && !pickVoice();
  note.textContent = missing ? t('voiceMissing') : '';
  note.classList.toggle('show', missing && !!focusKey);
}

if(speechOK){
  loadVoices();
  synth.onvoiceschanged = loadVoices;
  setTimeout(loadVoices, 1200);            // some browsers populate late without firing the event
  setInterval(()=>{                        // Chrome can silently pause a long queue
    if(speaking && synth.paused){ try{ synth.resume(); }catch(e){} }
  }, 6000);
  document.addEventListener('visibilitychange', ()=>{ if(document.hidden) stopSpeak(); });
  addEventListener('pagehide', ()=>{ try{ synth.cancel(); }catch(e){} });
}

/* ================= UI: info panel ================= */
function statCard(v, l){ return `<div class="stat"><b>${v}</b><span>${l}</span></div>`; }

function dayText(h){
  const ah = Math.abs(h);
  const retro = h<0 ? ` (${t('retro')})` : '';
  return ah>=48 ? `${fmt(ah/24,1)} ${t('days')}${retro}` : `${fmt(ah,1)} ${t('hours')}${retro}`;
}
function yearText(d){
  return d>=800 ? `${fmt(d/365.25, d/365.25>=100?0:1)} ${t('years')}` : `${fmt(d,1)} ${t('days')}`;
}

function openPanel(key, fly){
  const d = key==='belt' ? BELT : BODIES.find(b=>b.key===key);
  if(!d) return;
  stopSpeak();                 // the panel is about to be rebuilt under the narration
  focusKey = key; syncNav();
  el('ptype').textContent = t(d.type==='star'?'star':d.type==='dwarf'?'dwarf':d.type==='region'?'region':'planet');
  el('pname').textContent = d.name[lang];
  el('palt').textContent = d.alt[lang];

  let stats = '';
  if(d.type !== 'region'){
    stats += statCard(fmt(d.radiusKm*2)+' km', t('diameter'));
    if(d.dist) stats += statCard(fmt(d.dist*149.6,1)+' '+(lang==='id'?'juta km':'million km'), t('distance'));
    if(d.orbitDays) stats += statCard(yearText(d.orbitDays), t('year'));
    stats += statCard(dayText(d.rotHours), t('day'));
    stats += statCard(d.moonsN>0?fmt(d.moonsN):t('none'), t('moons'));
    stats += statCard(fmt(d.gravity,2)+' m/s²', t('gravity'));
    stats += statCard((d.tempC>0&&d.type==='star'?'~':'')+fmt(d.tempC)+' °C', t('temp'));
    if(d.orbKms) stats += statCard(fmt(d.orbKms,1)+' km/s', t('speedOrb'));
  }

  let cmp = '';
  if(d.type!=='region' && d.type!=='star'){
    const sz = d.radiusKm/6371, dy = Math.abs(d.rotHours)/23.934;
    const bw = v => Math.max(2, Math.min(100, (Math.log10(v)+1.6)/3.2*100));
    cmp = `<div class="sechead">${t('cmpSize')}</div>
      <div class="cmp"><div class="cmpbar"><i style="width:${bw(sz)}%"></i></div>
      <div class="cmplab"><span>${t('earthUnit')}</span><span>${fmt(sz,2)}×</span></div></div>
      <div class="sechead">${t('cmpDay')}</div>
      <div class="cmp"><div class="cmpbar"><i style="width:${bw(dy)}%"></i></div>
      <div class="cmplab"><span>${t('earthUnit')}</span><span>${fmt(dy,2)}×</span></div></div>`;
  }

  let moonsHtml = '';
  if(d.moons && d.moons.length){
    moonsHtml = `<div class="sechead">${t('moonsHead')}</div><div class="stats">` +
      d.moons.map(m=>`<div class="stat"><b>${m.name[lang]}</b><span>${lang==='id'?'periode':'period'} ${fmt(Math.abs(m.p),2)} ${t('days')}</span></div>`).join('') +
      `</div>`;
  }

  el('pbody').innerHTML = `
    <p data-sp>${d.desc[lang]}</p>
    ${stats?`<div class="sechead">${t('statsHead')}</div><div class="stats">${stats}</div>`:''}
    ${cmp}
    ${moonsHtml}
    <div class="sechead" data-sp>${t('factsHead')}</div>
    ${d.facts.map(f=>`<div class="fact" data-sp><i>${f.ic}</i><div>${f[lang]}</div></div>`).join('')}
    <button id="deepBtn">${t('more')}</button>
    <div id="deep">${d.deep[lang].split('\n\n').map(p=>`<p>${p}</p>`).join('')}</div>
    ${d.key!=='belt'?`<button id="gotoBtn">${t('goto')}</button>`:''}
    <div class="sechead" style="margin-bottom:6px">${lang==='id'?'Catatan':'Note'}</div>
    <p style="font-size:12px;color:#8b97b8;line-height:1.5">${t('scaleNote')}${d.moonsN>2?' '+t('moonNote'):''}</p>`;

  el('deepBtn').onclick = e=>{
    const dv = el('deep'); const on = dv.classList.toggle('show');
    e.target.textContent = on ? t('less') : t('more');
    if(on) setTimeout(()=>dv.scrollIntoView({behavior:'smooth', block:'start'}), 60);
  };
  const gb = el('gotoBtn'); if(gb) gb.onclick = ()=> flyTo(key);
  el('pbody').scrollTop = 0;
  el('panel').classList.add('open');
  updateListenBtn();
  if(fly) flyTo(key);
}
function closePanel(){
  const key = focusKey, wasFollowing = !!followObj;
  el('panel').classList.remove('open');
  focusKey = null; syncNav();
  stopSpeak();
  if(wasFollowing && key && key !== 'belt') flyTo(key, 0.7);  // reframe back to the centre
  else followObj = null;
}

/* ================= camera flight ================= */
let flight = null, followLift = 0, followSide = 0;
const followDir = new THREE.Vector3(0,1,0);
const UP_Y = new THREE.Vector3(0,1,0);
const vSide = new THREE.Vector3();
const easeIO = x => x<0.5 ? 4*x*x*x : 1-Math.pow(-2*x+2,3)/2;

function bodyWorldPos(key, out){
  if(key==='sun') return out.set(0,0,0);
  const b = bodies.find(x=>x.data.key===key);
  if(!b) return out.set(0,0,0);
  return b.holder.getWorldPosition(out);
}
function flyTo(key, dur){
  dur = dur || 1.35;
  const panelIsOpen = el('panel').classList.contains('open');
  if(key==='belt'){
    const bd = isSmall ? 168 : 132;
    const bdir = new THREE.Vector3(0, 0.54, 0.84).normalize();
    const blift = ((isSmall && panelIsOpen) ? innerHeight*0.31 : 58) * bd / PX_PER_UNIT();
    const blook = new THREE.Vector3(0, -blift, 0);
    flight = {from:camera.position.clone(), to:blook.clone().add(bdir.multiplyScalar(bd)),
      fromT:controls.target.clone(), toT:blook, t:0, dur};
    followObj = null; return;
  }
  const b = key==='sun' ? {holder:sun, dispR:S.sunR} : bodies.find(x=>x.data.key===key);
  if(!b) return;
  const target = new THREE.Vector3(); (b.holder||sun).getWorldPosition(target);

  // distance is solved so the body (with its rings & moons) fits the visible screen area
  const d = b.data;
  let needR = b.dispR * 1.5;
  if(d && d.ring) needR = Math.max(needR, b.dispR*d.ring.outer*1.2);
  if(b.moons && b.moons.length) needR = Math.max(needR, b.moons[b.moons.length-1].cfg.d*0.95);
  const availFrac = (isSmall && panelIsOpen) ? 0.155 : 0.36;   // half-height of the visible area
  const dist = Math.max(needR * PX_PER_UNIT() / (innerHeight*availFrac), 3.0);

  // put the camera on the sunlit side (3/4 view), never the night side
  const UPV = new THREE.Vector3(0,1,0);
  let dir;
  if(key === 'sun'){
    dir = camera.position.clone().sub(target);
    if(dir.lengthSq()<1e-4) dir.set(0.5,0.4,1);
    dir.normalize(); dir.y = Math.max(dir.y, 0.28); dir.normalize();
  } else {
    const toSun = target.clone().negate().normalize();          // planet → Sun
    const side  = new THREE.Vector3().crossVectors(UPV, toSun).normalize();
    // enough elevation that the camera does not fly through the asteroid belt on the way
    dir = toSun.multiplyScalar(0.55).add(side.multiplyScalar(0.52)).add(UPV.clone().multiplyScalar(0.66)).normalize();
  }

  // the info panel covers part of the screen → shift the look-at point so the body stays visible
  const panelOpen = panelIsOpen;
  // lift the body so the panel (mobile) or the bottom control bar (desktop) does not cover it
  const liftPx = (isSmall && panelOpen) ? innerHeight*0.31 : 58;
  const lift = liftPx * dist / PX_PER_UNIT();
  const look = target.clone(); look.y -= lift;
  let sideShift = 0;
  if(panelOpen && !isSmall){
    const pw = el('panel').getBoundingClientRect().width || 392;
    sideShift = (pw/2) * dist / PX_PER_UNIT();
    look.add(new THREE.Vector3().crossVectors(UPV, dir).normalize().multiplyScalar(sideShift));
  }

  flight = {from:camera.position.clone(), to:look.clone().add(dir.multiplyScalar(dist)),
    fromT:controls.target.clone(), toT:look, t:0, dur, key, lift, sideShift, dir:dir.clone()};
  el('hint').classList.add('hide');
}
function goHome(){
  flight = {from:camera.position.clone(), to:HOME.clone(),
    fromT:controls.target.clone(), toT:new THREE.Vector3(0,0,0), t:0, dur:1.3};
  followObj = null; closePanel(); el('tgTop').classList.remove('on'); topView=false;
}
let topView = false;
function goTop(){
  topView = !topView;
  el('tgTop').classList.toggle('on', topView);
  flight = {from:camera.position.clone(), to: topView? new THREE.Vector3(0,330,0.6) : HOME.clone(),
    fromT:controls.target.clone(), toT:new THREE.Vector3(0,0,0), t:0, dur:1.3};
  followObj = null;
}

/* ================= interaction ================= */
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let downX=0, downY=0, downT=0, moved=false;

renderer.domElement.addEventListener('pointerdown', e=>{
  downX=e.clientX; downY=e.clientY; downT=performance.now(); moved=false;
  el('hint').classList.add('hide');
});
renderer.domElement.addEventListener('pointermove', e=>{
  if(Math.hypot(e.clientX-downX, e.clientY-downY) > 9) moved = true;
  if(!isTouch) hover(e);
});
renderer.domElement.addEventListener('pointerup', e=>{
  if(moved || performance.now()-downT > 600) return;
  const k = pick(e.clientX, e.clientY);
  if(k) openPanel(k, true); else if(el('panel').classList.contains('open')) closePanel();
});

function pick(cx, cy){
  ndc.x = (cx/innerWidth)*2-1; ndc.y = -(cy/innerHeight)*2+1;
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(hitTargets, false);
  return hits.length ? hits[0].object.userData.key : null;
}
const tip = el('tip');
function hover(e){
  const k = pick(e.clientX, e.clientY);
  renderer.domElement.style.cursor = k ? 'pointer' : 'grab';
  if(k){
    const d = BODIES.find(b=>b.key===k);
    tip.textContent = d ? d.name[lang] : '';
    tip.style.left = e.clientX+'px'; tip.style.top = e.clientY+'px';
    tip.classList.add('on');
  } else tip.classList.remove('on');
}

/* ================= HUD ================= */
const spd = el('spd');
function speedFromSlider(v){
  if(v<=0) return 0;
  return Math.pow(10, (v/100)*(Math.log10(600)+2)-2);   // 0.01 … 600 days/second
}
function updateSpeedLabel(){
  spd.style.setProperty('--p', spd.value+'%');
  el('spdVal').textContent = paused ? t('paused')
    : (daysPerSec<1 ? fmt(daysPerSec,2) : daysPerSec<10 ? fmt(daysPerSec,1) : fmt(daysPerSec,0)) + ' ' + t('perSec');
}
spd.oninput = ()=>{ daysPerSec = speedFromSlider(+spd.value); if(daysPerSec>0 && paused) setPause(false); updateSpeedLabel(); };
daysPerSec = speedFromSlider(+spd.value);

function setPause(p){
  paused = p;
  el('playIco').innerHTML = p ? '<path d="M7 4.5v15l13-7.5z"/>' : '<path d="M8 5h3v14H8zM13 5h3v14h-3z"/>';
  updateSpeedLabel();
}
el('playBtn').onclick = ()=> setPause(!paused);
setPause(false);

el('tgOrbit').onclick = e=>{ const on=e.target.classList.toggle('on'); orbitLines.forEach(l=>l.visible=on); };
let labelsOn = true;
el('tgLabel').onclick = e=>{ labelsOn = e.target.classList.toggle('on'); if(!labelsOn) labelLayer.querySelectorAll('.lab').forEach(l=>l.style.opacity=0); };
el('tgBelt').onclick = e=>{ const on=e.target.classList.toggle('on'); beltBands.forEach(b=>b.g.visible=on); };
let moonsOn = true;
el('tgMoon').onclick = e=>{ moonsOn = e.target.classList.toggle('on'); moonGroups.forEach(g=>g.visible=moonsOn); };
el('tgTop').onclick = goTop;
el('homeBtn').onclick = goHome;
el('helpBtn').onclick = ()=> el('help').classList.add('open');
el('help').onclick = e=>{ if(e.target.id==='help') el('help').classList.remove('open'); };
el('creditsBtn').onclick = ()=> el('credits').classList.add('open');
el('credits').onclick = e=>{ if(e.target.id==='credits') el('credits').classList.remove('open'); };
el('pclose').onclick = closePanel;
el('listenBtn').onclick = ()=>{ if(speaking) stopSpeak(); else speakPanel(); };
el('langID').onclick = ()=> setLang('id');
el('langEN').onclick = ()=> setLang('en');
addEventListener('keydown', e=>{
  if(el('langGate').classList.contains('open')) return;   // pick a language first
  if(e.code==='Space'){ e.preventDefault(); setPause(!paused); }
  if(e.key==='Escape'){
    if(el('credits').classList.contains('open')) el('credits').classList.remove('open');
    else if(el('help').classList.contains('open')) el('help').classList.remove('open');
    else closePanel();
  }
});

/* ================= layout ================= */
/* The planet chips must sit right above the control card, never behind it.
   The card height shifts with screen width & text length, so it is re-measured. */
function syncHudHeight(){
  const h = el('hud').offsetHeight;
  if(h > 0) document.documentElement.style.setProperty('--hud-h', h + 'px');
}
if(window.ResizeObserver) new ResizeObserver(syncHudHeight).observe(el('hud'));
addEventListener('resize', syncHudHeight);
addEventListener('load', syncHudHeight);
requestAnimationFrame(syncHudHeight);
syncHudHeight();

/* ================= language gate (first visit) ================= */
const langGate = el('langGate');
langGate.querySelectorAll('[data-l]').forEach(b=>{
  b.onclick = ()=>{ setLang(b.dataset.l); langGate.classList.remove('open'); };
});
if(!savedLang) langGate.classList.add('open');

/* ================= loop ================= */
const clock = new THREE.Clock();
const vpos = new THREE.Vector3(), vscr = new THREE.Vector3(), vprev = new THREE.Vector3();
const vplanet = new THREE.Vector3(), vA = new THREE.Vector3(), vB = new THREE.Vector3();

/* is point `p` hidden behind the sphere centred at `c` with radius `r`? */
function occluded(p, c, r){
  vA.copy(p).sub(camera.position);
  vB.copy(c).sub(camera.position);
  const dp = vA.length(), dc = vB.length();
  if(dp <= dc) return false;                    // the object is nearer than the planet
  const proj = vB.dot(vA)/(dp*dp);
  if(proj <= 0) return false;
  vA.multiplyScalar(proj).sub(vB);              // perpendicular distance from the planet centre to the line of sight
  return vA.length() < r;
}
const MAX_SPIN = 1.6;   // rad/second — prevents a strobe effect when time is sped up

const PX_PER_UNIT = () => (0.5*innerHeight)/Math.tan(camera.fov*0.5*D2R);
function positionLabel(elm, world, minPx, prio, radius3D){
  vscr.copy(world).project(camera);
  if(vscr.z > 1){ elm.style.opacity = 0; return; }
  const dist = camera.position.distanceTo(world);
  const x = (vscr.x*0.5+0.5)*innerWidth, y = (-vscr.y*0.5+0.5)*innerHeight;
  // push the label below the body so the sphere itself stays clear
  const rpx = radius3D ? radius3D*PX_PER_UNIT()/Math.max(dist,0.01) : 0;
  const off = Math.min(Math.max(15, rpx + 13), 110);
  const op = prio ? 1 : Math.max(0, Math.min(1, (minPx - dist)/minPx*2.2));
  elm.style.transform = `translate(-50%,-50%) translate(${x.toFixed(1)}px,${(y+off).toFixed(1)}px)`;
  elm.style.opacity = op;
}

function animate(){
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.06);
  const dDays = paused ? 0 : dt*daysPerSec;
  simDays += dDays;

  // sun
  sun.rotation.y += Math.min(2*Math.PI/(609.12/24)*daysPerSec, MAX_SPIN)*dt*(paused?0:1);
  const pulse = 1 + Math.sin(clock.elapsedTime*0.8)*0.02;
  glowA.scale.setScalar(GA*pulse); glowB.scale.setScalar(GB*(2-pulse));

  // planets
  for(const b of bodies){
    const d = b.data;
    if(d.type==='star') continue;
    const M = (simDays/d.orbitDays)*Math.PI*2 + (b.node||0);
    keplerPos(d._a, d.ecc, M, tmpV);
    b.holder.position.copy(tmpV);

    if(!paused){
      const w = 2*Math.PI/(Math.abs(d.rotHours)/24)*daysPerSec;
      b.mesh.rotation.y += Math.sign(d.rotHours)*Math.min(w, MAX_SPIN)*dt;
      if(b.clouds) b.clouds.rotation.y += Math.sign(d.rotHours)*Math.min(w*1.18, MAX_SPIN)*dt;
      for(const m of b.moons){
        const mw = 2*Math.PI/Math.abs(m.cfg.p)*daysPerSec;
        m.group.rotation.y += Math.sign(m.cfg.p)*Math.min(mw, MAX_SPIN)*dt;
        m.mesh.rotation.y += Math.sign(m.cfg.p)*Math.min(mw, MAX_SPIN)*dt;  // tidally locked
      }
    }
  }

  // asteroid belt (differential rotation, per Kepler's law)
  if(!paused) for(const b of beltBands) b.g.rotation.y += b.rate*daysPerSec*dt*0.9;

  // camera flight
  if(flight){
    flight.t += dt/flight.dur;
    const k = easeIO(Math.min(1, flight.t));
    // moving target? follow its current position
    if(flight.key){
      bodyWorldPos(flight.key, flight.toT);
      flight.toT.y -= (flight.lift||0);
      if(flight.sideShift) flight.toT.add(vSide.crossVectors(UP_Y, flight.dir).normalize().multiplyScalar(flight.sideShift));
    }
    camera.position.lerpVectors(flight.from, flight.to, k);
    controls.target.lerpVectors(flight.fromT, flight.toT, k);
    if(flight.t>=1){
      followObj = flight.key||null; followLift = flight.lift||0;
      followSide = flight.sideShift||0; followDir.copy(flight.dir||UP_Y);
      flight=null;
    }
  } else if(followObj){
    bodyWorldPos(followObj, vpos); vpos.y -= followLift;
    if(followSide) vpos.add(vSide.crossVectors(UP_Y, followDir).normalize().multiplyScalar(followSide));
    vprev.copy(vpos).sub(controls.target);
    camera.position.add(vprev);
    controls.target.copy(vpos);
  }

  controls.update();

  // sync the camera matrices BEFORE projecting the labels,
  // so labels never lag one frame behind the rendered image
  camera.updateMatrixWorld();
  camera.matrixWorldInverse.copy(camera.matrixWorld).invert();

  // planet halo: grows with distance, fades as the camera closes in
  for(const b of bodies){
    if(!b.halo) continue;
    b.holder.getWorldPosition(vpos);
    const cd = camera.position.distanceTo(vpos);
    const s = Math.max(b.dispR*2.8, cd*0.017);
    b.halo.scale.setScalar(s);
    b.halo.material.opacity = Math.min(0.78, Math.max(0, (cd/(b.dispR*34)) - 0.18));
  }

  // label
  if(labelsOn){
    for(const b of bodies){
      (b.holder||sun).getWorldPosition(vpos);
      positionLabel(b.labelEl, vpos, 900, true, b.dispR);
      const near = camera.position.distanceTo(vpos) < b.dispR*30;
      vplanet.copy(vpos);
      for(const m of b.moons){
        if(!moonsOn || !near){ m.labelEl.style.opacity = 0; continue; }
        m.mesh.getWorldPosition(vpos);
        if(occluded(vpos, vplanet, b.dispR)){ m.labelEl.style.opacity = 0; continue; }
        positionLabel(m.labelEl, vpos, 70, false, m.cfg.r);
      }
    }
  }

  renderer.render(scene, camera);
}

/* ================= boot ================= */
addEventListener('resize', ()=>{
  camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

window.__dbg = () => ({
  cam: camera.position.toArray().map(v=>+v.toFixed(1)),
  tgt: controls.target.toArray().map(v=>+v.toFixed(1)),
  dist: +camera.position.distanceTo(controls.target).toFixed(2),
  follow: followObj, flying: !!flight
});

applyLang();
animate();

let hidden = false;
function hideLoader(){
  if(hidden) return; hidden = true;
  bar.style.width='100%';
  setTimeout(()=>{ el('loader').classList.add('done'); }, 260);
  setTimeout(()=>{ el('hint').classList.add('hide'); }, 9000);
}
manager.onLoad = hideLoader;
setTimeout(hideLoader, 7000);   // never hold the user hostage to a slow CDN
