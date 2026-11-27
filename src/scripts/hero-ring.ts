import {
  Color,
  Group,
  LinearFilter,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  WebGLRenderer,
  type Texture,
} from 'three';
import type { Project } from '../lib/work-types';
import { rasterizeCoverUrl } from './cover-texture';
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
  material: MeshBasicMaterial;
  cover: string;
};

const ACCENT = new Color('#8B5CF6');

const glowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const glowFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec3 uColor;
  void main() {
    float dist = distance(vUv, vec2(0.5));
    float alpha = smoothstep(0.5, 0.08, dist) * 0.38;
    gl_FragColor = vec4(uColor, alpha);
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

function showAsPhoto(texture: Texture): Texture {
  texture.colorSpace = SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.anisotropy = 1;
  texture.needsUpdate = true;
  return texture;
}

function loadImageTexture(url: string): Promise<Texture> {
  const loader = new TextureLoader();
  loader.setCrossOrigin('anonymous');
  return new Promise((resolve, reject) => {
    loader.load(url, (texture) => resolve(showAsPhoto(texture)), undefined, () => reject(new Error(url)));
  });
}

async function loadCover(url: string): Promise<Texture | null> {
  const absolute = new URL(url, window.location.origin).href;
  try {
    if (/\.svg(\?|$)/i.test(url)) {
      const texture = await rasterizeCoverUrl(absolute, 'art', { width: 1024, height: 640 });
      return showAsPhoto(texture);
    }
    return await loadImageTexture(absolute);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'cover';
    console.warn(`hero cover failed: ${url} (${message})`);
    return null;
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
  const radius = 5.35;

  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio(), 1.5));
  if (options.ariaLabel) canvas.setAttribute('aria-label', options.ariaLabel);

  const textures = await Promise.all(projects.map((project) => loadCover(project.cover)));
  if (textures.some((texture) => !texture)) {
    textures.forEach((texture) => texture?.dispose());
    renderer.dispose();
    return null;
  }

  const scene = new Scene();
  const camera = new PerspectiveCamera(34, 1, 0.1, 60);
  camera.position.set(0, 0.15, 13.1);

  const ring = new Group();
  scene.add(ring);
  const glow = new Mesh(
    new PlaneGeometry(9.5, 6.2),
    new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uColor: { value: ACCENT } },
      vertexShader: glowVertex,
      fragmentShader: glowFragment,
    }),
  );
  glow.position.z = -2.4;
  scene.add(glow);

  const geometry = new PlaneGeometry(2.15, 1.34, 24, 1);
  bendPlane(geometry);

  const panels: Panel[] = [];
  projects.forEach((project, index) => {
    const texture = textures[index];
    if (!texture) return;
    const material = new MeshBasicMaterial({ map: texture });
    const mesh = new Mesh(geometry, material);
    const angle = index * step;
    mesh.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);
    mesh.rotation.y = angle;
    mesh.userData.index = index;
    ring.add(mesh);
    panels.push({ mesh, material, cover: project.cover });
  });

  let disposed = false;
  let running = true;
  let target = options.showIntro ? 0.7 : 0;
  let current = target;
  let kick = 0;
  let activeIndex = 0;
  let pointerId: number | null = null;
  let lastX = 0;
  let dragged = false;
  let dragging = false;
  let velocity = 0;
  let idle = 0;
  let hovering = false;
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
      const active = index === activeIndex;
      const aim = active && hovering ? 1.06 : active ? 1 : 0.86;
      const nextScale = MathUtils.damp(panel.mesh.scale.x, aim, 7, 0.016);
      panel.mesh.scale.setScalar(nextScale);
      const shade = active ? 1 : 0.62;
      panel.material.color.r = MathUtils.damp(panel.material.color.r, shade, 6, 0.016);
      panel.material.color.g = panel.material.color.r;
      panel.material.color.b = panel.material.color.r;
    });
    const sway = dragging ? 0 : Math.sin(idle) * 0.05;
    ring.rotation.y = current + kick + sway;
    renderer.render(scene, camera);
    canvas.dataset.ready = 'true';
  };

  const stopObserve = observeActivity(canvas, (active) => {
    running = active;
  });

  const unsubscribe = subscribeTicker(() => {
    if (disposed || !running) return;
    if (!dragging) {
      velocity *= 0.92;
      target += velocity;
      idle += 0.012;
      if (Math.abs(velocity) < 0.0005) {
        velocity = 0;
        const snapped = nearestAngle(target, wrapIndex(Math.round(-target / step), count), step);
        target = MathUtils.damp(target, snapped, 6, 0.016);
      }
    }
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
    dragging = true;
    velocity = 0;
    canvas.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent): void => {
    localPointer(event);
    hovering = true;
    if (pointerId !== event.pointerId) return;
    const delta = event.clientX - lastX;
    if (Math.abs(delta) > 2) dragged = true;
    lastX = event.clientX;
    velocity = delta * 0.008;
    target += velocity;
  };

  const onPointerUp = (event: PointerEvent): void => {
    if (pointerId !== event.pointerId) return;
    pointerId = null;
    dragging = false;
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
  };

  const onPointerLeave = (): void => {
    hovering = false;
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
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('keydown', onKey);
  canvas.addEventListener('webglcontextlost', onLost);

  const themeObserver = new MutationObserver(() => {
    void Promise.all(
      panels.map(async (panel) => {
        const texture = await loadCover(panel.cover);
        if (!texture || disposed) {
          texture?.dispose();
          return;
        }
        const previous = panel.material.map;
        panel.material.map = texture;
        panel.material.needsUpdate = true;
        previous?.dispose();
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
    canvas.removeEventListener('pointerleave', onPointerLeave);
    canvas.removeEventListener('keydown', onKey);
    canvas.removeEventListener('webglcontextlost', onLost);
    panels.forEach((panel) => {
      panel.material.map?.dispose();
      panel.material.dispose();
    });
    geometry.dispose();
    glow.geometry.dispose();
    (glow.material as ShaderMaterial).dispose();
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
