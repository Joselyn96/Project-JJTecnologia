import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopProductsChartComponentComponent } from './top-products-chart-component.component';

describe('TopProductsChartComponentComponent', () => {
  let component: TopProductsChartComponentComponent;
  let fixture: ComponentFixture<TopProductsChartComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopProductsChartComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopProductsChartComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
