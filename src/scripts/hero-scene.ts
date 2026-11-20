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
  Texture,
  Vector2,
  WebGLRenderer,
} from 'three';
import type { Project } from '../lib/work-types';
import { rasterizeCover } from './cover-texture';

export type SceneHandle = {
  dispose: () => void;
  playIntro: () => Promise<void>;
  getActiveIndex: () => number;
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
  const covers = Array.from(root?.querySelectorAll<SVGSVGElement>('[data-hero-cover] .project-cover') ?? []);
  if (covers.length !== projects.length) return null;

  const textureWidth = isMobile ? 480 : 960;
  const loadCovers = async () => {
    const layers = await Promise.allSettled(
      covers.flatMap((cover) => [
        rasterizeCover(cover, 'base', textureWidth),
        rasterizeCover(cover, 'art', textureWidth),
      ]),
    );
    const textures = layers.flatMap((layer) => layer.status === 'fulfilled' ? [layer.value] : []);
    const failure = layers.find((layer) => layer.status === 'rejected');
    if (failure?.status === 'rejected') {
      textures.forEach((texture) => texture.dispose());
      throw failure.reason;
    }
    return textures;
  };

  let textures: Texture[];
  const initialTheme = document.documentElement.dataset.theme;
  try {
    textures = await loadCovers();
  } catch (error) {
    console.warn('Could not load carousel covers', error);
    return null;
  }
  if (!canvas.isConnected) {
    textures.forEach((texture) => texture.dispose());
    return null;
  }

  const renderer = new WebGLRenderer({
    canvas,
    antialias: !isMobile,
    alpha: true,
    premultipliedAlpha: false,
    powerPreference: isMobile ? 'low-power' : 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 1.6));

  const scene = new Scene();
  const camera = new PerspectiveCamera(isMobile ? 46 : 34, 1, 0.1, 40);
  camera.position.set(0, 0, isMobile ? 6.35 : 5.1);

  const clock = new Clock();
  const pointerNdc = new Vector2(0, 0);
  const raycaster = new Raycaster();

  const carousel = new Group();
  carousel.position.set(0, 0.05, 0);
  scene.add(carousel);

  const cardWidth = isMobile ? 3.35 : 3.55;
  const cardGeo = new PlaneGeometry(cardWidth, cardWidth * 10 / 16);
  const cards: Mesh[] = [];
  const materials: ShaderMaterial[] = [];
  let themeRevision = 0;

  let active = 0;
  let current = 0;
  let velocity = 0;
  let dragging = false;
  let lastX = 0;
  let dragStartX = 0;
  let dragDistance = 0;
  let hoverIndex = -1;
  const hoverProgress = projects.map(() => 0);
  let frame = 0;
  let disposed = false;
  let introProgress = 0;
  let introDone = false;
  let lastCaption = 0;
  let browsed = false;

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
        type: 'chars',
        charsClass: 'caption-char',
        aria: 'none',
      });
      gsap.set(caption, { y: 0, opacity: 1 });
      gsap.fromTo(
        split.chars,
        { y: 14, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.3,
          stagger: 0.006,
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

  const onPointerMove = (event: PointerEvent): void => {
    setPointer(event.clientX, event.clientY);
    if (dragging) {
      const dx = event.clientX - lastX;
      lastX = event.clientX;
      dragDistance += Math.abs(dx);
      velocity += -dx * 0.0035;
      if (dragDistance > 10) markBrowsed();
    } else {
      const hit = pickCard();
      hoverIndex = hit && event.pointerType === 'mouse' ? Number(hit.userData.index) : -1;
      canvas.style.cursor = hit ? 'pointer' : 'grab';
    }
  };

  const onPointerLeave = (): void => {
    hoverIndex = -1;
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    dragging = true;
    hoverIndex = -1;
    lastX = event.clientX;
    dragStartX = event.clientX;
    dragDistance = 0;
    velocity = 0;
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = 'grabbing';
  };

  const onPointerUp = (event: PointerEvent): void => {
    if (!dragging) return;
    dragging = false;
    try {
      canvas.releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
    const isClick = dragDistance < 8 && Math.abs(event.clientX - dragStartX) < 8;
    if (isClick) {
      const hit = pickCard();
      if (hit) {
        const project = projects[Number(hit.userData.index)];
        if (project?.hasPage) onSelect(project);
      }
    } else {
      active = Math.round(current);
      markBrowsed();
    }
    canvas.style.cursor = 'grab';
  };

  const onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    velocity += Math.sign(event.deltaY) * 0.08 + event.deltaY * 0.00045;
    markBrowsed();
  };

  const onKey = (event: KeyboardEvent): void => {
    if (event.key === 'ArrowRight') {
      active += 1;
      velocity = 0;
      markBrowsed();
    }
    if (event.key === 'ArrowLeft') {
      active -= 1;
      velocity = 0;
      markBrowsed();
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

  const render = (): void => {
    if (disposed) return;
    frame = requestAnimationFrame(render);
    const elapsed = clock.getDelta();
    const dt = Math.min(elapsed, 0.033);

    if (!dragging) {
      const target = active;
      current = MathUtils.damp(current, target, 4.2, dt);
      velocity = MathUtils.damp(velocity, 0, 3.2, dt);
      current += velocity;
      if (Math.abs(velocity) < 0.001 && Math.abs(current - target) < 0.002) {
        current = target;
        velocity = 0;
      }
      if (Math.abs(velocity) > 0.002) {
        active = Math.round(current);
      }
    } else {
      current += velocity;
      velocity *= 0.92;
      active = Math.round(current);
    }

    tilt.lerp(tiltTarget, 0.08);
    carousel.rotation.y = tilt.x;
    carousel.rotation.x = tilt.y;
    layoutCards();

    materials.forEach((material, index) => {
      const direction = hoverIndex === index ? 1 : -1;
      const progress = MathUtils.clamp(hoverProgress[index] + direction * elapsed / 0.5, 0, 1);
      hoverProgress[index] = progress;
      material.uniforms.uHover.value = MathUtils.smoothstep(progress, 0, 1);
    });

    const rounded = wrapIndex(Math.round(current), projects.length);
    if (rounded !== lastCaption) {
      lastCaption = rounded;
      updateCaption();
    }

    renderer.render(scene, camera);
  };

  resize();
  layoutCards();
  window.addEventListener('resize', resize);
  canvas.addEventListener('pointermove', onPointerMove, { passive: true });
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('keydown', onKey);
  frame = requestAnimationFrame(render);
  canvas.dataset.ready = 'true';
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'listbox');
  canvas.setAttribute('aria-label', 'Карусель проектов');

  return {
    getActiveIndex: () => wrapIndex(Math.round(current), projects.length),
    playIntro: () =>
      new Promise((resolve) => {
        const start = performance.now();
        const duration = 700;
        const tick = (now: number): void => {
          introProgress = Math.min(1, (now - start) / duration);
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
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('keydown', onKey);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
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
      `view-transition-name:work-cover-${project.slug}`,
    ].join(';');
    const cover = Array.from(document.querySelectorAll<HTMLElement>('[data-hero-cover]'))
      .find((card) => card.dataset.heroCover === project.slug)?.querySelector('.project-cover');
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
