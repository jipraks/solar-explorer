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
  el('installBtn').title = t('install');
  syncFullscreenUI();
  buildNav(); buildHelp(); buildCredits(); updateSpeedLabel();
  syncCockpitLang();
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
    ${[['🖐️','h1t','h1d'],['🔍','h2t','h2d'],['👆','h3t','h3d'],['⏱️','h4t','h4d'],
       ['🔊','h5t','h5d'],['🚀','h7t','h7d'],['📏','h6t','h6d']]
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

let dragId = null;
renderer.domElement.addEventListener('pointerdown', e=>{
  downX=e.clientX; downY=e.clientY; downT=performance.now(); moved=false;
  el('hint').classList.add('hide');
  if(pilot){                                  // dragging the view steers the ship
    dragId = e.pointerId;
    renderer.domElement.setPointerCapture(e.pointerId);
    el('ckHint').classList.add('hide');
  }
});
renderer.domElement.addEventListener('pointermove', e=>{
  if(Math.hypot(e.clientX-downX, e.clientY-downY) > 9) moved = true;
  if(pilot){
    if(e.pointerId === dragId){
      dragIn.x = Math.max(-1, Math.min(1, (e.clientX-downX)/170));
      dragIn.y = Math.max(-1, Math.min(1, (e.clientY-downY)/170));
    }
    return;
  }
  if(!isTouch) hover(e);
});
function endDrag(e){
  if(dragId === null || e.pointerId !== dragId) return;
  dragId = null; dragIn.x = dragIn.y = 0;
}
renderer.domElement.addEventListener('pointercancel', endDrag);
renderer.domElement.addEventListener('pointerup', e=>{
  if(pilot){ endDrag(e); return; }
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
  if(e.key === 'f' || e.key === 'F'){ toggleFullscreen(); return; }
  if(pilot){
    if(steerKey(e.code, true)){ e.preventDefault(); el('ckHint').classList.add('hide'); return; }
    if(e.code==='Space'){ e.preventDefault(); braking = true; return; }
    if(e.key==='+' || e.key==='='){ if(!wreckUntil) setThrottle(throttle+0.08); return; }
    if(e.key==='-' || e.key==='_'){ if(!wreckUntil) setThrottle(throttle-0.08); return; }
    if(e.key==='Escape') exitPilot();
    return;
  }
  if(e.code==='Space'){ e.preventDefault(); setPause(!paused); }
  if(e.key==='Escape'){
    if(el('credits').classList.contains('open')) el('credits').classList.remove('open');
    else if(el('help').classList.contains('open')) el('help').classList.remove('open');
    else closePanel();
  }
});

/* ================= pilot mode =================
   The solar system is already a scene at a workable scale, so flying through
   it needs no second world: OrbitControls is switched off and the camera
   becomes the ship. The flight model is deliberately arcade — the ship goes
   where its nose points, with enough inertia to feel heavy. True Newtonian
   drift would leave a child tumbling and lost within seconds.               */
const SHIP_MAX = 22;                    // display units per second at full thrust
/* Time has to be slowed while flying. At the default 10 days/second Mercury
   sweeps along its orbit at ~26 units/second — faster than the ship's top
   speed — so a child could chase it forever and never catch it. */
const PILOT_DAYS_PER_SEC = 0.8;
let preDaysPerSec = null;
const YAW_RATE = 1.05, PITCH_RATE = 0.85;
const AU_MKM = 149.6;                   // million km in one AU
const C_MKMS = 0.299792;                // speed of light, million km per second

let pilot = false;
let throttle = 0, braking = false;
let ckVoiceOn = true;
const shipQuat = new THREE.Quaternion();
const shipVel = new THREE.Vector3();
const stickIn = {x:0, y:0}, dragIn = {x:0, y:0}, keyIn = {x:0, y:0};
const AXIS_X = new THREE.Vector3(1,0,0), AXIS_Y = new THREE.Vector3(0,1,0);
const ORIGIN = new THREE.Vector3();
const shipFwd = new THREE.Vector3(), vTmpA = new THREE.Vector3(), vTmpB = new THREE.Vector3();
const vReal = new THREE.Vector3(), vRealPrev = new THREE.Vector3(), vRealB = new THREE.Vector3();
const qTmp = new THREE.Quaternion(), mTmp = new THREE.Matrix4();
let realSpeed = 0;                      // million km/s, smoothed
let nearKey = null, arrivedKey = null;
let hudClock = 0, warnUntil = 0;
let sayBusy = false;
const sayLast = {};

/* The map compresses distance as r = orbBase + orbK * AU^orbExp. Inverting it
   turns a point on the map back into a real distance from the Sun, which is
   what the cockpit readouts show — the direction is already true. */
function mapToAU(r){
  return r <= S.orbBase ? 0 : Math.pow((r - S.orbBase)/S.orbK, 1/S.orbExp);
}
function realPos(v, out){
  const r = v.length();
  if(r < 1e-6) return out.set(0,0,0);
  return out.copy(v).multiplyScalar(mapToAU(r)/r);
}

/* ---- engine sound =================================================
   Synthesised with the Web Audio API rather than shipped as files: the whole
   app is one generated HTML file, so an MP3 would mean a new asset folder.

   The rumble is three layers — looping brown noise through a lowpass for the
   roar, three detuned sawtooths for the mechanical hum (the detuning is what
   stops it sounding like a keyboard note), and a sine near 40 Hz for weight.
   The thrust lever drives volume, filter cutoff and pitch together; moving
   all three at once is what makes the ear believe the engine is working.    */
const ENGINE_KEY = 'solar-explorer:engine';
let actx = null, eng = null;
let engineOn = (()=>{ try{ return localStorage.getItem(ENGINE_KEY) !== 'off'; }catch(e){ return true; } })();

function noiseBuffer(ctx){
  const len = Math.floor(ctx.sampleRate * 2);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for(let i=0;i<len;i++){
    last = (last + 0.02*(Math.random()*2-1)) / 1.02;   // brown noise: weighted low
    d[i] = Math.max(-1, Math.min(1, last*3.2));
  }
  return buf;
}

/* Must be called from inside a user gesture — browsers refuse to start audio
   any other way. Entering pilot mode is a button press, so that is where it
   happens. */
function audioInit(){
  if(actx) return actx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if(!AC) return null;
  try{ actx = new AC(); }catch(e){ actx = null; return null; }

  const master = actx.createGain(); master.gain.value = 0.85; master.connect(actx.destination);
  const duck   = actx.createGain(); duck.gain.value = 1; duck.connect(master);
  const level  = actx.createGain(); level.gain.value = 0; level.connect(duck);

  const nSrc = actx.createBufferSource();
  nSrc.buffer = noiseBuffer(actx); nSrc.loop = true;
  const nFilt = actx.createBiquadFilter();
  nFilt.type = 'lowpass'; nFilt.frequency.value = 170; nFilt.Q.value = 0.7;
  const nGain = actx.createGain(); nGain.gain.value = 0.6;
  nSrc.connect(nFilt); nFilt.connect(nGain); nGain.connect(level);

  const oGain = actx.createGain(); oGain.gain.value = 0.14;
  const oFilt = actx.createBiquadFilter();
  oFilt.type = 'lowpass'; oFilt.frequency.value = 320; oFilt.Q.value = 1.1;
  oGain.connect(oFilt); oFilt.connect(level);
  const oscs = [-9, 0, 11].map(cents=>{
    const o = actx.createOscillator();
    o.type = 'sawtooth'; o.frequency.value = 42; o.detune.value = cents;
    o.connect(oGain); return o;
  });

  const sub = actx.createOscillator(); sub.type = 'sine'; sub.frequency.value = 34;
  const sGain = actx.createGain(); sGain.gain.value = 0.24;
  sub.connect(sGain); sGain.connect(level);

  try{ nSrc.start(); oscs.forEach(o=>o.start()); sub.start(); }catch(e){}
  eng = {master, duck, level, nFilt, oFilt, oscs, sub};
  return actx;
}

/* resume()/suspend() hand back a promise that can reject — a try/catch does
   not cover that, and an unhandled rejection lands in the console. */
function audioSet(action){
  if(!actx) return;
  try{
    const r = actx[action]();
    if(r && r.catch) r.catch(()=>{});
  }catch(e){}
}

function engineUpdate(){
  if(!actx || !eng) return;
  const now = actx.currentTime, T = 0.14;
  const live = pilot && engineOn && !wreckUntil;   // a wrecked ship is silent
  const th = live ? throttle : 0;
  eng.level.gain.setTargetAtTime(live ? 0.05 + 0.5*th : 0, now, T);
  eng.nFilt.frequency.setTargetAtTime(170 + 2100*th*th, now, T);
  eng.oFilt.frequency.setTargetAtTime(300 + 1500*th, now, T);
  const f = 40 + 40*th;
  eng.oscs.forEach((o, i)=> o.frequency.setTargetAtTime(f*(1 + i*0.006), now, T));
  eng.sub.frequency.setTargetAtTime(34 + 16*th, now, T);
}

/* The engine has to get out of the way of the voice, or a child hears the
   roar and none of the words. */
function engineDuck(on){
  if(!actx || !eng) return;
  eng.duck.gain.setTargetAtTime(on ? 0.22 : 1, actx.currentTime, on ? 0.05 : 0.3);
}

function sfx(kind){
  if(!actx || !eng || !engineOn || actx.state !== 'running') return;
  const now = actx.currentTime;
  if(kind === 'whoosh'){
    const s = actx.createBufferSource(); s.buffer = noiseBuffer(actx);
    const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.4;
    const g = actx.createGain();
    f.frequency.setValueAtTime(260, now);
    f.frequency.exponentialRampToValueAtTime(1700, now + 0.28);
    f.frequency.exponentialRampToValueAtTime(240, now + 0.85);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.5, now + 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    s.connect(f); f.connect(g); g.connect(eng.master);
    s.start(now); s.stop(now + 0.95);
  } else if(kind === 'thud'){
    const o = actx.createOscillator(); o.type = 'sine';
    const g = actx.createGain();
    o.frequency.setValueAtTime(120, now);
    o.frequency.exponentialRampToValueAtTime(32, now + 0.32);
    g.gain.setValueAtTime(0.7, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    o.connect(g); g.connect(eng.master);
    o.start(now); o.stop(now + 0.42);
  } else if(kind === 'boom'){
    const o = actx.createOscillator(); o.type = 'sine';
    const og = actx.createGain();
    o.frequency.setValueAtTime(150, now);
    o.frequency.exponentialRampToValueAtTime(24, now + 0.7);
    og.gain.setValueAtTime(0.8, now);
    og.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);
    o.connect(og); og.connect(eng.master);
    o.start(now); o.stop(now + 1);

    const s = actx.createBufferSource(); s.buffer = noiseBuffer(actx);
    const f = actx.createBiquadFilter(); f.type = 'lowpass';
    f.frequency.setValueAtTime(3400, now);
    f.frequency.exponentialRampToValueAtTime(200, now + 1.1);
    const g = actx.createGain();
    g.gain.setValueAtTime(0.85, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    s.connect(f); f.connect(g); g.connect(eng.master);
    s.start(now); s.stop(now + 1.25);
  } else if(kind === 'alarm'){
    for(let i=0;i<2;i++){
      const at = now + i*0.26;
      const o = actx.createOscillator(); o.type = 'square'; o.frequency.value = i ? 700 : 880;
      const g = actx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.16, at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.19);
      o.connect(g); g.connect(eng.master);
      o.start(at); o.stop(at + 0.2);
    }
  }
}

/* One-line callouts from the ship's computer. Deliberately droppable: if a
   line is already playing, a new low-priority one is skipped rather than
   queued, so the cockpit never falls behind what the child is doing. */
function sayComputer(text, force){
  if(!speechOK || !ckVoiceOn || !text) return false;
  if(!force && (speaking || sayBusy)) return false;
  try{
    const u = new SpeechSynthesisUtterance(speakClean(text));
    const v = pickVoice();
    if(v) u.voice = v;
    u.lang = v ? v.lang : (lang==='id' ? 'id-ID' : 'en-US');
    u.rate = 1.0; u.pitch = 0.92;        // flatter than the storytelling voice
    sayBusy = true;
    engineDuck(true);
    u.onend = ()=>{ sayBusy = false; engineDuck(false); };
    u.onerror = ()=>{ sayBusy = false; engineDuck(false); };
    if(force){
      // same rule as the panel narration: Safari drops a speak() issued in the
      // same tick as a cancel(), so let the cancel land first
      synth.cancel();
      setTimeout(()=>{ try{ synth.resume(); synth.speak(u); }catch(e){ sayBusy = false; } }, 90);
    } else {
      synth.resume(); synth.speak(u);
    }
    return true;
  }catch(e){ sayBusy = false; return false; }
}
/* Returns whether the line actually went out — a caller that latches state on
   a callout must not latch when the line was dropped, or it is lost for good. */
function sayOnce(kind, text, gapMs, force){
  const now = performance.now();
  if(sayLast[kind] && now - sayLast[kind] < gapMs) return false;
  const spoke = sayComputer(text, force);
  if(spoke) sayLast[kind] = now;
  return spoke;
}

/* The instrument banks are generated rather than written out: a few dozen
   keys, switches and lamps as markup would drown the template, and the layout
   is the same every time because the sequence is seeded, not random. */
(function buildInstruments(){
  let seed = 20260811;
  const rnd = () => (seed = (seed*1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const LAMP = ['#5ec8ff', '#7dffa8', '#ffd479', '#ff8a6a', '#c9a2ff'];

  for(const bank of document.querySelectorAll('#cockpit .ckBank')){
    const onPillar = !!bank.closest('.ckPillar');
    const count = onPillar ? 18 : 24;
    for(let i=0;i<count;i++){
      const r = rnd();
      const cell = document.createElement('span');
      if(r < 0.3){
        cell.className = 'led';
        cell.style.color = LAMP[Math.floor(rnd()*LAMP.length)];
        cell.style.animationDelay = (rnd()*4).toFixed(2) + 's';
        cell.style.animationDuration = (2.6 + rnd()*4).toFixed(2) + 's';
        if(rnd() < 0.35) cell.style.animation = 'none';      // some lamps just stay lit
      } else if(r < 0.45){
        cell.className = 'sw' + (rnd() < 0.5 ? ' dn' : '');
      } else {
        cell.className = 'key';
        cell.style.opacity = (0.65 + rnd()*0.35).toFixed(2);
      }
      bank.appendChild(cell);
    }
  }
})();

function syncCockpitLang(){
  el('ckSpdLab').textContent = t('ckSpd');
  el('ckTgtLab').textContent = t('ckTgt');
  el('thrLab').textContent = t('ckThr');
  el('ckExit').textContent = t('ckExit');
  el('ckData').textContent = t('ckData');
  el('ckVoice').title = t('ckVoice');
  el('ckEngine').title = t('ckEngine');
  el('pilotBtn').title = t('pilot');
  el('ckHint').textContent = isTouch ? t('ckHintTouch') : t('ckHintDesk');
}

function setThrottle(v){
  const was = throttle;
  throttle = Math.max(0, Math.min(1, v));
  // snap at both ends: a child's finger never lands exactly on the stops,
  // and "99%" instead of full thrust is a frustrating way to lose a race
  if(throttle > 0.96) throttle = 1;
  else if(throttle < 0.04) throttle = 0;
  el('thrFill').style.height = (throttle*100).toFixed(1) + '%';
  el('thrGrip').style.bottom = `calc(2px + ${throttle.toFixed(3)} * (100% - 16px))`;
  el('thrVal').textContent = Math.round(throttle*100) + '%';
  engineUpdate();
  if(!pilot) return;
  if(throttle > 0.995 && was <= 0.995) sayOnce('full', t('sayFull'), 12000);
  if(throttle < 0.005 && was >= 0.005) sayOnce('idle', t('sayIdle'), 12000);
}

/* ---- crash & explosion =============================================
   A gentle approach still just bumps and bounces; hitting a world hard
   destroys the ship. That difference is the whole lesson — ease off the
   thrust before you arrive — and losing the ship costs a child two seconds,
   never their progress. The Sun is fatal at any speed, because it is the Sun. */
const CRASH_SPEED = 5.5;         // display units/second of inward speed
const BOOM_N = 220, BOOM_DUR = 1.5;
let wreckUntil = 0, wreckBody = null, shakeUntil = 0, shakeAmp = 0;
let boomLife = 0;
const boomVel = new Float32Array(BOOM_N*3);
const vBoom = new THREE.Vector3();
const eTmp = new THREE.Euler();

const boomPts = (()=>{
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(BOOM_N*3), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(BOOM_N*3), 3));
  const m = new THREE.PointsMaterial({size:0.5, map:haloTex, vertexColors:true, transparent:true,
    opacity:1, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false});
  const p = new THREE.Points(g, m);
  p.frustumCulled = false; p.visible = false;
  scene.add(p);
  return p;
})();

function spawnBoom(at){
  const pos = boomPts.geometry.attributes.position.array;
  const col = boomPts.geometry.attributes.color.array;
  for(let i=0;i<BOOM_N;i++){
    const i3 = i*3;
    pos[i3] = at.x; pos[i3+1] = at.y; pos[i3+2] = at.z;
    // even scatter over a sphere, with a spread of speeds so it billows
    const u = Math.random()*2-1, th = Math.random()*Math.PI*2, s = Math.sqrt(1-u*u);
    const sp = 1.4 + Math.random()*Math.random()*9;
    boomVel[i3] = s*Math.cos(th)*sp; boomVel[i3+1] = u*sp; boomVel[i3+2] = s*Math.sin(th)*sp;
    const hot = Math.random();
    col[i3] = 1; col[i3+1] = 0.32 + 0.62*hot; col[i3+2] = 0.06 + 0.3*hot*hot;
  }
  boomPts.geometry.attributes.position.needsUpdate = true;
  boomPts.geometry.attributes.color.needsUpdate = true;
  boomPts.visible = true;
  boomLife = BOOM_DUR;
}

/* Runs from the main loop, so debris keeps flying even after the child leaves
   the cockpit. Debris does not follow the planet — it is left behind in space. */
function updateBoom(dt){
  if(boomLife <= 0) return;
  boomLife -= dt;
  const pos = boomPts.geometry.attributes.position.array;
  const drag = Math.exp(-1.1*dt);
  for(let i=0;i<BOOM_N*3;i+=3){
    pos[i]   += boomVel[i]*dt;
    pos[i+1] += boomVel[i+1]*dt;
    pos[i+2] += boomVel[i+2]*dt;
    boomVel[i] *= drag; boomVel[i+1] *= drag; boomVel[i+2] *= drag;
  }
  boomPts.geometry.attributes.position.needsUpdate = true;
  const k = Math.max(0, boomLife/BOOM_DUR);
  boomPts.material.opacity = k*k;
  boomPts.material.size = 0.35 + (1-k)*1.7;
  if(boomLife <= 0) boomPts.visible = false;
}

function flashScreen(){
  const f = el('ckFlash');
  f.style.transition = 'none';
  f.classList.add('on');
  void f.offsetWidth;                       // commit the opaque frame before fading
  f.style.transition = 'opacity .8s ease-out';
  f.classList.remove('on');
}

function shake(ms, amp){
  shakeUntil = performance.now() + ms;
  shakeAmp = amp;
}

/* The camera carries the ship's orientation; the shake is layered on top of it
   so it never leaks into the ship's actual heading. */
function aimCamera(){
  camera.quaternion.copy(shipQuat);
  const left = shakeUntil - performance.now();
  if(left > 0){
    const k = left/700, a = shakeAmp*k*k;
    eTmp.set((Math.random()*2-1)*a, (Math.random()*2-1)*a, (Math.random()*2-1)*a);
    qTmp.setFromEuler(eTmp);
    camera.quaternion.multiply(qTmp);
  }
}

function explode(at, key){
  spawnBoom(at);
  flashScreen();
  shake(700, 0.075);
  sfx('boom');
  wreckUntil = performance.now() + 2300;
  wreckBody = key;
  shipVel.multiplyScalar(0.12);
  // let go of the controls: a finger still resting on the lever would otherwise
  // slam the spare ship back to full thrust the instant it appears
  thrBlocked = (thrId !== null);   // a hand already on the lever must let go first
  thrId = null; stickId = null;
  stickIn.x = stickIn.y = dragIn.x = dragIn.y = 0;
  stickPad.classList.remove('grab');
  stickKnob.style.transform = '';
  el('cockpit').classList.add('wreck');
  el('ckWreck').textContent = t('ckWreck');
  el('ckWreck').classList.add('on');
  el('ckData').classList.add('hide');
  el('ckWarn').classList.remove('on'); warnUntil = 0;
  sayComputer(t('sayBoom'), true);
  setThrottle(0);       // after the callout, so its "engines idle" line is dropped
}

function respawnShip(){
  const b = wreckBody ? bodies.find(x=>x.data.key === wreckBody) : null;
  const target = vTmpA.set(0,0,0);
  if(b) (b.holder || sun).getWorldPosition(target);
  const r = b ? b.dispR : S.sunR;

  // back off along the line we came in on, lifted a little above the plane
  vTmpB.copy(camera.position).sub(target);
  if(vTmpB.lengthSq() < 1e-6) vTmpB.set(0, 0.4, 1);
  vTmpB.normalize(); vTmpB.y += 0.3; vTmpB.normalize();
  camera.position.copy(target).addScaledVector(vTmpB, Math.max(r*9, 15));

  mTmp.lookAt(camera.position, target, UP_Y);
  shipQuat.setFromRotationMatrix(mTmp);
  shipVel.set(0,0,0);
  setThrottle(0);
  realPos(camera.position, vRealPrev);
  realSpeed = 0;
  nearKey = arrivedKey = null;
  el('ckData').classList.add('hide');
  el('cockpit').classList.remove('wreck');
  el('ckWreck').classList.remove('on');
  wreckUntil = 0; wreckBody = null;
  sayComputer(t('sayRespawn'), true);
  engineUpdate();
}

function warn(text){
  el('ckWarn').textContent = text;
  el('ckWarn').classList.add('on');
  warnUntil = performance.now() + 1600;
}

function enterPilot(){
  if(pilot) return;
  pilot = true;
  stopSpeak(); closePanel();
  flight = null; followObj = null;
  controls.enabled = false;
  preDaysPerSec = daysPerSec;
  if(daysPerSec > PILOT_DAYS_PER_SEC) daysPerSec = PILOT_DAYS_PER_SEC;
  setThrottle(0);
  shipVel.set(0,0,0);
  stickIn.x = stickIn.y = dragIn.x = dragIn.y = keyIn.x = keyIn.y = 0;
  braking = false;
  nearKey = arrivedKey = null;
  wreckUntil = 0; wreckBody = null; shakeUntil = 0;
  el('cockpit').classList.remove('wreck');
  el('ckWreck').classList.remove('on');
  realSpeed = 0;
  // take over facing whatever the user was already looking at
  mTmp.lookAt(camera.position, controls.target, UP_Y);
  shipQuat.setFromRotationMatrix(mTmp);
  camera.up.set(0,1,0);
  realPos(camera.position, vRealPrev);

  el('cockpit').classList.add('open');
  el('pilotBtn').classList.add('on');
  el('nav').style.display = 'none';
  el('hud').style.display = 'none';
  // the map's own chrome would sit right under the cockpit readouts, and none
  // of it is reachable while flying anyway — the cockpit has its own exit
  el('top').style.display = 'none';
  el('hint').classList.add('hide');
  tip.classList.remove('on');
  el('ckData').classList.add('hide');
  el('ckWarn').classList.remove('on');
  el('ckHint').classList.remove('hide');
  setTimeout(()=>{ if(pilot) el('ckHint').classList.add('hide'); }, 12000);
  syncCockpitLang();
  // still inside the button press, which is the only moment audio may start.
  // If the engine is muted, build nothing: no reason to run five oscillators
  // into silence on a classroom tablet.
  if(engineOn && audioInit()) audioSet('resume');
  engineDuck(false);
  engineUpdate();
  sayComputer(t('sayStart'), true);
}

function exitPilot(openKey){
  if(!pilot) return;
  pilot = false;
  el('cockpit').classList.remove('open');
  el('cockpit').classList.remove('wreck');
  el('ckWreck').classList.remove('on');
  wreckUntil = 0; wreckBody = null; shakeUntil = 0;
  camera.quaternion.copy(shipQuat);              // drop any leftover shake
  el('pilotBtn').classList.remove('on');
  el('nav').style.display = '';
  el('hud').style.display = '';
  el('top').style.display = '';
  el('ckWarn').classList.remove('on');
  if(preDaysPerSec !== null){ daysPerSec = preDaysPerSec; preDaysPerSec = null; updateSpeedLabel(); }
  engineUpdate();                              // ramps to silence…
  setTimeout(()=>{                             // …then stop the clock entirely
    if(!pilot && actx && actx.state === 'running') audioSet('suspend');
  }, 600);
  // hand a sane orbit centre back to OrbitControls: a point ahead of the ship
  shipFwd.set(0,0,-1).applyQuaternion(camera.quaternion);
  controls.target.copy(camera.position).addScaledVector(shipFwd, 26);
  camera.up.set(0,1,0);
  controls.enabled = true;
  controls.update();
  syncHudHeight();
  if(openKey) openPanel(openKey, true);
  else { try{ synth.cancel(); }catch(e){} sayBusy = false; sayComputer(t('sayExit'), true); }
}

function updateShip(dt){
  if(wreckUntil){                       // the ship is gone; coast in the debris
    if(performance.now() > wreckUntil){ respawnShip(); return; }
    shipVel.multiplyScalar(Math.exp(-2.2*dt));
    camera.position.addScaledVector(shipVel, dt);
    aimCamera();
    return;
  }
  const ix = Math.max(-1, Math.min(1, keyIn.x + stickIn.x + dragIn.x));
  const iy = Math.max(-1, Math.min(1, keyIn.y + stickIn.y + dragIn.y));

  qTmp.setFromAxisAngle(AXIS_Y, -ix * YAW_RATE * dt);   shipQuat.multiply(qTmp);
  qTmp.setFromAxisAngle(AXIS_X, -iy * PITCH_RATE * dt); shipQuat.multiply(qTmp);

  // bleed off accumulated roll, so the ship never ends up flying upside down
  shipFwd.set(0,0,-1).applyQuaternion(shipQuat);
  vTmpA.copy(UP_Y).addScaledVector(shipFwd, -UP_Y.dot(shipFwd));
  if(vTmpA.lengthSq() > 1e-5){
    vTmpA.normalize();
    mTmp.lookAt(ORIGIN, shipFwd, vTmpA);
    qTmp.setFromRotationMatrix(mTmp);
    shipQuat.slerp(qTmp, 1 - Math.exp(-1.8*dt));
  }
  shipQuat.normalize();

  shipFwd.set(0,0,-1).applyQuaternion(shipQuat);
  vTmpB.copy(shipFwd).multiplyScalar(throttle*throttle*SHIP_MAX);
  shipVel.lerp(vTmpB, 1 - Math.exp(-1.5*dt));
  if(braking) shipVel.multiplyScalar(Math.exp(-3.4*dt));

  camera.position.addScaledVector(shipVel, dt);
  aimCamera();

  /* nearest body — drives the readout, the callouts and the collision check */
  let best = null, bestSurf = Infinity;
  for(const b of bodies){
    (b.holder || sun).getWorldPosition(vTmpA);
    const dist = camera.position.distanceTo(vTmpA);
    const surf = dist - b.dispR;
    if(surf < bestSurf){ bestSurf = surf; best = b; }
  }

  // the Sun is the one place a child can actually get into trouble, and that
  // warning outranks the cheerful "we have arrived" line for the same body
  // set wider than the arrival band (1.7 × radius) so the warning always wins
  // the race against a cheery "we have arrived at the Sun"
  const sunHot = camera.position.length() < S.sunR*3.0;
  if(sunHot){
    warn(t('ckWarnHot'));
    if(!sayLast.hotSfx || performance.now() - sayLast.hotSfx > 2600){
      sayLast.hotSfx = performance.now(); sfx('alarm');
    }
    sayOnce('hot', t('sayHot'), 9000);
  }

  if(best){
    (best.holder || sun).getWorldPosition(vTmpA);
    const minR = best.dispR * 1.06;
    const dist = camera.position.distanceTo(vTmpA);
    if(dist < minR){
      vTmpB.copy(camera.position).sub(vTmpA);
      if(vTmpB.lengthSq() < 1e-6) vTmpB.set(0, 0, 1);
      vTmpB.normalize();
      camera.position.copy(vTmpA).addScaledVector(vTmpB, minR);
      const into = shipVel.dot(vTmpB);                 // negative = flying inwards
      vBoom.copy(vTmpA).addScaledVector(vTmpB, best.dispR);   // the point of impact

      if(best.data.type === 'star' || -into > CRASH_SPEED){
        explode(vBoom, best.data.key);
        return;
      }
      if(into < 0) shipVel.addScaledVector(vTmpB, -into*1.7);   // bounce back out
      warn(t('ckWarnHit'));
      shake(300, 0.03);
      if(!sayLast.hitSfx || performance.now() - sayLast.hitSfx > 700){
        sayLast.hitSfx = performance.now(); sfx('thud');
      }
      sayOnce('hit', t('sayHit'), 4000);
    }

    const key = best.data.key;
    if(bestSurf < best.dispR*1.7){
      if(arrivedKey !== key){
        arrivedKey = key;
        el('ckData').classList.remove('hide');
        if(!sunHot) sayOnce('arrive:'+key, t('sayArrive').replace('{name}', best.data.name[lang]), 8000, true);
      }
    } else if(bestSurf > best.dispR*3.2 && arrivedKey === key){
      arrivedKey = null;
      el('ckData').classList.add('hide');
    }
    if(bestSurf < best.dispR*7 && nearKey !== key && arrivedKey !== key){
      // latch only once the line is actually out, so a callout that lost the
      // race with the engine-start greeting is retried instead of swallowed
      if(sayOnce('near:'+key, t('sayNear').replace('{name}', best.data.name[lang]), 8000)){
        nearKey = key; sfx('whoosh');
      }
    } else if(bestSurf > best.dispR*11 && nearKey === key){
      nearKey = null;
    }
  }

  // real distance & speed, recovered from the compressed map
  realPos(camera.position, vReal);
  const stepMkm = vReal.distanceTo(vRealPrev) * AU_MKM;
  vRealPrev.copy(vReal);
  const inst = dt > 0 ? stepMkm/dt : 0;
  realSpeed += (inst - realSpeed) * (1 - Math.exp(-4*dt));

  hudClock += dt;
  if(hudClock >= 0.1){
    hudClock = 0;
    el('ckSpdVal').textContent = fmt(realSpeed, realSpeed<10 ? 1 : 0) + ' ' + t('ckUnit');
    el('ckSpdSub').textContent = realSpeed > 0.05
      ? fmt(realSpeed/C_MKMS, realSpeed/C_MKMS<10 ? 1 : 0) + ' ' + t('ckLight') : '';
    if(best){
      (best.holder || sun).getWorldPosition(vTmpA);
      realPos(vTmpA, vRealB);
      el('ckTgtName').textContent = best.data.name[lang];
      el('ckTgtDist').textContent = fmt(vReal.distanceTo(vRealB)*AU_MKM, 1) + ' ' + t('ckDistUnit');
    }
  }
  if(warnUntil && performance.now() > warnUntil){
    warnUntil = 0;
    el('ckWarn').classList.remove('on');
  }
}

/* ---- cockpit input ---- */
const stickPad = el('stickPad'), stickKnob = el('stickKnob');
let stickId = null;
function moveStick(e){
  const r = stickPad.getBoundingClientRect();
  let x = (e.clientX - (r.left + r.width/2)) / (r.width/2);
  let y = (e.clientY - (r.top + r.height/2)) / (r.height/2);
  const m = Math.hypot(x, y);
  if(m > 1){ x /= m; y /= m; }
  stickIn.x = x; stickIn.y = y;
  stickKnob.style.transform = `translate(${(x*r.width*0.29).toFixed(1)}px,${(y*r.height*0.29).toFixed(1)}px)`;
}
function endStick(e){
  if(stickId !== null && e.pointerId !== stickId) return;
  stickId = null; stickIn.x = stickIn.y = 0;
  stickPad.classList.remove('grab');
  stickKnob.style.transform = '';
}
stickPad.addEventListener('pointerdown', e=>{
  stickId = e.pointerId;
  try{ stickPad.setPointerCapture(e.pointerId); }catch(err){}
  stickPad.classList.add('grab'); moveStick(e); e.preventDefault();
});
stickPad.addEventListener('pointermove', e=>{ if(e.pointerId === stickId) moveStick(e); });
stickPad.addEventListener('pointerup', endStick);
stickPad.addEventListener('pointercancel', endStick);

const thrBar = el('thrBar');
let thrId = null, thrBlocked = false;
function moveThr(e){
  if(wreckUntil || thrBlocked) return;    // no controls while the ship is scrap
  const r = thrBar.getBoundingClientRect();
  setThrottle(1 - (e.clientY - r.top)/r.height);
}
thrBar.addEventListener('pointerdown', e=>{
  thrId = e.pointerId;
  try{ thrBar.setPointerCapture(e.pointerId); }catch(err){}
  thrBlocked = !!wreckUntil;              // grabbed mid-explosion: stays inert until released
  moveThr(e); e.preventDefault();
});
thrBar.addEventListener('pointermove', e=>{ if(e.pointerId === thrId) moveThr(e); });
thrBar.addEventListener('pointerup', ()=>{ thrId = null; thrBlocked = false; });
thrBar.addEventListener('pointercancel', ()=>{ thrId = null; thrBlocked = false; });

renderer.domElement.addEventListener('wheel', e=>{
  if(!pilot) return;
  e.preventDefault();
  if(wreckUntil) return;
  setThrottle(throttle - Math.sign(e.deltaY)*0.06);
}, {passive:false});

const STEER_KEYS = {
  ArrowLeft:['x',-1], KeyA:['x',-1], ArrowRight:['x',1],  KeyD:['x',1],
  ArrowUp:  ['y',-1], KeyW:['y',-1], ArrowDown:['y',1],   KeyS:['y',1]
};
function steerKey(code, down){
  const m = STEER_KEYS[code];
  if(!m) return false;
  keyIn[m[0]] = down ? m[1] : (keyIn[m[0]] === m[1] ? 0 : keyIn[m[0]]);
  return true;
}
addEventListener('keyup', e=>{
  if(!pilot) return;
  if(steerKey(e.code, false)) e.preventDefault();
  if(e.code === 'Space') braking = false;
});
addEventListener('blur', ()=>{ keyIn.x = keyIn.y = 0; braking = false; });

el('pilotBtn').onclick = ()=>{ pilot ? exitPilot() : enterPilot(); };
el('ckExit').onclick = ()=> exitPilot();
el('ckData').onclick = ()=> exitPilot(arrivedKey);
el('ckVoice').onclick = ()=>{
  ckVoiceOn = !ckVoiceOn;
  el('ckVoice').classList.toggle('on', ckVoiceOn);
  if(!ckVoiceOn){ try{ synth.cancel(); }catch(e){} sayBusy = false; engineDuck(false); }
};
el('ckEngine').onclick = ()=>{
  engineOn = !engineOn;
  el('ckEngine').classList.toggle('on', engineOn);
  // a classroom silences the engine but keeps the narration, so remember it
  try{ localStorage.setItem(ENGINE_KEY, engineOn ? 'on' : 'off'); }catch(e){}
  if(engineOn && audioInit()) audioSet('resume');
  engineUpdate();
};
el('ckEngine').classList.toggle('on', engineOn);
// registered outside the speech block: the engine must stop in a hidden tab
// whether or not this browser can speak
document.addEventListener('visibilitychange', ()=>{
  if(!actx) return;
  if(document.hidden) audioSet('suspend');
  else if(pilot) audioSet('resume');
});
setThrottle(0);

/* ================= full screen =================
   Prefixed calls are still needed for Safari, and iPhone Safari has no
   element fullscreen at all — there the button is hidden rather than left
   as a control that does nothing when a child presses it. */
const ICO_FS_IN  = '<path d="M4 9V4.5h4.6M20 9V4.5h-4.6M4 15v4.5h4.6M20 15v4.5h-4.6"/>';
const ICO_FS_OUT = '<path d="M8.8 4.4V9H4.2M15.2 4.4V9h4.6M8.8 19.6V15H4.2M15.2 19.6V15h4.6"/>';
const fsEnabled = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;

function toggleFullscreen(){
  const root = document.documentElement;
  try{
    if(fsElement()){
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      const r = exit && exit.call(document);
      if(r && r.catch) r.catch(()=>{});
    } else {
      const enter = root.requestFullscreen || root.webkitRequestFullscreen;
      const r = enter && enter.call(root, {navigationUI:'hide'});
      if(r && r.catch) r.catch(()=>{});
    }
  }catch(e){}
}
function syncFullscreenUI(){
  const on = !!fsElement();
  for(const id of ['fsBtn', 'ckFs']){          // top bar and cockpit share the state
    const b = el(id);
    b.classList.toggle('hide', !fsEnabled);
    b.classList.toggle('on', on);
    b.querySelector('svg').innerHTML = on ? ICO_FS_OUT : ICO_FS_IN;
    b.title = t(on ? 'fsOff' : 'fsOn');
  }
}
el('fsBtn').onclick = toggleFullscreen;
el('ckFs').onclick = toggleFullscreen;
document.addEventListener('fullscreenchange', syncFullscreenUI);
document.addEventListener('webkitfullscreenchange', syncFullscreenUI);
syncFullscreenUI();

/* ================= install as an app =================
   Chromium fires beforeinstallprompt and lets the page ask at a moment of its
   choosing; the button only appears when there is a prompt to show, so it is
   never a dead control. iOS has no such event — Safari installs through its
   own Share menu, so nothing is shown there. */
let installPrompt = null;
addEventListener('beforeinstallprompt', e=>{
  e.preventDefault();
  installPrompt = e;
  el('installBtn').classList.remove('hide');
  el('installBtn').title = t('install');
});
el('installBtn').onclick = async ()=>{
  if(!installPrompt) return;
  el('installBtn').classList.add('hide');
  try{
    installPrompt.prompt();
    await installPrompt.userChoice;
  }catch(e){}
  installPrompt = null;
};
addEventListener('appinstalled', ()=>{
  installPrompt = null;
  el('installBtn').classList.add('hide');
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

  updateBoom(dt);      // debris keeps flying even after the child leaves the cockpit

  // camera: either the child is flying it, or it is on rails
  if(pilot){
    updateShip(dt);
  } else if(flight){
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

  if(!pilot) controls.update();

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
  follow: followObj, flying: !!flight,
  pilot, throttle: +throttle.toFixed(2), engineOn,
  wrecked: !!wreckUntil, debris: boomLife > 0,
  audio: actx ? {state: actx.state,
    level: +eng.level.gain.value.toFixed(3), duck: +eng.duck.gain.value.toFixed(3),
    cutoff: Math.round(eng.nFilt.frequency.value)} : null,
  fwd: new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion).toArray().map(v=>+v.toFixed(3)),
  up: new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion).toArray().map(v=>+v.toFixed(3))
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
