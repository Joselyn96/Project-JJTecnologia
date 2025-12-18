import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientsLineChartComponent } from './clients-line-chart.component';

describe('ClientsLineChartComponent', () => {
  let component: ClientsLineChartComponent;
  let fixture: ComponentFixture<ClientsLineChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientsLineChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientsLineChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
