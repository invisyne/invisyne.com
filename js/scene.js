import * as THREE from 'https://esm.sh/three@0.167.0';

const STREAM_COUNT = 10;
const POINT_COUNT  = 200;
const COLORS = [0x2549FF, 0xBF4DF3];

const canvas   = document.getElementById('bg');
const scene    = new THREE.Scene();
const camera   = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

function noise(x) {
  return Math.sin(x * 1.7) * 0.5 + Math.sin(x * 3.1) * 0.3 + Math.sin(x * 5.3) * 0.2;
}

function createStream(index) {
  const positions = new Float32Array(POINT_COUNT * 3);
  const yBase = (index / (STREAM_COUNT - 1)) * 8 - 4;
  const zPos  = -(Math.random() * 6 + 2);

  for (let i = 0; i < POINT_COUNT; i++) {
    positions[i * 3]     = (i / (POINT_COUNT - 1)) * 14 - 7;
    positions[i * 3 + 1] = yBase;
    positions[i * 3 + 2] = zPos;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.LineBasicMaterial({
    color:       COLORS[index % COLORS.length],
    transparent: true,
    opacity:     0.4 + Math.random() * 0.2,
  });

  const line = new THREE.Line(geometry, material);
  scene.add(line);

  return {
    line,
    yBase,
    zPos,
    speed:       0.006 + Math.random() * 0.004,
    amplitude:   0.05  + Math.random() * 0.1,
    noiseOffset: Math.random() * 1000,
  };
}

const streams = Array.from({ length: STREAM_COUNT }, (_, i) => createStream(i));

let time = 0;

function animate() {
  requestAnimationFrame(animate);
  time += 1;

  for (const stream of streams) {
    const pos = stream.line.geometry.attributes.position.array;
    for (let i = 0; i < POINT_COUNT; i++) {
      const t = time * stream.speed + (i / POINT_COUNT) * 4 + stream.noiseOffset;
      pos[i * 3]     = (i / (POINT_COUNT - 1)) * 14 - 7;
      pos[i * 3 + 1] = stream.yBase + noise(t) * stream.amplitude;
      pos[i * 3 + 2] = stream.zPos;
    }
    stream.line.geometry.attributes.position.needsUpdate = true;
  }

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
