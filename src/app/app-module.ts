import { NgModule, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { AuthLayout } from './Layout/auth-layout/auth-layout';
import { MainLayout } from './Layout/main-layout/main-layout';
import { SharedModule } from './shared/shared-module';
import { HttpClientModule, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHotToastConfig } from '@ngxpert/hot-toast';
import { FormsModule } from '@angular/forms';
import { authInterceptor } from './shared/interceptors/auth.interceptor';
import { loaderInterceptor } from './shared/interceptors/loader.interceptor';
import { Loader } from './shared/components/loader/loader';
import { Dashboard } from './shared/components/dashboard/dashboard';
import { Adminlayout } from './Layout/adminlayout/adminlayout';
import { NotificationPromptComponent } from '../../src/app/shared/components/notification-prompt/notification-prompt';
import { NotificationService } from './shared/services/notification-service';
@NgModule({
  declarations: [
    App,
    AuthLayout,
    MainLayout,
    Loader,
    Dashboard,
    Adminlayout,
    NotificationPromptComponent 
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SharedModule,
    FormsModule
  ],
  providers: [
    NotificationService,
     provideHttpClient(
    withInterceptors([authInterceptor,loaderInterceptor])
  ),
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideClientHydration(withEventReplay()),
    provideHotToastConfig({
      position: 'bottom-right',  // add config to verify toast loads
      duration: 3000
    }),
  ],
  bootstrap: [App]
})
export class AppModule { }
