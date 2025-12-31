import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrescriptionHelperValues } from './prescription-helper-values';

describe('PrescriptionHelperValues', () => {
  let component: PrescriptionHelperValues;
  let fixture: ComponentFixture<PrescriptionHelperValues>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PrescriptionHelperValues]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrescriptionHelperValues);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
