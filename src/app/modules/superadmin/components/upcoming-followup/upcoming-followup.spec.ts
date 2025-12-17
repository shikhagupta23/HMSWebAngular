import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpcomingFollowup } from './upcoming-followup';

describe('UpcomingFollowup', () => {
  let component: UpcomingFollowup;
  let fixture: ComponentFixture<UpcomingFollowup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UpcomingFollowup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpcomingFollowup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
