import { Directive, HostListener, Input, Optional, Self } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[numbersOnly]'
})
export class NumbersOnlyDirective {

  @Input() maxLength = 10;

  constructor(@Optional() @Self() private ngControl: NgControl) {}

  @HostListener('input', ['$event'])
  onInput(event: Event) {
    const input = event.target as HTMLInputElement;

    let value = input.value || '';

    // Remove non-digits
    value = value.replace(/\D/g, '');

    // Enforce max length
    if (value.length > this.maxLength) {
      value = value.slice(0, this.maxLength);
    }

    // 🔥 Update BOTH DOM and FormControl
    input.value = value;

    if (this.ngControl?.control) {
      this.ngControl.control.setValue(value, {
        emitEvent: false
      });
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    const allowedKeys = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'Tab'
    ];

    if (allowedKeys.includes(event.key)) return;

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    const pasted = event.clipboardData?.getData('text') || '';
    if (!/^\d+$/.test(pasted)) {
      event.preventDefault();
    }
  }
}
