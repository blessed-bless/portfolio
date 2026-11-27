import { Color, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, SphereGeometry, TorusGeometry, WebGLRenderer } from 'three';
import { observeActivity, subscribeTicker } from './raf-hub';

let dialog: HTMLDialogElement | null = null;
let disposeScene: (() => void) | null = null;
let swapBound = false;

function copy(): { title: string; hint: string; close: string } {
  const english = document.documentElement.lang.startsWith('en');
  return english
    ? { title: 'Mark', hint: 'Drag the mark. This is not part of the order.', close: 'Close' }
    : { title: 'Метка', hint: 'Потяните метку. Это не часть заказа.', close: 'Закрыть' };
}

function ensureDialog(): HTMLDialogElement {
  if (dialog) return dialog;
  const text = copy();
  const node = document.createElement('dialog');
  node.className = 'orbit-toy';
  node.dataset.orbitToy = '';
  node.innerHTML = `<div class="orbit-toy__panel">
    <canvas class="orbit-toy__canvas" data-cursor="drag" tabindex="0"></canvas>
    <div class="orbit-toy__copy">
      <p class="orbit-toy__title"></p>
      <p class="orbit-toy__hint"></p>
      <button type="button" class="orbit-toy__close" data-orbit-close></button>
    </div>
  </div>`;
  document.body.append(node);
  node.querySelector('.orbit-toy__title')!.textContent = text.title;
  node.querySelector('.orbit-toy__hint')!.textContent = text.hint;
  node.querySelector('.orbit-toy__close')!.textContent = text.close;
  node.querySelector('[data-orbit-close]')?.addEventListener('click', () => closeOrbitToy());
  node.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeOrbitToy();
  });
  node.addEventListener('click', (event) => {
    if (event.target === node) closeOrbitToy();
  });
  dialog = node;
  return node;
}

function mountScene(canvas: HTMLCanvasElement): () => void {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.1, 20);
  camera.position.z = 4.2;
  const torus = new Mesh(
    new TorusGeometry(1.05, 0.08, 12, 48),
    new MeshBasicMaterial({ color: new Color('#8B5CF6') }),
  );
  const core = new Mesh(
    new SphereGeometry(0.22, 16, 16),
    new MeshBasicMaterial({ color: new Color('#c4b5fd') }),
  );
  scene.add(torus, core);

  let yaw = 0.4;
  let pitch = 0.2;
  let targetYaw = yaw;
  let targetPitch = pitch;
  let pointer: number | null = null;
  let lastX = 0;
  let lastY = 0;
  let running = true;

  const resize = (): void => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width < 2 || height < 2) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  const stopWatch = observeActivity(canvas, (active) => {
    running = active;
  });

  const onDown = (event: PointerEvent): void => {
    pointer = event.pointerId;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  };
  const onMove = (event: PointerEvent): void => {
    if (pointer !== event.pointerId) return;
    targetYaw += (event.clientX - lastX) * 0.01;
    targetPitch += (event.clientY - lastY) * 0.01;
    lastX = event.clientX;
    lastY = event.clientY;
  };
  const onUp = (event: PointerEvent): void => {
    if (pointer !== event.pointerId) return;
    pointer = null;
  };

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);

  const unsubscribe = subscribeTicker(() => {
    if (!running) return;
    yaw += (targetYaw - yaw) * 0.12;
    pitch += (targetPitch - pitch) * 0.12;
    torus.rotation.y = yaw;
    torus.rotation.x = pitch;
    core.rotation.y = yaw * 1.4;
    renderer.render(scene, camera);
  });

  return () => {
    unsubscribe();
    stopWatch();
    observer.disconnect();
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerup', onUp);
    torus.geometry.dispose();
    core.geometry.dispose();
    (torus.material as MeshBasicMaterial).dispose();
    (core.material as MeshBasicMaterial).dispose();
    renderer.dispose();
  };
}

export function openOrbitToy(): void {
  const node = ensureDialog();
  const text = copy();
  node.querySelector('.orbit-toy__title')!.textContent = text.title;
  node.querySelector('.orbit-toy__hint')!.textContent = text.hint;
  node.querySelector('.orbit-toy__close')!.textContent = text.close;
  if (!swapBound) {
    swapBound = true;
    document.addEventListener('astro:before-swap', () => closeOrbitToy());
  }
  if (!node.open) node.showModal();
  const canvas = node.querySelector<HTMLCanvasElement>('.orbit-toy__canvas');
  if (!canvas || disposeScene) return;
  disposeScene = mountScene(canvas);
  canvas.focus();
}

export function closeOrbitToy(): void {
  disposeScene?.();
  disposeScene = null;
  dialog?.close();
}
