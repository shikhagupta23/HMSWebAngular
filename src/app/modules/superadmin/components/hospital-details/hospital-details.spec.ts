import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HospitalDetails } from './hospital-details';

describe('HospitalDetails', () => {
  let component: HospitalDetails;
  let fixture: ComponentFixture<HospitalDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HospitalDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HospitalDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
