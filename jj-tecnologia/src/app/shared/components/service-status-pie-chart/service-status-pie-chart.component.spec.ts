import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceStatusPieChartComponent } from './service-status-pie-chart.component';

describe('ServiceStatusPieChartComponent', () => {
  let component: ServiceStatusPieChartComponent;
  let fixture: ComponentFixture<ServiceStatusPieChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceStatusPieChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceStatusPieChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
