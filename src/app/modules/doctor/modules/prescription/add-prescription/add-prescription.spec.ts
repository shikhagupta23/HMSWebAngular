import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPrescription } from './add-prescription';

describe('AddPrescription', () => {
  let component: AddPrescription;
  let fixture: ComponentFixture<AddPrescription>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddPrescription]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddPrescription);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
