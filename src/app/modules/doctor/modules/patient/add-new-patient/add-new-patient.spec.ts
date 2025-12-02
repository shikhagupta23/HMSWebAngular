import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNewPatient } from './add-new-patient';

describe('AddNewPatient', () => {
  let component: AddNewPatient;
  let fixture: ComponentFixture<AddNewPatient>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddNewPatient]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddNewPatient);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
