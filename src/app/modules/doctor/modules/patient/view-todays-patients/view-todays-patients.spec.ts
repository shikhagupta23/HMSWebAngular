import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewTodaysPatients } from './view-todays-patients';

describe('ViewTodaysPatients', () => {
  let component: ViewTodaysPatients;
  let fixture: ComponentFixture<ViewTodaysPatients>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewTodaysPatients]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewTodaysPatients);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
