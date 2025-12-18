import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryBarChartComponent } from './category-bar-chart.component';

describe('CategoryBarChartComponent', () => {
  let component: CategoryBarChartComponent;
  let fixture: ComponentFixture<CategoryBarChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryBarChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoryBarChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
