import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: false,
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {

  // @HostListener('window:scroll', [])
  // onWindowScroll() {
  //   const footer = document.querySelector('.footer') as HTMLElement;

  //   if (!footer) return;

  //   if (window.scrollY > 50) {
  //     footer.classList.add('sticky');
  //   } else {
  //     footer.classList.remove('sticky');
  //   }
  // }
}
