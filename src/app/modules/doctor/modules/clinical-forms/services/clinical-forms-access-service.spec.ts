import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { ClinicalFormsAccessService } from './clinical-forms-access-service';
import { ClinicalFormsApiService } from './clinical-forms-api-service';
import { AuthService } from '../../../../auth/services/auth-service';
import { clinicalFormsGuard, clinicalFormsPermissionGuard } from '../guards/clinical-forms.guard';
import { MenuService } from '../../../../../shared/services/menu-service';
import { MenuItem } from '../../../../../shared/constants/menu.config';
import { ClinicalFormAccess } from '../models/clinical-forms.models';
import { ClinicalFormsError } from './clinical-forms-error';

describe('Clinical Forms access', () => {
  let getAccess: jasmine.Spy<() => Observable<ClinicalFormAccess>>;
  let token: string | null;
  let access: ClinicalFormsAccessService;

  beforeEach(() => {
    token = 'token-1';
    getAccess = jasmine.createSpy('getAccess').and.returnValue(of({ isEnabled: true, permissions: ['ViewPatientForms', 'FillPatientForms'] }));
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ClinicalFormsApiService, useValue: { getAccess } },
        { provide: AuthService, useValue: { getToken: () => token, get role() { return 'Doctor'; }, hasFeature: () => false, hasAnyExtendableFeature: () => false } },
      ],
    });
    access = TestBed.inject(ClinicalFormsAccessService);
  });

  describe('ClinicalFormsAccessService', () => {
    it('loads access once per login and exposes permissions', () => {
      access.load().subscribe();
      access.load().subscribe();
      expect(getAccess).toHaveBeenCalledTimes(1);
      expect(access.isEnabled()).toBeTrue();
      expect(access.has('FillPatientForms')).toBeTrue();
      expect(access.has('ClinicalEdit')).toBeFalse();
    });

    it('reloads after a new login', () => {
      access.load().subscribe();
      token = 'token-2';
      access.load().subscribe();
      expect(getAccess).toHaveBeenCalledTimes(2);
    });

    it('means no access when the call fails or nobody is logged in', () => {
      getAccess.and.returnValue(throwError(() => new ClinicalFormsError('forbidden', 403, 'Forbidden')));
      access.load().subscribe();
      expect(access.isEnabled()).toBeFalse();

      token = null;
      let result: ClinicalFormAccess | undefined;
      access.load().subscribe((r) => (result = r));
      expect(result?.isEnabled).toBeFalse();
      expect(getAccess).toHaveBeenCalledTimes(1);
    });
  });

  describe('clinicalFormsGuard', () => {
    function runGuard(): boolean | UrlTree {
      let result: boolean | UrlTree = false;
      TestBed.runInInjectionContext(() => {
        (clinicalFormsGuard({} as never, {} as never) as Observable<boolean | UrlTree>).subscribe((r) => (result = r));
      });
      return result;
    }

    it('allows entry when the feature is enabled', () => {
      expect(runGuard()).toBeTrue();
    });

    it('redirects to the dashboard when the feature is not enabled', () => {
      getAccess.and.returnValue(of({ isEnabled: false, permissions: [] }));
      const result = runGuard();
      expect(result instanceof UrlTree).toBeTrue();
      expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/dashboard');
    });
  });

  describe('clinicalFormsPermissionGuard', () => {
    function runGuard(): boolean | UrlTree {
      let result: boolean | UrlTree = false;
      TestBed.runInInjectionContext(() => {
        (clinicalFormsPermissionGuard('ManageHospitalTemplates')({} as never, {} as never) as Observable<boolean | UrlTree>).subscribe((r) => (result = r));
      });
      return result;
    }

    it('lets hospital Admins (ManageHospitalTemplates) into configuration', () => {
      getAccess.and.returnValue(of({ isEnabled: true, permissions: ['ViewPatientForms', 'ManageHospitalTemplates'] }));
      expect(runGuard()).toBeTrue();
    });

    it('sends other roles back to Clinical Forms', () => {
      const result = runGuard(); // Doctor/Receptionist permissions from the default spy
      expect(result instanceof UrlTree).toBeTrue();
      expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/clinical-forms');
    });
  });

  describe('menu visibility', () => {
    const items: MenuItem[] = [
      { label: 'Patients', icon: '', route: '/patient', roles: ['Doctor'] },
      { label: 'Clinical Forms', icon: '', route: '/clinical-forms', roles: ['Doctor'], requiresClinicalForms: true },
    ];

    it('hides Clinical Forms until the server reports access, then shows it', () => {
      const menu = TestBed.inject(MenuService);
      expect(menu.getFilteredMenu(items).map((i) => i.label)).toEqual(['Patients']);
      access.load().subscribe();
      expect(menu.getFilteredMenu(items).map((i) => i.label)).toEqual(['Patients', 'Clinical Forms']);
    });

    it('shows Clinical Forms Configuration only with the ManageHospitalTemplates permission', () => {
      const config: MenuItem = { label: 'Clinical Forms Configuration', icon: '', route: '/clinical-forms/configuration', roles: ['Doctor'], requiresClinicalForms: true, clinicalFormsPermission: 'ManageHospitalTemplates' };
      const menu = TestBed.inject(MenuService);
      access.load().subscribe();
      expect(menu.getFilteredMenu([config]).length).toBe(0);
      access.reset();
      getAccess.and.returnValue(of({ isEnabled: true, permissions: ['ViewPatientForms', 'ManageHospitalTemplates'] }));
      access.load().subscribe();
      expect(menu.getFilteredMenu([config]).map((i) => i.label)).toEqual(['Clinical Forms Configuration']);
    });

    it('keeps Clinical Forms hidden when the hospital does not have the feature', () => {
      getAccess.and.returnValue(of({ isEnabled: false, permissions: [] }));
      access.load().subscribe();
      expect(TestBed.inject(MenuService).getFilteredMenu(items).map((i) => i.label)).toEqual(['Patients']);
    });
  });
});
