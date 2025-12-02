import { Component, inject } from '@angular/core';
import { LoaderService } from '../../services/loader-service';

@Component({
  selector: 'app-loader',
  standalone: false,
  templateUrl: './loader.html',
  styleUrl: './loader.scss',
})
export class Loader {
  private loaderService = inject(LoaderService);
loading$ = this.loaderService.loading$;
}
