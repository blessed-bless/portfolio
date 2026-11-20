import {
  Clock,
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
  getActiveIndex: () => number;
  goBy: (delta: number) => void;
};

type MountOptions = {
  projects: Project[];
  caption: HTMLElement | null;
  counter: HTMLElement | null;
  hint: HTMLElement | null;
  onSelect: (project: Project) => void;
  reducedMotion: boolean;
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

  void main() {
    vec2 shift = vec2(20.0 / 1600.0, 16.0 / 1000.0) * uHover;
    vec3 base = texture2D(uBase, vUv).rgb;
    vec4 art = texture2D(uArt, vUv - shift);
    vec3 rgb = mix(base, art.rgb, art.a);
    gl_FragColor = vec4(rgb, 1.0 - uDim * 0.20);
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
  const { projects, caption, counter, hint, onSelect, reducedMotion } = options;
  if (reducedMotion || projects.length === 0) return null;

  const isMobile = window.matchMedia('(max-width: 720px)').matches;
  const canWebGL = (() => {
    try {
      return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch {
      return false;
    }
  })();
  if (!canWebGL) return null;

  const root = canvas.closest('[data-hero]');
  const coverUrls = Array.from(
    root?.querySelectorAll<HTMLElement>('[data-hero-cover] [data-cover-src]') ?? [],
  ).map((node) => node.dataset.coverSrc || '');
  if (coverUrls.length !== projects.length || coverUrls.some((url) => !url)) return null;

  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    premultipliedAlpha: false,
    powerPreference: isMobile ? 'low-power' : 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setPixelRatio(maxPixelRatio());

  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  const allowShaderWarp = perfAllows('shaderWarp');
  const splitByChars = perfAllows('splitChars');
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
      coverUrls.flatMap((url, index) => {
        const project = projects[index];
        const label = project
          ? {
              number: String(index + 1).padStart(2, '0'),
              title: project.title,
            }
          : undefined;
        return [
          rasterizeCoverUrl(url, 'base', { ...size, anisotropy: maxAnisotropy, label }),
          rasterizeCoverUrl(url, 'art', { ...size, anisotropy: maxAnisotropy }),
        ];
      }),
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
    renderer.dispose();
    return null;
  }
  if (!canvas.isConnected) {
    textures.forEach((texture) => texture.dispose());
    renderer.dispose();
    return null;
  }

  const scene = new Scene();
  const camera = new PerspectiveCamera(isMobile ? 46 : 34, 1, 0.1, 40);
  camera.position.set(0, isMobile ? 0.08 : -0.08, isMobile ? 5.9 : 4.85);

  const clock = new Clock();
  const pointerNdc = new Vector2(0, 0);
  const raycaster = new Raycaster();

  const carousel = new Group();
  carousel.position.set(0, isMobile ? 0.12 : -0.18, 0);
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
  let introDone = false;
  let lastCaption = 0;
  let browsed = false;
  let loopActive = true;
  let needsRender = true;
  /** Soft settle toward integer slide (~700ms). */
  const SNAP_DAMP = 7.2;

  const radius = isMobile ? 2.75 : 3.55;
  const step = isMobile ? 0.78 : 0.7;
  const tiltTarget = new Vector2(0, 0);
  const tilt = new Vector2(0, 0);

  const markBrowsed = (): void => {
    if (browsed) return;
    browsed = true;
    if (hint) hint.dataset.hidden = 'true';
  };

  let captionBusy = false;

  const buildCaptionHtml = (project: Project, number: string): string => {
    return `<span>${number}</span><span>${project.title}</span><span>${project.year}</span><span>${project.stack}</span>`;
  };

  const animateCaption = async (html: string): Promise<void> => {
    if (!caption) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      caption.innerHTML = html;
      return;
    }
    if (captionBusy) {
      caption.innerHTML = html;
      return;
    }
    captionBusy = true;
    try {
      const gsap = (await import('gsap')).default;
      const { SplitText } = await import('gsap/SplitText');
      gsap.registerPlugin(SplitText);

      await gsap.to(caption, { y: 10, opacity: 0, duration: 0.12, ease: 'power2.in' });
      caption.innerHTML = html;
      const split = SplitText.create(caption, {
        type: splitByChars ? 'chars' : 'lines',
        charsClass: 'caption-char',
        linesClass: 'caption-line',
        aria: 'none',
      });
      gsap.set(caption, { y: 0, opacity: 1 });
      const targets = splitByChars ? split.chars : split.lines;
      gsap.fromTo(
        targets,
        { y: 14, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.3,
          stagger: splitByChars ? 0.006 : 0.04,
          ease: 'power2.out',
        },
      );
    } catch {
      caption.innerHTML = html;
      caption.style.opacity = '1';
      caption.style.transform = 'none';
    } finally {
      captionBusy = false;
    }
  };

  const updateCaption = (): void => {
    const index = wrapIndex(Math.round(current), projects.length);
    const project = projects[index];
    if (!project) return;
    const number = String(index + 1).padStart(2, '0');
    const total = String(projects.length).padStart(2, '0');
    const html = buildCaptionHtml(project, number);
    if (counter) counter.textContent = `${number} / ${total}`;
    void animateCaption(html);
  };

  projects.forEach((project, index) => {
    const material = new ShaderMaterial({
      vertexShader: cardVertex,
      fragmentShader: cardFragment,
      uniforms: {
        uBase: { value: textures[index * 2] },
        uArt: { value: textures[index * 2 + 1] },
        uHover: { value: 0 },
        uDim: { value: 0 },
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
      mesh.rotation.x = -0.04;
      const focus = 1 - Math.min(Math.abs(offset), 1.2) / 1.2;
      const scale = MathUtils.lerp(0.78, 1, focus);
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
    camera.updateProjectionMatrix();
  };

  const setPointer = (clientX: number, clientY: number): void => {
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / Math.max(rect.width, 1);
    const y = (clientY - rect.top) / Math.max(rect.height, 1);
    pointerNdc.set(x * 2 - 1, -(y * 2 - 1));
    if (!isMobile) {
      tiltTarget.set((x - 0.5) * 0.12, -(y - 0.5) * 0.07);
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
    markBrowsed();
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
      if (dragDistance > 6) markBrowsed();
    } else {
      const hit = pickCard();
      hoverIndex = hit && event.pointerType === 'mouse' ? Number(hit.userData.index) : -1;
      canvas.style.cursor = hit ? 'pointer' : 'grab';
    }
  };

  const onPointerLeave = (): void => {
    if (!dragging) hoverIndex = -1;
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    event.preventDefault();
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
    const isClick = dragDistance < 8 && Math.abs(event.clientX - dragStartX) < 8;
    if (isClick) {
      const hit = pickCard();
      if (hit) {
        const index = Number(hit.userData.index);
        const currentIndex = wrapIndex(Math.round(current), projects.length);
        if (index === currentIndex) {
          const project = projects[index];
          if (project?.hasPage) onSelect(project);
        } else {
          const offset = shortestOffset(index, currentIndex, projects.length);
          active = currentIndex + Math.sign(offset);
          markBrowsed();
        }
      }
    } else {
      if (dragOffset > 0.12) active = dragOrigin + 1;
      else if (dragOffset < -0.12) active = dragOrigin - 1;
      else active = dragOrigin;
      markBrowsed();
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
    let moving = dragging || Math.abs(current - active) > 0.0015 || !introDone;

    if (!dragging) {
      const prev = current;
      current = MathUtils.damp(current, active, SNAP_DAMP, dt);
      if (Math.abs(current - active) < 0.0015) current = active;
      if (Math.abs(current - prev) > 0.0001) moving = true;
    }

    const prevTiltX = tilt.x;
    const prevTiltY = tilt.y;
    tilt.lerp(tiltTarget, 0.08);
    if (Math.abs(tilt.x - prevTiltX) > 0.0001 || Math.abs(tilt.y - prevTiltY) > 0.0001) {
      moving = true;
    }
    carousel.rotation.y = tilt.x;
    carousel.rotation.x = tilt.y;
    layoutCards();

    materials.forEach((material, index) => {
      if (!allowShaderWarp) {
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
      updateCaption();
    }

    if (!needsRender && !moving) return;
    needsRender = false;
    renderer.render(scene, camera);
  };

  resize();
  layoutCards();
  window.addEventListener('resize', resize);
  canvas.addEventListener('pointermove', onPointerMove, { passive: false });
  window.addEventListener('pointermove', onPointerMove, { passive: false });
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
  canvas.setAttribute('role', 'listbox');
  canvas.setAttribute('aria-label', 'Project carousel');
  requestFrame();

  return {
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
      window.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      getLenis()?.start();
      themeObserver.disconnect();
      cardGeo.dispose();
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
      renderer.dispose();
      canvas.dataset.ready = 'false';
    },
  };
}

export function projectPlaneScreenRect(canvas: HTMLCanvasElement): DOMRect | null {
  const rect = canvas.getBoundingClientRect();
  const width = Math.min(rect.width * 0.72, 640);
  const height = width * 0.66;
  const left = rect.left + (rect.width - width) / 2;
  const top = rect.top + (rect.height - height) / 2;
  return new DOMRect(left, top, width, height);
}

export function expandToWorkPage(project: Project, from: DOMRect): Promise<void> {
  return new Promise((resolve) => {
    const shell = document.createElement('div');
    shell.className = 'work-expand';
    shell.style.cssText = [
      'position:fixed',
      `left:${from.left}px`,
      `top:${from.top}px`,
      `width:${from.width}px`,
      `height:${from.height}px`,
      'display:grid',
      'place-items:center',
      'overflow:hidden',
      'z-index:70',
      'border-radius:2px',
    ].join(';');
    const cover = Array.from(document.querySelectorAll<HTMLElement>('[data-hero-cover]'))
      .find((card) => card.dataset.heroCover === project.slug)
      ?.querySelector('.project-cover--dark, .project-cover');
    if (cover) shell.appendChild(cover.cloneNode(true));
    document.body.appendChild(shell);

    requestAnimationFrame(() => {
      shell.style.transition =
        'left 520ms cubic-bezier(0.16,1,0.3,1), top 520ms cubic-bezier(0.16,1,0.3,1), width 520ms cubic-bezier(0.16,1,0.3,1), height 520ms cubic-bezier(0.16,1,0.3,1), border-radius 520ms ease';
      shell.style.left = '0px';
      shell.style.top = '0px';
      shell.style.width = '100vw';
      shell.style.height = '100vh';
      shell.style.borderRadius = '0';
      window.setTimeout(() => resolve(), 540);
    });
  });
}
