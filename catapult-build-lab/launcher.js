// Shared 3D model of the V5 catapult launcher, used by the Build Lab, the Builder and the Launch Lab.
// Needs catapult-build-lab/parts.js loaded first (window.VEX_PARTS). Units are inches.
export function createLauncher(THREE, scene) {
const V = (x, y, z) => new THREE.Vector3(x, y, z);
// ---------- Real part meshes ----------
function b64(s, T) { const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new T(u.buffer); }
const SMOOTH = { col: 1, spc: 1, sc12: 1, sc38: 1 };
const GEO = {};
function geo(key) {
  if (GEO[key]) return GEO[key];
  const d = window.VEX_PARTS[key];
  const q = b64(d.p, Int16Array), idx = b64(d.i, d.w === 2 ? Uint16Array : Uint32Array);
  const pos = new Float32Array(q.length);
  for (let i = 0; i < q.length; i++) pos[i] = q[i] * d.s + d.c[i % 3];
  let g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  if (!SMOOTH[key]) g = g.toNonIndexed();
  g.computeVertexNormals();
  return (GEO[key] = g);
}
const COLORS = { metal: 0xc9ced4, steel: 0x7d838b, dark: 0x2e3238, nylon: 0xf1f0ea, collar: 0x30343a, pla: 0xf08a24, ball: 0xfafafa };
function mat(kind) {
  const c = COLORS[kind];
  const m = new THREE.MeshStandardMaterial({ color: c, metalness: kind === 'metal' || kind === 'steel' ? 0.55 : 0.05, roughness: kind === 'metal' ? 0.38 : 0.5 });
  m.userData.base = c; return m;
}
const KIND = { uch: 'metal', c25: 'metal', c15: 'metal', s2: 'steel', s3: 'steel', s4: 'steel', brg: 'dark', col: 'collar', spc: 'nylon', sc12: 'steel', sc38: 'steel', nut: 'steel' };

// cols = where the part file's x, y and z axes point in the build; t = where the part file's origin goes.
function part(key, cols, t) {
  const m = new THREE.Mesh(geo(key), mat(KIND[key]));
  m.matrixAutoUpdate = false;
  const [a, b, c] = cols;
  m.matrix.set(a[0], b[0], c[0], t[0], a[1], b[1], c[1], t[1], a[2], b[2], c[2], t[2], 0, 0, 0, 1);
  m.castShadow = true; m.receiveShadow = true; m.userData.key = key;
  return m;
}
const X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1], nX = [-1, 0, 0], nY = [0, -1, 0], nZ = [0, 0, -1];

// ---------- Layout (inches). x points to the front (band end), y up, z sideways. ----------
const PX = 1.75, PY = 6.33;            // pivot: upright hole 11, front column
const STOP = { A: 7.33, B: 7.83, C: 8.33 }; // back column (x = 1.25), holes 13, 14, 15
const ARM_LOW = 0.248, BAR_R = 0.0625;
const root = new THREE.Group(); scene.add(root);
const armPivot = new THREE.Group(); armPivot.position.set(PX, PY, 0); root.add(armPivot);

const ITEMS = [];   // { obj, step, from, name }
function item(step, name, obj, from, parent = root) {
  const g = new THREE.Group(); g.add(obj); parent.add(g);
  ITEMS.push({ g, step, from: from || V(0, 3, 0), name, mats: [] });
  obj.traverse(o => { if (o.isMesh) ITEMS[ITEMS.length - 1].mats.push(o.material); });
  return g;
}

