import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceTypeBarChartComponent } from './service-type-bar-chart.component';

describe('ServiceTypeBarChartComponent', () => {
  let component: ServiceTypeBarChartComponent;
  let fixture: ComponentFixture<ServiceTypeBarChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceTypeBarChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceTypeBarChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
