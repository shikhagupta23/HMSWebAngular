import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureAssignment } from './feature-assignment';

describe('FeatureAssignment', () => {
  let component: FeatureAssignment;
  let fixture: ComponentFixture<FeatureAssignment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FeatureAssignment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FeatureAssignment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
