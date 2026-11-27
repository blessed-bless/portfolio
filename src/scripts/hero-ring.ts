import {
  CanvasTexture,
  Color,
  Group,
  MathUtils,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
  type Texture,
} from 'three';
import type { Project } from '../lib/work-types';
import { applyTextureQuality, rasterizeCoverUrl } from './cover-texture';
import { maxPixelRatio } from './perf';
import { observeActivity, subscribeTicker } from './raf-hub';

export type RingHandle = {
  dispose: () => void;
  playIntro: () => Promise<void>;
  replayCover: () => void;
  getActiveIndex: () => number;
  goBy: (delta: number) => void;
};

type MountOptions = {
  projects: Project[];
  onActiveIndexChange: (index: number) => void;
  onSelect: (project: Project) => void;
  reducedMotion: boolean;
  showIntro: boolean;
  ariaLabel?: string;
};

type Panel = {
  mesh: Mesh;
  material: ShaderMaterial;
  cover: string;
};

const ACCENT = new Color('#8B5CF6');

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorld;
  uniform sampler2D uMap;
  uniform vec3 uAccent;
  uniform float uDim;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorld);
    float rim = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 2.15);
    vec3 tex = texture2D(uMap, vUv).rgb;
    float grain = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
    vec3 rgb = tex + uAccent * rim * 0.62 + (grain - 0.5) * 0.045;
    gl_FragColor = vec4(rgb, 1.0 - uDim * 0.42);
    #include <colorspace_fragment>
  }
