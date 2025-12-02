import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewLabtest } from './view-labtest';

describe('ViewLabtest', () => {
  let component: ViewLabtest;
  let fixture: ComponentFixture<ViewLabtest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewLabtest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewLabtest);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
