import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationService } from './location-service';

describe('LocationService', () => {
  let component: LocationService;
  let fixture: ComponentFixture<LocationService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationService],
    }).compileComponents();

    fixture = TestBed.createComponent(LocationService);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
