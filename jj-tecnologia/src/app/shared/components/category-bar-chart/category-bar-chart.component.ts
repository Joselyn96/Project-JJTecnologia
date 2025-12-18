import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-category-bar-chart',
  imports: [CommonModule],
  templateUrl: './category-bar-chart.component.html',
  styleUrl: './category-bar-chart.component.css'
})
export class CategoryBarChartComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() data: { categoria: string; cantidad: number }[] = [];
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
      labels: this.data.map(item => item.categoria),
      datasets: [{
        label: 'Cantidad',
        data: this.data.map(item => item.cantidad),
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        borderWidth: 1,
        barThickness: 80, // ⭐ Ancho fijo de las barras
        maxBarThickness: 50 // ⭐ Ancho máximo
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0 // Solo números enteros
          }
        },
        x: {
          grid: {
            display: false // Quita las líneas verticales
          }
        }
      },
      plugins: {
        legend: {
          display: false // Oculta la leyenda (no es necesaria)
        }
      }
    }
  });
  }
}
