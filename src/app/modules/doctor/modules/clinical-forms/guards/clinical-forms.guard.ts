import { inject } from '@angular/core';
import { CanActivateFn, CanDeactivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { ClinicalFormsAccessService } from '../services/clinical-forms-access-service';
import { ClinicalFormPermission } from '../models/clinical-forms.models';

/**
 * Lets the user into Clinical Forms only when the server reports the feature enabled for them
 * (hospital grant + role). Otherwise redirects to the dashboard. The server still authorizes every call.
 */
export const clinicalFormsGuard: CanActivateFn = () => {
  const access = inject(ClinicalFormsAccessService);
  const router = inject(Router);
  return access.load().pipe(map((result) => (result.isEnabled ? true : router.createUrlTree(['/dashboard']))));
};

/**
 * Requires a specific Clinical Forms permission from the server's getAccess result (e.g. the hospital
 * Admin's ManageHospitalTemplates). UI convenience only: every API call is authorized by the server.
 */
export function clinicalFormsPermissionGuard(permission: ClinicalFormPermission): CanActivateFn {
  return () => {
    const access = inject(ClinicalFormsAccessService);
    const router = inject(Router);
    return access.load().pipe(
      map((result) => (result.isEnabled && result.permissions.includes(permission) ? true : router.createUrlTree(['/clinical-forms']))),
    );
  };
}

/** Implemented by pages that can hold unsaved changes. */
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/** Asks before leaving a page with unsaved changes (native confirm, as used elsewhere in the app). */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) =>
  !component?.hasUnsavedChanges() || window.confirm('You have unsaved changes. Leave this page and discard them?');
