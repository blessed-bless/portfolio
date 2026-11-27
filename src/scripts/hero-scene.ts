import {
  Clock,
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
  Texture,
  Vector2,
  WebGLRenderer,
} from 'three';
import type { Project } from '../lib/work-types';
import { applyTextureQuality, rasterizeCoverUrl } from './cover-texture';
import { getLenis } from './lenis-scroll';
import { getPerfTier, maxPixelRatio, perfAllows } from './perf';
import { observeActivity, subscribeTicker } from './raf-hub';

export type SceneHandle = {
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
  /** Localized name for the WebGL carousel canvas. */
  ariaLabel?: string;
};

const cardVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const cardFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uBase;
  uniform sampler2D uArt;
  uniform float uHover;
  uniform float uDim;
  uniform float uPlayback;
  uniform float uCoverKind;
  uniform vec3 uAccent;

  float rectMask(vec2 p, vec2 low, vec2 high) {
    vec2 inBounds = smoothstep(low, low + vec2(0.002), p)
      * (1.0 - smoothstep(high - vec2(0.002), high, p));
    return inBounds.x * inBounds.y;
  }

  float coverMotion(vec2 p, float t) {
    if (t < 0.0) return 0.0;
    if (uCoverKind < 0.5) {
      float right = mix(0.3625, 0.4375, smoothstep(0.15, 0.38, t));
      return rectMask(p, vec2(0.3625, 0.47), vec2(right, 0.542))
        * smoothstep(0.15, 0.26, t) * mix(1.0, 0.64, smoothstep(0.78, 1.0, t));
    }

    if (uCoverKind < 1.5) {
      float right = mix(0.4375, 0.7875, smoothstep(0.0, 0.65, t));
      float progress = rectMask(p, vec2(0.2625, 0.356), vec2(right, 0.368))
        * smoothstep(0.0, 0.2, t) * mix(1.0, 0.68, smoothstep(0.88, 1.0, t));
      float button = rectMask(p, vec2(0.675, 0.73), vec2(0.7875, 0.778))
        * smoothstep(0.52, 0.7, t) * (1.0 - smoothstep(0.82, 1.0, t)) * 0.7;
      return max(progress, button);
    }

    vec2 position;
    if (t < 0.34) {
      position = mix(vec2(0.324, 0.365), vec2(0.324, 0.614), smoothstep(0.04, 0.34, t));
    } else if (t < 0.58) {
      position = mix(vec2(0.324, 0.614), vec2(0.53, 0.614), smoothstep(0.34, 0.58, t));
    } else if (t < 0.72) {
      position = mix(vec2(0.53, 0.614), vec2(0.53, 0.493), smoothstep(0.58, 0.72, t));
    } else {
      position = mix(vec2(0.53, 0.493), vec2(0.649, 0.493), smoothstep(0.72, 0.91, t));
    }
    float distanceFromDot = length((p - position) * vec2(1.6, 1.0));
    float dotLight = (1.0 - smoothstep(0.014, 0.04, distanceFromDot))
      * smoothstep(0.0, 0.1, t) * (1.0 - smoothstep(0.88, 0.98, t));
    float queue = rectMask(p, vec2(0.6125, 0.437), vec2(0.81875, 0.549))
      * smoothstep(0.79, 0.88, t) * mix(0.30, 0.11, smoothstep(0.94, 1.0, t));
    return max(dotLight, queue);
  }

  void main() {
    vec2 shift = vec2(20.0 / 1600.0, 16.0 / 1000.0) * uHover;
    vec3 base = texture2D(uBase, vUv).rgb;
    vec4 art = texture2D(uArt, vUv - shift);
    vec3 rgb = mix(base, art.rgb, art.a);
    float highlight = coverMotion(vec2(vUv.x, 1.0 - vUv.y), uPlayback);
    rgb = mix(rgb, uAccent, highlight);
    gl_FragColor = vec4(rgb, 1.0 - uDim * 0.48);
    #include <colorspace_fragment>
  }
