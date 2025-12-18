import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-clients-line-chart',
  imports: [ CommonModule ],
  templateUrl: './clients-line-chart.component.html',
  styleUrl: './clients-line-chart.component.css'
})
export class ClientsLineChartComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() data: { mes: string; cantidad: number }[] = [];
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
      type: 'line',
      data: {
        labels: this.data.map(item => item.mes),
        datasets: [{
          label: 'Clientes Registrados',
          data: this.data.map(item => item.cantidad),
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderColor: '#8b5cf6',
          borderWidth: 2,
          tension: 0.4, // Hace la línea curva
          fill: true,
          pointBackgroundColor: '#8b5cf6',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
}
