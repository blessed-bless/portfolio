import {
  AdditiveBlending,
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
  Texture,
  Vector2,
  WebGLRenderer,
} from 'three';
import type { Project } from '../data/projects';
import { paintPreviewTexture } from './preview-textures';

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

const smokeVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const smokeFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uRes;
  uniform vec3 uPlum;
  uniform vec3 uAccent;
  uniform float uMobile;
  uniform float uLight;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.05;
      a *= 0.55;
    }
    return v;
  }

  void main() {
    vec2 aspect = vec2(uRes.x / max(uRes.y, 1.0), 1.0);
    vec2 p = (vUv - 0.5) * aspect;
    vec2 mouse = (uMouse - 0.5) * aspect;
    float t = uTime * 0.045;

    float field = fbm(p * mix(1.55, 1.15, uMobile) + vec2(t, -t * 0.35));
    float ridges = smoothstep(0.28, 0.72, abs(field * 2.0 - 1.0));
    float glow = 1.0 - smoothstep(0.0, 0.75, length(p - mouse));

    vec3 col = mix(uPlum, uAccent, 0.4 + glow * 0.3);
    float alpha = (ridges * 0.16 + glow * 0.2) * mix(0.4, 0.1, uLight);
    float edgeFade =
      smoothstep(0.0, 0.18, vUv.x) *
      smoothstep(1.0, 0.82, vUv.x) *
      smoothstep(0.0, 0.14, vUv.y) *
      smoothstep(1.0, 0.86, vUv.y);
    alpha *= edgeFade;
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.35));
  }
`;

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
  uniform sampler2D uMap;
  uniform float uHover;
  uniform float uVelocity;
  uniform float uTime;
  uniform float uSimplify;
  uniform float uDim;
  uniform float uLight;

  void main() {
    vec2 uv = vUv;
    float wave = sin((uv.y + uTime * 0.8) * 18.0 + uVelocity * 4.0) * 0.012 * uHover * (1.0 - uSimplify);
    float shift = (0.01 + abs(uVelocity) * 0.025) * uHover;

    vec2 uvR = uv + vec2(shift + wave, wave * 0.4);
    vec2 uvG = uv + vec2(wave * 0.2, -shift * 0.4);
    vec2 uvB = uv - vec2(shift * 0.7, wave);

    vec4 base = texture2D(uMap, uv);
    vec3 rgb = mix(
      base.rgb,
      vec3(texture2D(uMap, uvR).r, texture2D(uMap, uvG).g, texture2D(uMap, uvB).b),
      uHover * mix(1.0, 0.45, uSimplify)
    );

    if (uLight > 0.5 && uDim > 0.01) {
      vec2 px = vec2(0.004, 0.004);
      vec3 blur =
        texture2D(uMap, uv + px).rgb +
        texture2D(uMap, uv - px).rgb +
        texture2D(uMap, uv + vec2(px.x, -px.y)).rgb +
        texture2D(uMap, uv + vec2(-px.x, px.y)).rgb;
      blur *= 0.25;
      rgb = mix(rgb, blur, clamp(uDim * 0.7, 0.0, 0.7));
    } else {
      rgb *= mix(1.0, 0.75, uDim);
    }

    float edge = smoothstep(0.0, 0.035, uv.x) * smoothstep(1.0, 0.965, uv.x)
      * smoothstep(0.0, 0.035, uv.y) * smoothstep(1.0, 0.965, uv.y);
    rgb *= mix(0.92 + edge * 0.08, 0.98 + edge * 0.02, uLight);

    float softShadow = (1.0 - smoothstep(0.78, 1.0, uv.y)) * 0.12 * uLight;
    softShadow += (1.0 - smoothstep(0.0, 0.14, uv.x)) * 0.06 * uLight;
    vec3 lilac = vec3(0.86, 0.8, 0.96);
    rgb = mix(rgb, rgb * lilac, softShadow);

    float alpha = mix(1.0, mix(1.0, 0.55, uDim), uLight);
    gl_FragColor = vec4(rgb, alpha);
  }
`;

const bloomFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec3 uAccent;
  uniform float uStrength;
  void main() {
    float d = length(vUv - 0.5);
    float spot = smoothstep(0.55, 0.0, d);
    vec3 col = uAccent * spot * uStrength;
    gl_FragColor = vec4(col, spot * uStrength);
  }