`;

function wrapIndex(value: number, length: number): number {
  return ((value % length) + length) % length;
}

function bendPlane(geometry: PlaneGeometry): void {
  const position = geometry.attributes.position;
  if (!position) return;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    position.setZ(i, -x * x * 0.18);
  }
  geometry.computeVertexNormals();
}

function solidTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 4;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = '#16131c';
    context.fillRect(0, 0, 4, 4);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

async function loadCover(url: string): Promise<Texture> {
  try {
    const texture = await rasterizeCoverUrl(url, 'art', { width: 720, anisotropy: 4 });
    applyTextureQuality(texture, 4);
    return texture;
  } catch {
    return solidTexture();
  }
}

function nearestAngle(current: number, index: number, step: number): number {
  const base = -index * step;
  const turns = Math.round((current - base) / (Math.PI * 2));
  return base + turns * Math.PI * 2;
}

export async function mountHeroRing(
  canvas: HTMLCanvasElement,
  options: MountOptions,
): Promise<RingHandle | null> {
  if (!options.projects.length || options.reducedMotion) return null;

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch {
    return null;
  }

  const projects = options.projects;
  const count = projects.length;
  const step = (Math.PI * 2) / count;
  const radius = count <= 4 ? 3.15 : 3.7;

  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio()));
  if (options.ariaLabel) canvas.setAttribute('aria-label', options.ariaLabel);

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.1, 40);
  camera.position.set(0, 0.12, 7.4);

  const ring = new Group();
  scene.add(ring);

  const geometry = new PlaneGeometry(2.25, 1.4, 28, 1);
  bendPlane(geometry);

  const panels: Panel[] = [];
  for (let index = 0; index < count; index += 1) {
    const project = projects[index];
    if (!project) continue;
    const material = new ShaderMaterial({
      uniforms: {
        uMap: { value: solidTexture() },
        uAccent: { value: ACCENT },
        uDim: { value: 0 },
      },
      vertexShader,
      fragmentShader,
    });
    const mesh = new Mesh(geometry, material);
    const angle = index * step;
    mesh.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);
    mesh.rotation.y = angle;
    mesh.userData.index = index;
    ring.add(mesh);
    panels.push({ mesh, material, cover: project.cover });
  }

  await Promise.all(
    panels.map(async (panel) => {
      const texture = await loadCover(panel.cover);
      const previous = panel.material.uniforms.uMap?.value as Texture | undefined;
      if (previous && previous !== texture) previous.dispose();
      if (panel.material.uniforms.uMap) panel.material.uniforms.uMap.value = texture;
    }),
  );

  let disposed = false;
  let running = true;
  let target = options.showIntro ? 0.7 : 0;
  let current = target;
  let kick = 0;
  let activeIndex = 0;
  let pointerId: number | null = null;
  let lastX = 0;
  let dragged = false;
  const pointer = new Vector2();
  const raycaster = new Raycaster();

  const resize = (): void => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width < 2 || height < 2) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  resize();

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  const publish = (index: number): void => {
    if (index === activeIndex) return;
    activeIndex = index;
    options.onActiveIndexChange(index);
  };

  const aimAt = (index: number): void => {
    target = nearestAngle(target, wrapIndex(index, count), step);
  };

  const paint = (): void => {
    panels.forEach((panel, index) => {
      const uniform = panel.material.uniforms.uDim;
      if (!uniform) return;
      const dim = index === activeIndex ? 0 : 1;
      uniform.value = MathUtils.damp(uniform.value as number, dim, 6, 0.016);
    });
    ring.rotation.y = current + kick;
    renderer.render(scene, camera);
    canvas.dataset.ready = 'true';
  };

  const stopObserve = observeActivity(canvas, (active) => {
    running = active;
  });

  const unsubscribe = subscribeTicker(() => {
    if (disposed || !running) return;
    current = MathUtils.damp(current, target, 7, 0.016);
    kick = MathUtils.damp(kick, 0, 5, 0.016);
    const index = wrapIndex(Math.round(-current / step), count);
    publish(index);
    const rect = canvas.getBoundingClientRect();
    const parallaxX = rect.width > 0 ? (pointer.x * 0.5) * 0.28 : 0;
    const parallaxY = rect.height > 0 ? (pointer.y * 0.5) * -0.16 : 0;
    camera.position.x = MathUtils.damp(camera.position.x, parallaxX, 4, 0.016);
    camera.position.y = MathUtils.damp(camera.position.y, 0.12 + parallaxY, 4, 0.016);
    camera.lookAt(0, 0, 0);
    paint();
  });

  const localPointer = (event: PointerEvent): void => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1;
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    pointerId = event.pointerId;
    lastX = event.clientX;
    dragged = false;
    canvas.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent): void => {
    localPointer(event);
    if (pointerId !== event.pointerId) return;
    const delta = event.clientX - lastX;
    if (Math.abs(delta) > 2) dragged = true;
    lastX = event.clientX;
    target += delta * 0.006;
  };

  const onPointerUp = (event: PointerEvent): void => {
    if (pointerId !== event.pointerId) return;
    pointerId = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (!dragged) {
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(panels.map((panel) => panel.mesh))[0];
      const index = hit?.object.userData.index;
      if (typeof index === 'number') {
        if (index === activeIndex) {
          const project = projects[index];
          if (project) options.onSelect(project);
        } else {
          aimAt(index);
        }
        return;
      }
    }
    aimAt(wrapIndex(Math.round(-target / step), count));
  };

  const onKey = (event: KeyboardEvent): void => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      event.stopPropagation();
      aimAt(activeIndex - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      event.stopPropagation();
      aimAt(activeIndex + 1);
    } else if (event.key === 'Enter') {
      const project = projects[activeIndex];
      if (project) options.onSelect(project);
    }
  };

  const onLost = (event: Event): void => {
    event.preventDefault();
    canvas.dataset.ready = 'false';
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('keydown', onKey);
  canvas.addEventListener('webglcontextlost', onLost);

  const themeObserver = new MutationObserver(() => {
    void Promise.all(
      panels.map(async (panel) => {
        const texture = await loadCover(panel.cover);
        if (disposed) {
          texture.dispose();
          return;
        }
        const previous = panel.material.uniforms.uMap?.value as Texture | undefined;
        if (previous) previous.dispose();
        if (panel.material.uniforms.uMap) panel.material.uniforms.uMap.value = texture;
      }),
    );
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    unsubscribe();
    stopObserve();
    resizeObserver.disconnect();
    themeObserver.disconnect();
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerUp);
    canvas.removeEventListener('keydown', onKey);
    canvas.removeEventListener('webglcontextlost', onLost);
    panels.forEach((panel) => {
      const texture = panel.material.uniforms.uMap?.value as Texture | undefined;
      texture?.dispose();
      panel.material.dispose();
    });
    geometry.dispose();
    renderer.dispose();
    canvas.dataset.ready = 'false';
  };

  return {
    dispose,
    getActiveIndex: () => activeIndex,
    goBy: (delta) => aimAt(activeIndex + delta),
    replayCover: () => {
      kick = 0.42;
    },
    playIntro: () =>
      new Promise((resolve) => {
        target = 0;
        const started = performance.now();
        const wait = (): void => {
          if (disposed || performance.now() - started > 900 || Math.abs(current - target) < 0.02) {
            resolve();
            return;
          }
          window.setTimeout(wait, 40);
        };
        wait();
      }),
  };
}
