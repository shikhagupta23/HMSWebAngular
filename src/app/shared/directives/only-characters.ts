import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[onlyCharacters]',
  standalone: false
})
export class OnlyCharacters {

  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent) {
    const char = event.key;

    // Allow letters and space only
    if (!/^[a-zA-Z\s.-]$/.test(char)) {
      event.preventDefault();
    }
  }
}
