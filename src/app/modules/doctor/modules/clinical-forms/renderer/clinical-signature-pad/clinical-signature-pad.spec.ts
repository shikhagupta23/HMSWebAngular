import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ClinicalFormRendererModule } from '../clinical-form-renderer-module';
import { ClinicalSignaturePad } from './clinical-signature-pad';

describe('ClinicalSignaturePad', () => {
  let fixture: ComponentFixture<ClinicalSignaturePad>;
  let emitted: (string | null)[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClinicalFormRendererModule],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    fixture = TestBed.createComponent(ClinicalSignaturePad);
    emitted = [];
    fixture.componentInstance.signatureChange.subscribe((v) => emitted.push(v));
    fixture.detectChanges();
    await fixture.whenStable();
  });

  const canvas = () => fixture.nativeElement.querySelector('[data-test="signature-canvas"]') as HTMLCanvasElement;

  function stroke(points: [number, number][]): void {
    const rect = canvas().getBoundingClientRect();
    const at = (type: string, [x, y]: [number, number]) =>
      canvas().dispatchEvent(new PointerEvent(type, { clientX: rect.left + x, clientY: rect.top + y, pointerId: 7, bubbles: true, cancelable: true }));
    at('pointerdown', points[0]);
    for (const p of points.slice(1)) at('pointermove', p);
    at('pointerup', points[points.length - 1]);
  }

  it('is touch-friendly and sized for high-density screens', () => {
    expect(canvas().style.touchAction).toBe('none');
    expect(canvas().height).toBeGreaterThanOrEqual(170);
  });

  it('emits a PNG once there is enough ink, and null when cleared', async () => {
    stroke([[10, 20], [60, 40], [120, 30], [180, 60]]);
    expect(emitted.length).toBe(1);
    expect(emitted[0]).toMatch(/^data:image\/png;base64,/);
    expect(fixture.componentInstance.hasInk()).toBeTrue();

    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[data-test="signature-clear"]') as HTMLButtonElement).click();
    expect(emitted[1]).toBeNull();
    expect(fixture.componentInstance.hasInk()).toBeFalse();
  });

  it('clears when the host resets it after recording a response', () => {
    fixture.componentRef.setInput('resetToken', 0); // initial binding (never clears)
    fixture.detectChanges();
    stroke([[10, 20], [60, 40], [120, 30], [180, 60]]);
    fixture.componentRef.setInput('resetToken', 1);
    fixture.detectChanges();
    expect(emitted).toEqual([jasmine.stringMatching(/^data:image\/png/), null]);
    expect(fixture.componentInstance.hasInk()).toBeFalse();
  });

  it('ignores taps that are too short to be a signature', () => {
    stroke([[10, 10], [12, 11]]);
    expect(emitted).toEqual([]);
  });

  it('does not draw when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    stroke([[10, 20], [60, 40], [120, 30], [180, 60]]);
    expect(emitted).toEqual([]);
  });
});
