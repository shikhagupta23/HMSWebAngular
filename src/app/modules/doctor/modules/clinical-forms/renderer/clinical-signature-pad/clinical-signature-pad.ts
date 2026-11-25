import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild, signal } from '@angular/core';

/** Minimum stroke length (CSS pixels) before a drawing counts as a signature, so taps are not accepted. */
const MIN_INK_LENGTH = 40;
const PAD_HEIGHT = 170;

/**
 * Signature capture on a canvas with pointer events (finger, stylus or mouse). `touch-action: none`
 * keeps tablets from scrolling while signing; the canvas is scaled for high-density screens. Emits a PNG
 * data URL once there is enough ink, and null when cleared. The image is sent to the server, which
 * validates and stores it privately with the consent record.
 */
@Component({
  selector: 'app-clinical-signature-pad',
  standalone: false,
  template: `
    <div class="cf-signature" [class.opacity-50]="disabled">
      <div class="d-flex justify-content-between align-items-center mb-1">
        <span class="small fw-semibold">{{ label }}@if (required) { <span class="text-danger"> *</span> }</span>
        <button type="button" class="btn btn-sm btn-link p-0" (click)="clear()" [disabled]="disabled || !hasInk()" data-test="signature-clear">Clear</button>
      </div>
      <canvas #canvas class="border rounded bg-white w-100 d-block" [style.height.px]="height" style="touch-action: none; cursor: crosshair"
        role="img" [attr.aria-label]="label + ' pad'" data-test="signature-canvas"
        (pointerdown)="start($event)" (pointermove)="move($event)" (pointerup)="end($event)" (pointercancel)="end($event)" (pointerleave)="end($event)"></canvas>
      <small class="text-muted">{{ hasInk() ? 'Signed. Use Clear to sign again.' : 'Sign above with a finger, stylus or mouse.' }}</small>
    </div>
  `,
})
export class ClinicalSignaturePad implements AfterViewInit, OnChanges {
  @Input() label = 'Signature';
  @Input() required = false;
  @Input() disabled = false;
  /** Changing this value clears the pad (e.g. after the response was recorded). */
  @Input() resetToken: unknown = null;
  @Output() readonly signatureChange = new EventEmitter<string | null>();
  @ViewChild('canvas', { static: true }) private canvasRef!: ElementRef<HTMLCanvasElement>;

  readonly height = PAD_HEIGHT;
  readonly hasInk = signal(false);

  private context: CanvasRenderingContext2D | null = null;
  private drawing = false;
  private last: { x: number; y: number } | null = null;
  private inkLength = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resetToken'] && !changes['resetToken'].firstChange && this.hasInk()) this.clear();
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    const ratio = Math.min(window.devicePixelRatio || 1, 3);
    const width = canvas.clientWidth || 600;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(PAD_HEIGHT * ratio);
    this.context = canvas.getContext('2d');
    if (this.context) {
      this.context.scale(ratio, ratio);
      this.context.lineWidth = 2.2;
      this.context.lineCap = 'round';
      this.context.lineJoin = 'round';
      this.context.strokeStyle = '#111';
    }
  }

  start(event: PointerEvent): void {
    if (this.disabled || !this.context) return;
    event.preventDefault();
    try {
      this.canvasRef.nativeElement.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic or already-released pointers cannot be captured; drawing still works.
    }
    this.drawing = true;
    this.last = this.point(event);
    this.context.beginPath();
    this.context.moveTo(this.last.x, this.last.y);
  }

  move(event: PointerEvent): void {
    if (!this.drawing || !this.context || !this.last) return;
    event.preventDefault();
    const next = this.point(event);
    this.context.lineTo(next.x, next.y);
    this.context.stroke();
    this.inkLength += Math.hypot(next.x - this.last.x, next.y - this.last.y);
    this.last = next;
  }

  end(event: PointerEvent): void {
    if (!this.drawing) return;
    event.preventDefault();
    this.drawing = false;
    this.last = null;
    if (this.inkLength >= MIN_INK_LENGTH) {
      this.hasInk.set(true);
      this.signatureChange.emit(this.canvasRef.nativeElement.toDataURL('image/png'));
    }
  }

  clear(): void {
    const canvas = this.canvasRef.nativeElement;
    this.context?.save();
    this.context?.setTransform(1, 0, 0, 1, 0, 0);
    this.context?.clearRect(0, 0, canvas.width, canvas.height);
    this.context?.restore();
    this.inkLength = 0;
    this.hasInk.set(false);
    this.signatureChange.emit(null);
  }

  private point(event: PointerEvent): { x: number; y: number } {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }
}
