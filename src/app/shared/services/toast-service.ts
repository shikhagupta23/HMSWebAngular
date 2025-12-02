import { Injectable } from '@angular/core';
import { HotToastService, } from '@ngxpert/hot-toast';

@Injectable({ providedIn: 'root' })
export class ToastService {

  constructor(private toast: HotToastService) {}

  success(message: string) {
    this.toast.success(message);
  }

  error(message: string) {
    this.toast.error(message);
  }

  info(message: string) {
    this.toast.info(message);
  }

  warning(message: string) {
    this.toast.warning(message);
  }
  observe(messages: {
    loading?: string;
    success?: string;
    error?: string;
  }) {
    return this.toast.observe(messages);
  }
}
