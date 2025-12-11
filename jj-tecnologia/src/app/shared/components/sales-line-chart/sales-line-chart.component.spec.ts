import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesLineChartComponent } from './sales-line-chart.component';

describe('SalesLineChartComponent', () => {
  let component: SalesLineChartComponent;
  let fixture: ComponentFixture<SalesLineChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesLineChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesLineChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
