import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-service-type-bar-chart',
  imports: [ CommonModule ],
  templateUrl: './service-type-bar-chart.component.html',
  styleUrl: './service-type-bar-chart.component.css'
})
export class ServiceTypeBarChartComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() data: { tipo: string; cantidad: number }[] = [];
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  private chart: Chart | null = null;

  ngAfterViewInit() {
    this.createChart();
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  ngOnChanges() {
    if (this.chart) {
      this.createChart();
    }
  }

  private createChart() {
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.data.map(item => item.tipo),
        datasets: [{
          label: 'Cantidad',
          data: this.data.map(item => item.cantidad),
          backgroundColor: '#10b981',
          borderColor: '#059669',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y', // Hace las barras horizontales
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: true
          }
        }
      }
    });
  }
}
