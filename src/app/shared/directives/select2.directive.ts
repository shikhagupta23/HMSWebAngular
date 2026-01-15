import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  AfterViewInit,
  forwardRef
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from '@angular/forms';

declare var $: any;

@Directive({
  selector: '[appSelect2]',
    standalone: false,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Select2Directive),
      multi: true
    }
  ]
})
export class Select2Directive
  implements ControlValueAccessor, AfterViewInit, OnDestroy {

  @Input() placeholder = 'Select option';

  private onChange = (_: any) => {};
  private onTouched = () => {};
  private pendingValue: any = null;
  private observer!: MutationObserver;

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    const element = this.el.nativeElement;

    $(element).select2({
      theme: 'bootstrap-5',
      width: '100%',
      placeholder: this.placeholder,
      allowClear: true,
      dropdownParent: $(element).closest('.modal')
    });

    // 🔥 OBSERVE OPTION CHANGES
    this.observer = new MutationObserver(() => {
      if (this.pendingValue !== null) {
        $(element)
          .val(this.pendingValue)
          .trigger('change.select2');
      }
    });

    this.observer.observe(element, {
      childList: true,
      subtree: true
    });

    $(element).on('change', () => {
      const value = $(element).val();
      this.onChange(value);
      this.onTouched();
    });
  }

  writeValue(value: any): void {
    this.pendingValue = value;

    $(this.el.nativeElement)
      .val(value ?? '')
      .trigger('change.select2');
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    $(this.el.nativeElement).prop('disabled', isDisabled);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    $(this.el.nativeElement).off('change');
    $(this.el.nativeElement).select2('destroy');
  }
}