`;

function wrapIndex(value: number, length: number): number {
  return ((value % length) + length) % length;
}

function shortestOffset(index: number, current: number, length: number): number {
  let diff = index - current;
  if (diff > length / 2) diff -= length;
  if (diff < -length / 2) diff += length;
  return diff;
}

export async function mountHeroScene(
  canvas: HTMLCanvasElement,
  options: MountOptions,
): Promise<SceneHandle | null> {
  const { projects, onActiveIndexChange, onSelect, reducedMotion, ariaLabel } = options;
  if (reducedMotion || projects.length === 0) return null;

  const isMobile = window.matchMedia('(max-width: 720px)').matches;
  const root = canvas.closest<HTMLElement>('[data-hero]');
  const coverUrls = Array.from(
    root?.querySelectorAll<HTMLElement>('[data-hero-cover] [data-cover-src]') ?? [],
  ).map((node) => node.dataset.coverSrc || '');
  if (coverUrls.length !== projects.length || coverUrls.some((url) => !url)) return null;

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
      powerPreference: isMobile ? 'low-power' : 'high-performance',
    });
  } catch {
    canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext();
    return null;
  }
  const releaseRenderer = (): void => {
    renderer.dispose();
    renderer.forceContextLoss();
  };
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setPixelRatio(maxPixelRatio());

  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  const allowShaderWarp = perfAllows('shaderWarp');
  const tier = getPerfTier();

  const coverRasterSize = (): { width: number; height: number } => {
    const parent = canvas.parentElement;
    const planeCss = Math.max((parent?.clientWidth ?? 360) * 0.85, isMobile ? 360 : 480);
    const dpr = maxPixelRatio();
    const floor = tier === 'mid' ? (isMobile ? 768 : 1024) : isMobile ? 1024 : 1280;
    const width = Math.min(tier === 'mid' ? 1536 : 2048, Math.max(floor, Math.round(planeCss * dpr)));
    const height = Math.round((width * 10) / 16);
    return { width, height };
  };

  const loadCovers = async () => {
    const size = coverRasterSize();
    const layers = await Promise.allSettled(
      coverUrls.flatMap((url) => [
        rasterizeCoverUrl(url, 'base', { ...size, anisotropy: maxAnisotropy }),
        rasterizeCoverUrl(url, 'art', { ...size, anisotropy: maxAnisotropy }),
      ]),
    );
    const next = layers.flatMap((layer) => (layer.status === 'fulfilled' ? [layer.value] : []));
    const failure = layers.find((layer) => layer.status === 'rejected');
    if (failure?.status === 'rejected') {
      next.forEach((texture) => texture.dispose());
      throw failure.reason;
    }
    next.forEach((texture) => applyTextureQuality(texture, maxAnisotropy));
    return next;
  };

  let textures: Texture[];
  const initialTheme = document.documentElement.dataset.theme;
  try {
    textures = await loadCovers();
  } catch (error) {
    console.warn('Could not load carousel covers', error);
    releaseRenderer();
    return null;
  }
  if (!canvas.isConnected) {
    textures.forEach((texture) => texture.dispose());
    releaseRenderer();
    return null;
  }

  const scene = new Scene();
  const camera = new PerspectiveCamera(isMobile ? 46 : 34, 1, 0.1, 40);
  camera.position.set(0, 0, 5);

  const clock = new Clock();
  const pointerNdc = new Vector2(0, 0);
  const raycaster = new Raycaster();

  const carousel = new Group();

  scene.add(carousel);

  const cardWidth = isMobile ? 3.35 : 3.55;
  const cardGeo = new PlaneGeometry(cardWidth, cardWidth * 10 / 16);
  const cards: Mesh[] = [];
  const materials: ShaderMaterial[] = [];
  let themeRevision = 0;

  let active = 0;
  let current = 0;
  let dragging = false;
  let lastX = 0;
  let dragStartX = 0;
  let dragDistance = 0;
  let dragOrigin = 0;
  let dragOffset = 0;
  let activePointerId: number | null = null;
  let hoverIndex = -1;
  const hoverProgress = projects.map(() => 0);
  let disposed = false;
  let introProgress = 0;
  let introDone = !options.showIntro;
  let lastCaption = -1;
  let loopActive = true;
  let needsRender = true;
  /** Soft settle toward integer slide (~700ms). */
  const SNAP_DAMP = 7.2;

  const radius = isMobile ? 2.75 : 3.55;
  const step = isMobile ? 0.78 : 0.7;
  const tiltTarget = new Vector2(0, 0);
  const tilt = new Vector2(0, 0);

  const accent = new Color();
  const syncAccent = (): void => {
    accent.setStyle(getComputedStyle(document.documentElement).getPropertyValue('--accent-strong').trim());
  };
  syncAccent();
  let playback = -1;
  let coverMotionQueued = true;
  let motionWasEnabled = root?.dataset.motion === 'on';

  projects.forEach((project, index) => {
    const material = new ShaderMaterial({
      vertexShader: cardVertex,
      fragmentShader: cardFragment,
      uniforms: {
        uBase: { value: textures[index * 2] },
        uArt: { value: textures[index * 2 + 1] },
        uHover: { value: 0 },
        uDim: { value: 0 },
        uPlayback: { value: -1 },
        uCoverKind: { value: project.slug === 'smena' ? 0 : project.slug === 'gran' ? 1 : 2 },
        uAccent: { value: accent },
      },
      transparent: true,
      depthWrite: false,
    });
    materials.push(material);

    const mesh = new Mesh(cardGeo, material);
    mesh.userData.index = index;
    mesh.userData.slug = project.slug;
    cards.push(mesh);
    carousel.add(mesh);
  });

  const layoutCards = (): void => {
    const count = projects.length;
    cards.forEach((mesh, index) => {
      const offset = shortestOffset(index, current, count);
      const angle = offset * step;
      const intro = introDone ? 1 : introProgress;
      const arcY = Math.abs(offset) * (isMobile ? 0.05 : 0.08);
      mesh.position.set(
        Math.sin(angle) * radius * intro,
        -arcY,
        (Math.cos(angle) * radius - radius) * intro,
      );
      mesh.rotation.y = -angle;
      mesh.rotation.x = 0;
      const focus = 1 - Math.min(Math.abs(offset), 1.2) / 1.2;
      const scale = MathUtils.lerp(0.74, 1, focus);
      mesh.scale.setScalar(scale * MathUtils.lerp(0.75, 1, intro));
      mesh.renderOrder = 20 - Math.abs(offset) * 2;
      const material = materials[index];
      if (material) {
        material.uniforms.uDim.value = MathUtils.clamp(Math.abs(offset) * 0.85, 0, 1);
      }
    });
  };

  const resize = (): void => {
    const parent = canvas.parentElement;
    if (!parent) return;
    const width = parent.clientWidth;
    const height = parent.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    const viewHeight = Math.max(cardWidth / camera.aspect, cardWidth * 10 / 16);
    camera.position.z = viewHeight / (2 * 0.92 * Math.tan(MathUtils.degToRad(camera.fov / 2)));
    camera.updateProjectionMatrix();
    needsRender = true;
  };

  const setPointer = (clientX: number, clientY: number): void => {
    const rect = canvas.getBoundingClientRect();
    const x = MathUtils.clamp((clientX - rect.left) / Math.max(rect.width, 1), 0, 1);
    const y = MathUtils.clamp((clientY - rect.top) / Math.max(rect.height, 1), 0, 1);
    pointerNdc.set(x * 2 - 1, -(y * 2 - 1));
    if (!isMobile) {
      tiltTarget.set((x - 0.5) * 0.075, -(y - 0.5) * 0.055);
    }
  };

  const pickCard = (): Mesh | null => {
    raycaster.setFromCamera(pointerNdc, camera);
    const hits = raycaster.intersectObjects(cards, false);
    return hits[0]?.object instanceof Mesh ? hits[0].object : null;
  };

  const goBy = (delta: number): void => {
    if (!delta) return;
    active = Math.round(active) + Math.sign(delta);
    needsRender = true;
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (dragging && activePointerId !== null && event.pointerId !== activePointerId) return;
    setPointer(event.clientX, event.clientY);
    if (dragging) {
      event.preventDefault();
      const dx = event.clientX - lastX;
      lastX = event.clientX;
      dragDistance += Math.abs(dx);
      const parentWidth = Math.max(canvas.parentElement?.clientWidth ?? 360, 280);
      dragOffset = MathUtils.clamp(dragOffset - dx / (parentWidth * 0.42), -1, 1);
      current = dragOrigin + dragOffset;
    } else {
      const hit = pickCard();
      hoverIndex = hit && event.pointerType === 'mouse' ? Number(hit.userData.index) : -1;
      canvas.style.cursor = hit ? 'pointer' : 'grab';
    }
  };

  const onPointerLeave = (): void => {
    if (dragging) return;
    hoverIndex = -1;
    tiltTarget.set(0, 0);
    needsRender = true;
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    event.preventDefault();
    setPointer(event.clientX, event.clientY);
    dragging = true;
    activePointerId = event.pointerId;
    hoverIndex = -1;
    lastX = event.clientX;
    dragStartX = event.clientX;
    dragDistance = 0;
    dragOrigin = Math.round(current);
    dragOffset = current - dragOrigin;
    active = dragOrigin;
    getLenis()?.stop();
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
    canvas.style.cursor = 'grabbing';
  };

  const onPointerUp = (event: PointerEvent): void => {
    if (!dragging) return;
    if (activePointerId !== null && event.pointerId !== activePointerId) return;
    dragging = false;
    activePointerId = null;
    getLenis()?.start();
    try {
      canvas.releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
    const isClick = event.type === 'pointerup' && dragDistance < 8 && Math.abs(event.clientX - dragStartX) < 8;
    if (isClick) {
      setPointer(event.clientX, event.clientY);
      const hit = pickCard();
      if (hit) {
        const index = Number(hit.userData.index);
        const currentIndex = wrapIndex(Math.round(current), projects.length);
        if (index === currentIndex) {
          const project = projects[index];
          if (project?.hasPage) onSelect(project);
        } else {
          const offset = shortestOffset(index, currentIndex, projects.length);
          active = Math.round(current) + Math.sign(offset);
        }
      }
    } else {
      if (dragOffset > 0.12) active = dragOrigin + 1;
      else if (dragOffset < -0.12) active = dragOrigin - 1;
      else active = dragOrigin;
    }
    canvas.style.cursor = 'grab';
  };

  const onKey = (event: KeyboardEvent): void => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goBy(1);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goBy(-1);
    }
    if (event.key === 'Enter') {
      const project = projects[wrapIndex(Math.round(current), projects.length)];
      if (project?.hasPage) onSelect(project);
    }
  };

  const onTheme = (): void => {
    syncAccent();
    const revision = ++themeRevision;
    void loadCovers().then((nextTextures) => {
      if (disposed || revision !== themeRevision) {
        nextTextures.forEach((texture) => texture.dispose());
        return;
      }
      materials.forEach((material, index) => {
        material.uniforms.uBase.value = nextTextures[index * 2];
        material.uniforms.uArt.value = nextTextures[index * 2 + 1];
      });
      textures.forEach((texture) => texture.dispose());
      textures = nextTextures;
    }).catch((error: unknown) => {
      console.warn('Could not refresh carousel covers', error);
    });
  };

  const themeObserver = new MutationObserver(onTheme);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  if (initialTheme !== document.documentElement.dataset.theme) onTheme();

  const requestFrame = (): void => {
    needsRender = true;
  };

  const render = (_time: number, deltaMs: number): void => {
    if (disposed || !loopActive) return;
    const elapsed = Math.min((deltaMs || clock.getDelta() * 1000) / 1000, 0.033);
    const dt = elapsed;
    const motionEnabled = root?.dataset.motion === 'on';
    if (motionEnabled !== motionWasEnabled) {
      motionWasEnabled = motionEnabled;
      needsRender = true;
    }
    let moving = dragging || Math.abs(current - active) > 0.0015 || !introDone;

    if (!dragging) {
      const prev = current;
      current = motionEnabled ? MathUtils.damp(current, active, SNAP_DAMP, dt) : active;
      if (Math.abs(current - active) < 0.0015) current = active;
      if (Math.abs(current - prev) > 0.0001) moving = true;
    }

    const prevTiltX = tilt.x;
    const prevTiltY = tilt.y;
    if (motionEnabled) tilt.lerp(tiltTarget, 0.08);
    else tilt.set(0, 0);
    if (Math.abs(tilt.x - prevTiltX) > 0.0001 || Math.abs(tilt.y - prevTiltY) > 0.0001) {
      moving = true;
    }
    carousel.rotation.y = tilt.x;
    carousel.rotation.x = tilt.y;
    layoutCards();

    materials.forEach((material, index) => {
      if (!allowShaderWarp || !motionEnabled) {
        material.uniforms.uHover.value = 0;
        hoverProgress[index] = 0;
        return;
      }
      const direction = hoverIndex === index ? 1 : -1;
      const progress = MathUtils.clamp(hoverProgress[index] + (direction * elapsed) / 0.5, 0, 1);
      if (Math.abs(progress - hoverProgress[index]) > 0.001) moving = true;
      hoverProgress[index] = progress;
      material.uniforms.uHover.value = MathUtils.smoothstep(progress, 0, 1);
      if (progress > 0 && progress < 1) moving = true;
    });

    const rounded = wrapIndex(Math.round(current), projects.length);
    if (rounded !== lastCaption) {
      lastCaption = rounded;
      playback = -1;
      coverMotionQueued = true;
      needsRender = true;
      onActiveIndexChange(rounded);
    }

    if (motionEnabled && coverMotionQueued && introDone && !dragging && Math.abs(current - active) < 0.035) {
      coverMotionQueued = false;
      playback = 0;
    }
    if (playback >= 0 && playback < 1) {
      playback = motionEnabled ? Math.min(1, playback + elapsed / 1.6) : -1;
      moving = true;
    }
    materials.forEach((material, index) => {
      material.uniforms.uPlayback.value = motionEnabled && index === rounded ? playback : -1;
    });

    if (!needsRender && !moving) return;
    needsRender = false;
    renderer.render(scene, camera);
  };

  resize();
  layoutCards();
  window.addEventListener('resize', resize);
  canvas.addEventListener('pointermove', onPointerMove, { passive: false });
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('keydown', onKey);

  const unsubTicker = subscribeTicker(render);
  const unsubActivity = observeActivity(canvas, (activeNow) => {
    loopActive = activeNow;
    if (activeNow) requestFrame();
  });
  const onPointerPaint = (): void => requestFrame();
  canvas.addEventListener('pointermove', onPointerPaint, { passive: true });

  canvas.dataset.ready = 'true';
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', ariaLabel || 'Carousel');
  requestFrame();

  return {
    replayCover: () => {
      playback = -1;
      coverMotionQueued = true;
      requestFrame();
    },
    getActiveIndex: () => wrapIndex(Math.round(current), projects.length),
    goBy: (delta: number) => {
      goBy(delta);
      requestFrame();
    },
    playIntro: () =>
      new Promise((resolve) => {
        const start = performance.now();
        const duration = 700;
        const tick = (now: number): void => {
          if (disposed || root?.dataset.motion !== 'on') {
            introDone = true;
            introProgress = 1;
            requestFrame();
            resolve();
            return;
          }
          introProgress = Math.min(1, (now - start) / duration);
          requestFrame();
          if (introProgress < 1) {
            requestAnimationFrame(tick);
            return;
          }
          introDone = true;
          introProgress = 1;
          resolve();
        };
        requestAnimationFrame(tick);
      }),
    dispose: () => {
      disposed = true;
      unsubTicker();
      unsubActivity();
      canvas.removeEventListener('pointermove', onPointerPaint);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('keydown', onKey);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      getLenis()?.start();
      themeObserver.disconnect();
      cardGeo.dispose();
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
      releaseRenderer();
      canvas.dataset.ready = 'false';
    },
  };
}