// Step 1: spine (U-channel, open side up)
item(1, 'Spine', part('uch', [X, nY, nZ], [0, 1.080, -0.01]), V(0, 4, 0));
// Step 2: cross members (open side down) under spine holes 1-2 and 19-20, with screws and nuts
for (const cx of [-4.5, 4.5]) item(2, 'Cross member', part('uch', [Z, Y, nX], [cx - 0.01, 0.954, 0]), V(0, -0.1, cx > 0 ? 6 : -6));
for (const [x, z] of [[-4.75, -0.25], [-4.25, 0.25], [4.25, -0.25], [4.75, 0.25]]) {
  item(2, 'Screw 3/8"', part('sc38', [nY, X, Z], [x, 1.167, z]), V(0, 2.5, 0));
  item(2, 'Nut', part('nut', [X, Y, Z], [x, 0.893, z]), V(0, -2, 0));
}
// Step 3: uprights on the outside of the spine walls over spine holes 13-14, spaced out 1/8"
item(3, 'Upright', part('c15', [Y, X, nZ], [1.5, 2.33, 0.758]), V(0, 7, 2));
item(3, 'Upright', part('c15', [Y, nX, Z], [1.5, 2.33, -0.758]), V(0, 7, -2));
for (const s of [1, -1]) for (const x of [1.25, 1.75]) for (const y of [1.33, 1.83]) {
  item(3, 'Spacer 1/8"', part('spc', [X, s > 0 ? Z : nZ, s > 0 ? nY : Y], [x, y, s * 0.6335]), V(0, 0, s * 2.2));
  item(3, 'Screw 1/2"', part('sc12', s > 0 ? [nZ, Y, X] : [Z, Y, nX], [x, y, s * 0.845]), V(0, 0, s * 2.6));
  item(3, 'Nut', part('nut', [X, s > 0 ? Z : nZ, s > 0 ? nY : Y], [x, y, s * 0.447]), V(0, 2.5, 0));
}
// Step 4: flat bearings on the outside of each upright, centered on hole 11
item(4, 'Flat bearing', part('brg', [Z, Y, nX], [1.248, 5.292, -2.495]), V(0, 0, 2.5));
item(4, 'Flat bearing', part('brg', [nZ, Y, X], [2.252, 5.292, 2.495]), V(0, 0, -2.5));
for (const s of [1, -1]) for (const y of [PY - 0.5, PY + 0.5]) {
  // The bearing is 0.277" thick at the screw holes, so these need 1/2" screws (head sits on the bearing face at 1.035).
  item(4, 'Screw 1/2"', part('sc12', s > 0 ? [nZ, Y, X] : [Z, Y, nX], [1.75, y, s * 1.122]), V(0, 0, s * 2.5));
  item(4, 'Nut', part('nut', [X, s > 0 ? Z : nZ, s > 0 ? nY : Y], [1.75, y, s * 0.635]), V(0, 2.5, 0));
}
// Step 5: pivot shaft, arm (hole 6 from the short end), collars
item(5, '4" shaft (pivot)', part('s4', [X, Y, Z], [PX, PY, -1.98]), V(0, 0, 5));
for (const s of [1, -1]) item(5, 'Collar', part('col', [X, Y, Z], [PX, PY, s * 1.165]), V(0, 0, s * 2));
item(5, 'Arm', part('c25', [nX, Z, Y], [-3.5, 0.24, 0]), V(0, 4, 0), armPivot);
// Step 6: stop bar
const stopG = new THREE.Group(); root.add(stopG);
item(6, '3" shaft (stop bar)', part('s3', [X, Y, Z], [0, 0, -1.48]), V(0, 0, 4.5), stopG);
for (const s of [1, -1]) item(6, 'Collar', part('col', [X, Y, Z], [0, 0, s * 0.888]), V(0, 0, s * 2), stopG);
// Step 7: band peg (arm hole 2 from short end) and catch pin (hole 9 from long end)
item(7, '2" shaft (band peg)', part('s2', [X, Y, Z], [2.0, 0, -0.98]), V(0, 0, 3.5), armPivot);
item(7, '4" shaft (catch pin)', part('s4', [X, Y, Z], [-5.5, 0, -1.98]), V(0, 0, 5), armPivot);
for (const s of [1, -1]) {
  item(7, 'Collar', part('col', [X, Y, Z], [2.0, 0, s * 0.63]), V(0, 0, s * 2), armPivot);
  item(7, 'Collar', part('col', [X, Y, Z], [-5.5, 0, s * 0.63]), V(0, 0, s * 2), armPivot);
}

