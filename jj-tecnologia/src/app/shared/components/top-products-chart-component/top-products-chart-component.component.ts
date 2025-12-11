import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIf } from '@angular/common';
import Chart from 'chart.js/auto';
import { DashboardService } from '../../../services/dashboard.service';

@Component({
  selector: 'app-top-products-chart-component',
  imports: [NgIf, CommonModule],
  templateUrl: './top-products-chart-component.component.html',
  styleUrl: './top-products-chart-component.component.css'
})
export class TopProductsChartComponentComponent implements AfterViewInit{
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;

  constructor(private dashboardService: DashboardService) {}

  async ngAfterViewInit(): Promise<void> {
    const topProducts = await this.dashboardService.getTopProducts();

    const labels = topProducts.map(p => p.name);
    const data = topProducts.map(p => p.total);

    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destruir gráfico anterior si existe
    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: 'bar',  // 👈 GRÁFICO DE BARRAS
      data: {
        labels,
        datasets: [
          {
            label: 'Cantidad vendida',
            data,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1
          }
        ]
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
          legend: { display: false }
        }
      }
    });
  }
}
