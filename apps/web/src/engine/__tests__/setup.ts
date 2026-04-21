// jsdom 24 ships canvas stubs that return null for getContext('2d') unless
// the (native) `canvas` package is installed. We can't easily build it on
// Windows, so we provide a minimal in-memory 2D context backed by a typed
// array — enough for the Skybox tests to assert pixels were written.
function installCanvas2DShim(): void {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function getContext(
    this: HTMLCanvasElement,
    type: string,
    ...rest: unknown[]
  ): RenderingContext | null {
    if (type === '2d') {
      const existing = (this as unknown as { __ctx2d?: unknown }).__ctx2d as
        | CanvasRenderingContext2D
        | undefined;
      if (existing) return existing;
      const canvasWidth = this.width;
      const canvasHeight = this.height;
      const pixels = new Uint8ClampedArray(canvasWidth * canvasHeight * 4);
      let fillStyle = '#000000';

      const parseHex = (hex: string): [number, number, number, number] => {
        const clean = hex.replace('#', '');
        if (clean.length === 6) {
          return [
            parseInt(clean.slice(0, 2), 16),
            parseInt(clean.slice(2, 4), 16),
            parseInt(clean.slice(4, 6), 16),
            255,
          ];
        }
        if (clean.length === 8) {
          return [
            parseInt(clean.slice(0, 2), 16),
            parseInt(clean.slice(2, 4), 16),
            parseInt(clean.slice(4, 6), 16),
            parseInt(clean.slice(6, 8), 16),
          ];
        }
        return [0, 0, 0, 255];
      };
      const parseRgb = (str: string): [number, number, number, number] => {
        const match = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(str);
        if (!match) return [0, 0, 0, 255];
        return [
          Number(match[1]),
          Number(match[2]),
          Number(match[3]),
          match[4] !== undefined ? Math.round(Number(match[4]) * 255) : 255,
        ];
      };
      const parseColor = (str: string): [number, number, number, number] => {
        const trimmed = str.trim().toLowerCase();
        if (trimmed.startsWith('#')) return parseHex(trimmed);
        if (trimmed.startsWith('rgb')) return parseRgb(trimmed);
        return [0, 0, 0, 255];
      };

      const ctx = {
        canvas: this,
        set fillStyle(value: string) {
          fillStyle = value;
        },
        get fillStyle(): string {
          return fillStyle;
        },
        fillRect: (x: number, y: number, w: number, h: number): void => {
          const [r, g, b, a] = parseColor(fillStyle);
          const minX = Math.max(0, Math.floor(x));
          const minY = Math.max(0, Math.floor(y));
          const maxX = Math.min(canvasWidth, Math.floor(x + w));
          const maxY = Math.min(canvasHeight, Math.floor(y + h));
          for (let py = minY; py < maxY; py++) {
            for (let px = minX; px < maxX; px++) {
              const idx = (py * canvasWidth + px) * 4;
              pixels[idx + 0] = r;
              pixels[idx + 1] = g;
              pixels[idx + 2] = b;
              pixels[idx + 3] = a;
            }
          }
        },
        getImageData: (sx: number, sy: number, sw: number, sh: number): ImageData => {
          const out = new Uint8ClampedArray(sw * sh * 4);
          for (let py = 0; py < sh; py++) {
            for (let px = 0; px < sw; px++) {
              const srcIdx = ((py + sy) * canvasWidth + (px + sx)) * 4;
              const dstIdx = (py * sw + px) * 4;
              out[dstIdx + 0] = pixels[srcIdx + 0] ?? 0;
              out[dstIdx + 1] = pixels[srcIdx + 1] ?? 0;
              out[dstIdx + 2] = pixels[srcIdx + 2] ?? 0;
              out[dstIdx + 3] = pixels[srcIdx + 3] ?? 0;
            }
          }
          return { data: out, width: sw, height: sh, colorSpace: 'srgb' } as ImageData;
        },
      } as unknown as CanvasRenderingContext2D;
      (this as unknown as { __ctx2d?: unknown }).__ctx2d = ctx;
      return ctx;
    }
    return originalGetContext.call(this, type, ...(rest as [unknown]));
  } as typeof HTMLCanvasElement.prototype.getContext;
}

if (typeof HTMLCanvasElement !== 'undefined' &&
    document.createElement('canvas').getContext('2d') === null) {
  installCanvas2DShim();
}

// jsdom 24 still does not expose PointerEvent. Provide a minimal subclass of
// MouseEvent so CameraController tests can dispatch realistic pointer input.
if (typeof globalThis.PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    public readonly pointerId: number;
    public readonly pointerType: string;
    public readonly isPrimary: boolean;

    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? '';
      this.isPrimary = init.isPrimary ?? false;
    }
  }
  (globalThis as unknown as { PointerEvent: typeof PointerEvent }).PointerEvent =
    PointerEventPolyfill as unknown as typeof PointerEvent;
}