`;

function parseCssColor(value: string, fallback: string): Color {
  const color = new Color();
  try {
    color.setStyle(value.trim());
    return color;
  } catch {
    return new Color(fallback);
  }
}

function readTheme(): { bg: Color; accent: Color; plum: Color; isLight: boolean } {
  const styles = getComputedStyle(document.documentElement);
  return {
    bg: parseCssColor(styles.getPropertyValue('--bg'), '#0d0b12'),
    accent: parseCssColor(styles.getPropertyValue('--accent'), '#7c3aed'),
    plum: parseCssColor(styles.getPropertyValue('--accent-plum'), '#3b2458'),
    isLight: document.documentElement.dataset.theme === 'light',
  };
}

function wrapIndex(value: number, length: number): number {
  return ((value % length) + length) % length;
}

function shortestOffset(index: number, current: number, length: number): number {
  let diff = index - current;
  if (diff > length / 2) diff -= length;
  if (diff < -length / 2) diff += length;
  return diff;
}

export function mountHeroScene(
  canvas: HTMLCanvasElement,
  options: MountOptions,
): SceneHandle | null {
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

  const renderer = new WebGLRenderer({
    canvas,
    antialias: !isMobile,
    alpha: true,
    premultipliedAlpha: false,
    powerPreference: isMobile ? 'low-power' : 'high-performance',
  });
  let theme = readTheme();
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 1.6));

  const scene = new Scene();
  const camera = new PerspectiveCamera(isMobile ? 40 : 34, 1, 0.1, 40);
  camera.position.set(0, 0, isMobile ? 5.4 : 5.1);

  const clock = new Clock();
  const pointerNdc = new Vector2(0, 0);
  const mouseSmooth = new Vector2(0.5, 0.5);
  const mouseTarget = new Vector2(0.5, 0.5);
  const raycaster = new Raycaster();
  const styles = getComputedStyle(document.documentElement);
  const accentHex = styles.getPropertyValue('--accent').trim() || '#7c3aed';
  const plumHex = styles.getPropertyValue('--accent-plum').trim() || '#3b2458';
  const inkHex = styles.getPropertyValue('--fg').trim() || '#f3f1ea';
  const mutedHex = styles.getPropertyValue('--fg-muted').trim() || '#9a95a8';
  const surfaceHex = styles.getPropertyValue('--bg').trim() || '#0d0b12';
  const panelHex = styles.getPropertyValue('--bg-elevated').trim() || '#16131c';
  const lineHex = styles.getPropertyValue('--border').trim() || '#2c2736';

  const smokeGeo = new PlaneGeometry(18, 12);
  const smokeMat = new ShaderMaterial({
    vertexShader: smokeVertex,
    fragmentShader: smokeFragment,
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new Vector2(0.5, 0.5) },
      uRes: { value: new Vector2(1, 1) },
      uPlum: { value: theme.plum },
      uAccent: { value: theme.accent },
      uMobile: { value: isMobile ? 1 : 0 },
      uLight: { value: theme.isLight ? 1 : 0 },
    },
    transparent: true,
    depthWrite: false,
  });
  const smoke = new Mesh(smokeGeo, smokeMat);
  smoke.position.z = -4.5;
  scene.add(smoke);

  const bloomGeo = new PlaneGeometry(5.6, 4.0);
  const bloomMat = new ShaderMaterial({
    vertexShader: smokeVertex,
    fragmentShader: bloomFragment,
    uniforms: {
      uAccent: { value: new Color('#a78bfa') },
      uStrength: { value: theme.isLight ? 0.08 : 0.15 },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const bloom = new Mesh(bloomGeo, bloomMat);
  bloom.position.set(0, 0.08, -1.05);
  bloom.renderOrder = 0;
  scene.add(bloom);

  const carousel = new Group();
  carousel.position.set(0, 0.05, 0);
  scene.add(carousel);

  const cardGeo = new PlaneGeometry(isMobile ? 2.9 : 3.55, isMobile ? 1.95 : 2.35, 1, 1);
  const cards: Mesh[] = [];
  const materials: ShaderMaterial[] = [];
  const textures: Texture[] = [];

  let active = 0;
  let current = 0;
  let velocity = 0;
  let dragging = false;
  let lastX = 0;
  let dragStartX = 0;
  let dragDistance = 0;
  let hoverIndex = -1;
  let frame = 0;
  let disposed = false;
  let introProgress = 0;
  let introDone = false;
  let lastCaption = -1;
  let browsed = false;

  const radius = isMobile ? 3.15 : 3.55;
  const step = isMobile ? 0.62 : 0.7;
  const tiltTarget = new Vector2(0, 0);
  const tilt = new Vector2(0, 0);

  const markBrowsed = (): void => {
    if (browsed) return;
    browsed = true;
    if (hint) hint.dataset.hidden = 'true';
  };

  let captionBusy = false;

  const buildCaptionHtml = (project: Project, number: string): string =>
    `<span>${number}</span><span>${project.title}</span><span>${project.year}</span><span>${project.stack}</span>`;

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

  const updateCaption = (animate = false): void => {
    const index = wrapIndex(Math.round(current), projects.length);
    const project = projects[index];
    if (!project) return;
    const number = String(index + 1).padStart(2, '0');
    const total = String(projects.length).padStart(2, '0');
    const html = buildCaptionHtml(project, number);
    if (counter) counter.textContent = `${number} / ${total}`;
    if (!caption) return;
    if (animate) void animateCaption(html);
    else caption.innerHTML = html;
  };

  projects.forEach((project, index) => {
    const texture = paintPreviewTexture(project, index, {
      accent: accentHex,
      plum: plumHex,
      ink: inkHex,
      muted: mutedHex,
      surface: surfaceHex,
      panel: panelHex,
      line: lineHex,
      isLight: theme.isLight,
    });
    textures.push(texture);

    const material = new ShaderMaterial({
      vertexShader: cardVertex,
      fragmentShader: cardFragment,
      uniforms: {
        uMap: { value: texture },
        uHover: { value: 0 },
        uVelocity: { value: 0 },
        uTime: { value: 0 },
        uSimplify: { value: isMobile ? 1 : 0 },
        uDim: { value: 0 },
        uLight: { value: theme.isLight ? 1 : 0 },
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
    smokeMat.uniforms.uRes.value.set(width, height);
  };

  const setPointer = (clientX: number, clientY: number): void => {
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / Math.max(rect.width, 1);
    const y = (clientY - rect.top) / Math.max(rect.height, 1);
    mouseTarget.set(x, 1 - y);
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
      hoverIndex = hit ? Number(hit.userData.index) : -1;
      canvas.style.cursor = hit ? 'pointer' : 'grab';
    }
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    dragging = true;
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
      velocity += 0.12;
      markBrowsed();
    }
    if (event.key === 'ArrowLeft') {
      active -= 1;
      velocity -= 0.12;
      markBrowsed();
    }
    if (event.key === 'Enter') {
      const project = projects[wrapIndex(Math.round(current), projects.length)];
      if (project?.hasPage) onSelect(project);
    }
  };

  const onTheme = (): void => {
    theme = readTheme();
    const nextStyles = getComputedStyle(document.documentElement);
    const nextAccent = nextStyles.getPropertyValue('--accent').trim() || '#7c3aed';
    const nextPlum = nextStyles.getPropertyValue('--accent-plum').trim() || '#3b2458';
    const nextInk = nextStyles.getPropertyValue('--fg').trim() || '#f3f1ea';
    const nextMuted = nextStyles.getPropertyValue('--fg-muted').trim() || '#9a95a8';
    const nextSurface = nextStyles.getPropertyValue('--bg').trim() || '#0d0b12';
    const nextPanel = nextStyles.getPropertyValue('--bg-elevated').trim() || '#16131c';
    const nextLine = nextStyles.getPropertyValue('--border').trim() || '#2c2736';

    smokeMat.uniforms.uAccent.value.copy(theme.accent);
    smokeMat.uniforms.uPlum.value.copy(theme.plum);
    smokeMat.uniforms.uLight.value = theme.isLight ? 1 : 0;
    bloomMat.uniforms.uAccent.value.copy(
      theme.isLight ? theme.accent : new Color('#a78bfa'),
    );
    bloomMat.uniforms.uStrength.value = theme.isLight ? 0.08 : 0.15;

    materials.forEach((material, index) => {
      material.uniforms.uLight.value = theme.isLight ? 1 : 0;
      const project = projects[index];
      if (!project) return;
      const prev = textures[index];
      prev?.dispose();
      const texture = paintPreviewTexture(project, index, {
        accent: nextAccent,
        plum: nextPlum,
        ink: nextInk,
        muted: nextMuted,
        surface: nextSurface,
        panel: nextPanel,
        line: nextLine,
        isLight: theme.isLight,
      });
      textures[index] = texture;
      material.uniforms.uMap.value = texture;
    });
    renderer.setClearColor(0x000000, 0);
  };

  const themeObserver = new MutationObserver(onTheme);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  const render = (): void => {
    if (disposed) return;
    frame = requestAnimationFrame(render);
    const dt = Math.min(clock.getDelta(), 0.033);
    const time = clock.getElapsedTime();

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

    mouseSmooth.lerp(mouseTarget, 0.12);
    tilt.lerp(tiltTarget, 0.08);
    carousel.rotation.y = tilt.x;
    carousel.rotation.x = tilt.y;
    smokeMat.uniforms.uMouse.value.copy(mouseSmooth);
    smokeMat.uniforms.uTime.value = time;
    layoutCards();

    materials.forEach((material, index) => {
      const hover = hoverIndex === index ? 1 : 0;
      material.uniforms.uHover.value = MathUtils.damp(
        material.uniforms.uHover.value,
        hover,
        8,
        dt,
      );
      material.uniforms.uVelocity.value = velocity;
      material.uniforms.uTime.value = time;
    });

    const rounded = wrapIndex(Math.round(current), projects.length);
    if (rounded !== lastCaption) {
      const shouldAnimate = lastCaption !== -1;
      lastCaption = rounded;
      updateCaption(shouldAnimate);
    }

    bloom.position.x = MathUtils.damp(bloom.position.x, carousel.position.x, 6, dt);
    bloom.rotation.copy(carousel.rotation);

    renderer.render(scene, camera);
  };

  updateCaption(false);
  resize();
  layoutCards();
  window.addEventListener('resize', resize);
  canvas.addEventListener('pointermove', onPointerMove, { passive: true });
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('keydown', onKey);
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
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      themeObserver.disconnect();
      smokeGeo.dispose();
      smokeMat.dispose();
      bloomGeo.dispose();
      bloomMat.dispose();
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
      `background:center/cover no-repeat url(${project.cover})`,
      'z-index:70',
      'border-radius:2px',
      `view-transition-name:work-cover-${project.slug}`,
    ].join(';');
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
