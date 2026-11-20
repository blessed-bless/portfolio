import { CanvasTexture, SRGBColorSpace } from 'three';
import type { Project } from '../data/projects';

type Palette = {
  accent: string;
  plum: string;
  ink: string;
  muted: string;
  surface: string;
  panel: string;
  line: string;
  isLight: boolean;
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function paintChrome(ctx: CanvasRenderingContext2D, p: Palette): void {
  ctx.fillStyle = p.isLight ? p.surface : '#1f1a2b';
  ctx.fillRect(0, 0, 1024, 720);

  if (p.isLight) {
    ctx.fillStyle = 'rgba(22, 18, 32, 0.08)';
    ctx.fillRect(18, 22, 988, 676);
  }

  ctx.fillStyle = p.isLight ? p.panel : '#1f1a2b';
  roundRect(ctx, 36, 36, 952, 648, 18);
  ctx.fill();

  ctx.strokeStyle = p.isLight ? p.line : '#2a2438';
  ctx.lineWidth = 4;
  roundRect(ctx, 2, 2, 1020, 716, 10);
  ctx.stroke();
  roundRect(ctx, 36, 36, 952, 648, 18);
  ctx.stroke();

  ctx.fillStyle = p.surface;
  roundRect(ctx, 36, 36, 952, 64, 18);
  ctx.fill();
  ctx.fillRect(36, 68, 952, 32);

  ctx.fillStyle = p.accent;
  ctx.beginPath();
  ctx.arc(72, 68, 7, 0, Math.PI * 2);
  ctx.arc(96, 68, 7, 0, Math.PI * 2);
  ctx.arc(120, 68, 7, 0, Math.PI * 2);
  ctx.fill();
}

function paintDashboard(ctx: CanvasRenderingContext2D, p: Palette): void {
  paintChrome(ctx, p);

  ctx.fillStyle = p.ink;
  ctx.font = '700 34px "Bricolage Grotesque", sans-serif';
  ctx.fillText('Дашборд', 160, 78);

  ctx.fillStyle = p.muted;
  ctx.font = '500 20px "IBM Plex Mono", monospace';
  ctx.fillText('заявки · 7 дней', 160, 104);

  const cards = [
    { x: 72, label: 'Новые', value: '128' },
    { x: 360, label: 'В работе', value: '34' },
    { x: 648, label: 'Готово', value: '91' },
  ];
  for (const card of cards) {
    ctx.fillStyle = p.surface;
    roundRect(ctx, card.x, 140, 260, 120, 14);
    ctx.fill();
    ctx.fillStyle = p.muted;
    ctx.font = '500 18px "IBM Plex Mono", monospace';
    ctx.fillText(card.label, card.x + 24, 178);
    ctx.fillStyle = p.ink;
    ctx.font = '700 44px "Bricolage Grotesque", sans-serif';
    ctx.fillText(card.value, card.x + 24, 232);
  }

  ctx.fillStyle = p.surface;
  roundRect(ctx, 72, 292, 880, 340, 16);
  ctx.fill();

  ctx.strokeStyle = p.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(110, 560);
  ctx.lineTo(910, 560);
  ctx.stroke();

  const points = [480, 420, 450, 360, 390, 330, 300, 340, 280];
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 4;
  ctx.beginPath();
  points.forEach((y, i) => {
    const x = 130 + i * 90;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = p.accent;
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  points.forEach((y, i) => {
    const x = 130 + i * 90;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(130 + (points.length - 1) * 90, 560);
  ctx.lineTo(130, 560);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function paintBooking(ctx: CanvasRenderingContext2D, p: Palette): void {
  paintChrome(ctx, p);

  ctx.fillStyle = p.surface;
  roundRect(ctx, 280, 130, 460, 520, 28);
  ctx.fill();

  ctx.fillStyle = p.panel;
  roundRect(ctx, 300, 150, 420, 480, 22);
  ctx.fill();

  ctx.fillStyle = p.ink;
  ctx.font = '700 28px "Bricolage Grotesque", sans-serif';
  ctx.fillText('Запись', 330, 200);
  ctx.fillStyle = p.muted;
  ctx.font = '500 18px "IBM Plex Mono", monospace';
  ctx.fillText('Март 2026', 330, 230);

  const startX = 330;
  const startY = 270;
  const cell = 52;
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 7; col += 1) {
      const x = startX + col * cell;
      const y = startY + row * cell;
      const day = row * 7 + col + 1;
      if (day > 31) continue;
      const active = day === 14 || day === 15;
      if (active) {
        ctx.fillStyle = p.accent;
        roundRect(ctx, x, y, 40, 40, 10);
        ctx.fill();
        ctx.fillStyle = p.isLight ? '#ffffff' : p.ink;
      } else {
        ctx.fillStyle = p.surface;
        roundRect(ctx, x, y, 40, 40, 10);
        ctx.fill();
        ctx.fillStyle = p.ink;
      }
      ctx.font = '600 16px "IBM Plex Mono", monospace';
      ctx.fillText(String(day), x + 12, y + 26);
    }
  }

  ctx.fillStyle = p.accent;
  roundRect(ctx, 330, 545, 360, 48, 12);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 20px "Bricolage Grotesque", sans-serif';
  ctx.fillText('Выбрать время', 430, 576);
}

function paintLanding(ctx: CanvasRenderingContext2D, p: Palette): void {
  paintChrome(ctx, p);

  ctx.fillStyle = p.surface;
  ctx.fillRect(36, 100, 952, 584);

  ctx.fillStyle = p.accent;
  ctx.globalAlpha = 0.14;
  ctx.beginPath();
  ctx.ellipse(760, 280, 220, 160, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = p.ink;
  ctx.font = '750 72px "Bricolage Grotesque", sans-serif';
  ctx.fillText('Собери поток', 90, 260);
  ctx.fillText('заявок', 90, 340);

  ctx.fillStyle = p.muted;
  ctx.font = '500 26px "Bricolage Grotesque", sans-serif';
  ctx.fillText('Лендинг под запись и оплату', 90, 400);

  ctx.fillStyle = p.accent;
  roundRect(ctx, 90, 450, 220, 56, 10);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 22px "Bricolage Grotesque", sans-serif';
  ctx.fillText('Начать', 155, 486);

  ctx.strokeStyle = p.line;
  ctx.lineWidth = 2;
  roundRect(ctx, 560, 420, 360, 200, 14);
  ctx.stroke();
  ctx.fillStyle = p.panel;
  roundRect(ctx, 580, 450, 140, 18, 6);
  ctx.fill();
  roundRect(ctx, 580, 490, 300, 14, 6);
  ctx.fill();
  roundRect(ctx, 580, 520, 240, 14, 6);
  ctx.fill();
}

function paintInbox(ctx: CanvasRenderingContext2D, p: Palette): void {
  paintChrome(ctx, p);
  ctx.fillStyle = p.ink;
  ctx.font = '700 32px "Bricolage Grotesque", sans-serif';
  ctx.fillText('Сигналы', 72, 78);

  for (let i = 0; i < 5; i += 1) {
    const y = 140 + i * 96;
    ctx.fillStyle = p.surface;
    roundRect(ctx, 72, y, 880, 80, 12);
    ctx.fill();
    ctx.fillStyle = p.accent;
    ctx.fillRect(72, y, 8, 80);
    ctx.fillStyle = p.ink;
    ctx.font = '650 24px "Bricolage Grotesque", sans-serif';
    ctx.fillText(`Поток ${i + 1}`, 110, y + 36);
    ctx.fillStyle = p.muted;
    ctx.font = '500 18px "IBM Plex Mono", monospace';
    ctx.fillText('статус · ок', 110, y + 60);
    ctx.fillStyle = p.accent;
    roundRect(ctx, 820, y + 24, 96, 32, 8);
    ctx.fill();
  }
}

function paintMap(ctx: CanvasRenderingContext2D, p: Palette): void {
  paintChrome(ctx, p);
  ctx.fillStyle = p.surface;
  roundRect(ctx, 72, 130, 880, 500, 16);
  ctx.fill();

  ctx.strokeStyle = p.line;
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath();
    ctx.moveTo(100, 180 + i * 70);
    ctx.lineTo(920, 200 + i * 55);
    ctx.stroke();
  }

  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(140, 540);
  ctx.bezierCurveTo(280, 220, 520, 580, 860, 220);
  ctx.stroke();

  ctx.fillStyle = p.accent;
  ctx.beginPath();
  ctx.arc(860, 220, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = p.panel;
  roundRect(ctx, 120, 160, 240, 100, 12);
  ctx.fill();
  ctx.fillStyle = p.ink;
  ctx.font = '700 22px "Bricolage Grotesque", sans-serif';
  ctx.fillText('Маршрут', 144, 205);
  ctx.fillStyle = p.muted;
  ctx.font = '500 16px "IBM Plex Mono", monospace';
  ctx.fillText('12 точек', 144, 235);
}

const painters = [paintDashboard, paintBooking, paintLanding, paintInbox, paintMap];

export function paintPreviewTexture(project: Project, index: number, palette: Palette): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new CanvasTexture(canvas);

  const resolved: Palette = palette.isLight
    ? palette
    : {
        ...palette,
        surface: '#1f1a2b',
        panel: '#1f1a2b',
        accent: '#a78bfa',
        ink: '#f3f1ea',
        muted: '#b7b1c4',
        line: '#2a2438',
        plum: '#2a2038',
      };

  painters[index % painters.length]?.(ctx, resolved);

  void project;

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
