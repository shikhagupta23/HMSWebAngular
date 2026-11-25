import { inject, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, shareReplay, tap } from 'rxjs/operators';
import { AuthService } from '../../../../auth/services/auth-service';
import { ClinicalFormAccess, ClinicalFormPermission } from '../models/clinical-forms.models';
import { ClinicalFormsApiService } from './clinical-forms-api-service';

export const NO_CLINICAL_FORMS_ACCESS: ClinicalFormAccess = Object.freeze({ isEnabled: false, permissions: [] });

/**
 * Server-verified Clinical Forms access for the current user (GET getAccess), cached per auth token.
 * Used for menu visibility, route guarding and showing actions. It only drives the UI: every API call
 * is independently authorized by the server.
 */
@Injectable({ providedIn: 'root' })
export class ClinicalFormsAccessService {
  private readonly api = inject(ClinicalFormsApiService);
  private readonly auth = inject(AuthService);

  private readonly state = signal<ClinicalFormAccess>(NO_CLINICAL_FORMS_ACCESS);
  /** Current access (no access until loaded). */
  readonly access = this.state.asReadonly();

  private cached$: Observable<ClinicalFormAccess> | null = null;
  private cachedForToken: string | null = null;

  /** Loads access once per login; failures (or no session) mean "no access". */
  load(force = false): Observable<ClinicalFormAccess> {
    const token = this.auth.getToken();
    if (!token) {
      this.reset();
      return of(NO_CLINICAL_FORMS_ACCESS);
    }
    if (!force && this.cached$ && this.cachedForToken === token) return this.cached$;

    this.cachedForToken = token;
    this.cached$ = this.api.getAccess().pipe(
      catchError(() => of(NO_CLINICAL_FORMS_ACCESS)),
      tap((access) => this.state.set({ isEnabled: !!access?.isEnabled, permissions: access?.permissions ?? [] })),
      shareReplay(1),
    );
    return this.cached$;
  }

  isEnabled(): boolean {
    return this.state().isEnabled;
  }

  has(permission: ClinicalFormPermission): boolean {
    return this.state().permissions.includes(permission);
  }

  reset(): void {
    this.cached$ = null;
    this.cachedForToken = null;
    this.state.set(NO_CLINICAL_FORMS_ACCESS);
  }
}
