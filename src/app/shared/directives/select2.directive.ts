import { Directive, ElementRef, inject, Input, OnInit, OnDestroy  } from '@angular/core';
import { NgControl } from '@angular/forms';
declare var $: any;

@Directive({
  selector: '[appSelect2]',
  standalone: false,
})
export class Select2Directive implements OnInit, OnDestroy {

  @Input() placeholder: string = 'Select option';
    private el = inject(ElementRef);
    private control = inject(NgControl);
    constructor() {}

  ngOnInit() {
    setTimeout(() => {
        $(this.el.nativeElement).select2({
            theme: 'bootstrap-5',
            width: '100%',
            placeholder: this.placeholder,
            allowClear: true
        });
    }, 0);

    $(this.el.nativeElement).on('change', () => {
      const value = $(this.el.nativeElement).val();
      this.control.control?.setValue(value);
      this.control.control?.markAsTouched();
    });
  }

  ngOnDestroy() {
    $(this.el.nativeElement).off('change');
  }
  
}