// Step 9: stand-ins for the student-designed cup and trigger
const pla = () => { const m = mat('pla'); m.transparent = true; m.opacity = 0.9; return m; };
const CUP_X = -9.0;
const cup = new THREE.Group();
const BALL_R = 0.787, BALL_LOCAL = V(CUP_X, 0.302 + 0.26 + 0.787, 0);  // ping-pong ball (40 mm) resting in the cup
let ball;
{
  const prof = [[0, 0], [0.95, 0], [1.02, 0.08], [1.02, 0.6], [0.94, 0.6], [0.9, 0.14], [0, 0.14]].map(([x, y]) => new THREE.Vector2(x, y));
  const m = new THREE.Mesh(new THREE.LatheGeometry(prof, 40), pla()); m.material.side = THREE.DoubleSide; m.position.set(CUP_X, 0.302 + 0.12, 0);
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 1.0), pla()); base.position.set(CUP_X, 0.302 + 0.06, 0);
  ball = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 32, 20), mat('ball')); ball.position.copy(BALL_LOCAL);
  [m, base, ball].forEach(o => { o.castShadow = true; cup.add(o); });
}
item(9, 'Ball cup (yours)', cup, V(0, 3, 0), armPivot);

// Cocked angle: the bottom of the arm's flanges rests on the back end of the spine walls.
const PHI_COCK = (() => { const dx = -5 - PX, dy = 2.034 - PY, r = Math.hypot(dx, dy); return Math.atan2(-dy, -dx) - Math.asin(ARM_LOW / r); })();
const stopTheta = y => { const dy = y - PY, d = 0.5; return Math.atan2(d, dy) + Math.asin((ARM_LOW + BAR_R) / Math.hypot(d, dy)); };
const PHI_STOP = -(Math.PI / 2 - stopTheta(STOP.B));
stopG.position.set(1.25, STOP.B, 0);

const trig = new THREE.Group();
{
  const p = V(-5.5, 0, 0).applyAxisAngle(V(0, 0, 1), PHI_COCK).add(V(PX, PY, 0));
  const B = (sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), pla()); m.position.set(x, y, z); m.castShadow = true; trig.add(m); };
  B(1.0, 0.9, 0.35, p.x + 0.1, 1.6, 0.76);
  B(0.45, p.y - 1.25, 0.4, p.x + 0.45, 1.1 + (p.y - 1.25) / 2, 1.3);
  B(1.1, 0.22, 0.4, p.x - 0.1, p.y + 0.24, 1.3);
  B(0.2, 0.32, 0.4, p.x - 0.55, p.y + 0.05, 1.3);
}
item(9, 'Trigger (yours)', trig, V(0, 0, 3));

// Rubber bands (view option only; students don't model them)
const bandG = new THREE.Group(); bandG.visible = false; root.add(bandG);
const bandMat = new THREE.MeshStandardMaterial({ color: 0xc7432c, roughness: 0.75 });
function updateBands() {
  bandG.clear();
  for (const z of [0.8, -0.8]) for (const k of [0.07, -0.07]) {
    const a = armPivot.localToWorld(V(2.0, k, z)), b = V(4.5, 1.02 + k, z);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 6), bandMat);
    m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); m.scale.y = a.distanceTo(b);
    bandG.add(m);
  }
}


// Move the stop bar to hole A, B or C and return the arm angle where it stops.
function setStop(k) { stopG.position.set(1.25, STOP[k], 0); return -(Math.PI / 2 - stopTheta(STOP[k])); }
return { geo, KIND, setStop, ball, BALL_R, BALL_LOCAL, trig, V, root, armPivot, stopG, ITEMS, COLORS, mat, part, PX, PY, STOP, ARM_LOW, BAR_R, PHI_COCK, PHI_STOP, stopTheta, CUP_X, cup, bandG, updateBands };
}
