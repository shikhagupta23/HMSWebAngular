import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintSetting } from './print-setting';

describe('PrintSetting', () => {
  let component: PrintSetting;
  let fixture: ComponentFixture<PrintSetting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PrintSetting]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrintSetting);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
