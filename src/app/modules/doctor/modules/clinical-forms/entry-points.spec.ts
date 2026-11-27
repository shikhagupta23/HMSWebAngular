import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PatientDetails } from '../patient/patient-details/patient-details';
import { PatientService } from '../patient/services/patient-service';
import { ClinicalFormsAccessService } from './services/clinical-forms-access-service';

/** Entry points in the existing patient workflow (patient details + its appointment list). */
describe('Clinical Forms entry points: patient details', () => {
  let fixture: ComponentFixture<PatientDetails>;
  const PATIENT = 'aaaaaaaa-0000-0000-0000-000000000001';
  let previousState: unknown;

  async function render(enabled: boolean) {
    previousState = history.state;
    history.replaceState({ patient: { userId: PATIENT, fullName: 'Asha Verma', patientViewId: 1042, age: 36, gender: 'Female' } }, '');
    const load = jasmine.createSpy('load').and.returnValue(of({ isEnabled: enabled, permissions: [] }));

    await TestBed.configureTestingModule({
      declarations: [PatientDetails],
      imports: [CommonModule, FormsModule, RouterModule],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ClinicalFormsAccessService, useValue: { load, isEnabled: () => enabled } },
        {
          provide: PatientService,
          useValue: {
            getPatientAppointmentLists: () => of({ dataList: [
              { appointmentId: 'appt-1', appointmentViewId: 501, appointmentStatus: 0, appointmentDate: '2026-11-23T10:00:00' },
              { appointmentId: 'appt-2', appointmentViewId: 502, appointmentStatus: 4, appointmentDate: '2026-11-22T10:00:00' },
            ] }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientDetails);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(load).toHaveBeenCalled();
  }

  afterEach(() => history.replaceState(previousState, ''));

  const el = () => fixture.nativeElement as HTMLElement;

  it('links to the patient\'s form history only; forms are filled from the appointment lists', async () => {
    await render(true);
    const patientLink = el().querySelector<HTMLAnchorElement>('[data-test="patient-clinical-forms"]')!;
    expect(patientLink.getAttribute('href')).toBe(`/clinical-forms/patients/${PATIENT}`);
    expect(patientLink.textContent).toContain('Form history');
    expect(el().querySelector('[data-test="appointment-clinical-forms"]')).toBeNull();
  });

  it('hides the entry points when the hospital does not have Clinical Forms', async () => {
    await render(false);
    expect(el().querySelector('[data-test="patient-clinical-forms"]')).toBeNull();
    expect(el().querySelector('[data-test="appointment-clinical-forms"]')).toBeNull();
  });
});
