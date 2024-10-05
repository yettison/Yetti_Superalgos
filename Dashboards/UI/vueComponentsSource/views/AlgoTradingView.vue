<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-3">
        <img class="image" :src="dashboardIcon" />
      </div>
      <div class="col-9 mt-4 text-center">
        <h2><strong></strong></h2>
        <h5>Track or Compare your Trading Bots Performance!</h5>
      </div>
    </div>

    <div class="row mt-4">
      <div class="col-12">
        <Tabs :tabList="tabList" @tabChanged="handleTabChange">
          <!-- Panel 1: My Reports -->
          <template v-slot:tabPanel-1>
            <table class="table table-striped table-hover">
              <thead class="thead-dark">
                <tr>
                  <th class="text-center">Last Execution</th>
                  <th class="text-center">Bot Name</th>
                  <th class="text-center">Exchange</th>
                  <th class="text-center">Pair Asset</th>
                  <th class="text-center">Profit/Loss</th>
                  <th class="text-center">Hit Ratio</th>
                  <th class="text-center">ROI</th>
                  <th class="text-center">Annualized Return</th>
                  <th class="text-center">Details</th>
                </tr>
              </thead>
              <tbody v-if="simulationData && simulationData.length > 0">
                <template v-for="report in simulationData" :key="report.reportPath">
                  <tr>
                    <!-- Last Execution -->
                    <td class="text-center">
                      {{ report.lastExecution ? report.lastExecution.slice(0, -13) : 'N/A' }}
                    </td>
                    <!-- Bot Name -->
                    <td class="text-center">{{ report.botName || 'Unknown' }}</td>
                    <!-- Exchange -->
                    <td class="text-center">{{ report.exchange || 'Unknown' }}</td>
                    <!-- Pair Asset -->
                    <td class="text-center">{{ report.pairAsset || 'Unknown' }}</td>
                    <!-- Profit/Loss -->
                    <td class="text-center">
                      {{ typeof report.profitLossQuoted === 'number' ? report.profitLossQuoted.toFixed(2) :
                        (typeof report.profitLossBase === 'number' ? report.profitLossBase.toFixed(2) : 'N/A') }}
                    </td>
                    <!-- Hit Ratio -->
                    <td class="text-center">
                      {{ typeof report.hitRatioQuoted === 'number' ? report.hitRatioQuoted.toFixed(2) :
                        (typeof report.hitRatioBase === 'number' ? report.hitRatioBase.toFixed(2) : 'N/A') }}%
                    </td>
                    <!-- ROI -->
                    <td class="text-center">
                      {{ typeof report.ROIQuoted === 'number' ? report.ROIQuoted.toFixed(2) :
                        (typeof report.ROIBase === 'number' ? report.ROIBase.toFixed(2) : 'N/A') }}%
                    </td>
                    <!-- Annualized Return -->
                    <td class="text-center">
                      {{ typeof report.annualizedRateOfReturnQuoted === 'number' ? report.annualizedRateOfReturnQuoted.toFixed(2) :
                        (typeof report.annualizedRateOfReturnBase === 'number' ? report.annualizedRateOfReturnBase.toFixed(2) : 'N/A') }}%
                    </td>
                    <!-- Actions -->
                    <td class="text-center">
                      <div class="dropdown" :class="{ 'is-active': activeDropdown === report.reportPath }">
                        <button class="btn btn-primary btn-sm dropdown-toggle" @click="toggleDropdown(report.reportPath)">
                          ···
                        </button>
                        <div class="dropdown-menu" v-if="activeDropdown === report.reportPath">
                          <button class="dropdown-item btn btn-primary btn-sm" @click.prevent="toggleDetails(report.reportPath)">Last Report</button>
                          <button class="dropdown-item btn btn-primary btn-sm" @click.prevent="compareLastReport(report.reportPath)">Previous Report</button>
                        </div>
                      </div>
                    </td>
                  </tr>

                  <!-- Fila adicional para mostrar los detalles -->
                  <tr v-if="activeIndex === report.reportPath">
                    <td colspan="9">
                      <div class="details-section">
                        <h5>Last Report Details</h5>
                        <div class="row">
                          <!-- Columna 1 -->
                          <div class="col-md-6 col-lg-2">
                            <p><strong>Begin:</strong> {{ report.beginDate ? report.beginDate.slice(0, -13) : 'N/A' }} </p>
                            <p>@ {{ report.beginRate || 'N/A' }} {{ report.episodeQuotedAsset || '' }} </p>
                            <p><strong>End:</strong> {{ report.endDate ? report.endDate.slice(0, -13) : 'N/A' }} </p>
                            <p>@ {{ report.endRate || 'N/A' }} {{ report.episodeQuotedAsset || '' }} </p>
                            <p><strong>Periods:</strong> {{ report.periods || 'N/A' }}</p>
                            <p><strong>Time Frame:</strong> </p>
                            <p>{{ report.timeFrames || 'N/A' }}</p>
                          </div>

                          <!-- Columna 2 -->
                          <div class="col-md-6 col-lg-2">
                            <p><strong>Initial Quoted Balance ({{ report.episodeQuotedAsset || '' }}):</strong> {{ report.initialBalanceQuoted ? report.initialBalanceQuoted.toFixed(2) : 'N/A' }}</p>
                            <p><strong>End Quoted Balance ({{ report.episodeQuotedAsset || '' }}):</strong> {{ report.endBalanceQuoted ? report.endBalanceQuoted.toFixed(2) : 'N/A' }}</p>
                            <p><strong>Initial Base Balance ({{ report.episodeBaseAsset || '' }}):</strong> {{ report.initialBalanceBase ? report.initialBalanceBase.toFixed(2) : 'N/A' }}</p>
                            <p><strong>End Base Balance ({{ report.episodeBaseAsset || '' }}):</strong> {{ report.endBalanceBase ? report.endBalanceBase.toFixed(2) : 'N/A' }}</p>
                          </div>

                          <!-- Columna 3 -->
                          <div class="col-md-6 col-lg-2">
                            <p><strong>Hits (Quoted):</strong> {{ report.hitsQuoted || 'N/A' }}</p>
                            <p><strong>Fails (Quoted):</strong> {{ report.failsQuoted || 'N/A' }}</p>
                            <p><strong>Hits (Base):</strong> {{ report.hitsBase || 'N/A' }}</p>
                            <p><strong>Fails (Base):</strong> {{ report.failsBase || 'N/A' }}</p>
                          </div>

                          <!-- Columna 4 -->
                          <div class="col-md-6 col-lg-3">
                            <p><strong>Orders:</strong> {{ report.orders || 'N/A' }}</p>
                            <p><strong>Positions:</strong> {{ report.positions || 'N/A' }}</p>
                            <p><strong>Positions Open (Quoted):</strong> </p>
                            <p><strong>Positions Open (Base):</strong> </p>
                            <!-- Puedes agregar más datos aquí o dejar la columna vacía si no hay más datos -->
                          </div>

                          <!-- Columna 5 -->
                          <div class="col-md-6 col-lg-2">
                            <p><strong>Closed by TP (Quoted):</strong> </p>
                            <p><strong>Closed by SL (Quoted):</strong></p>
                            <p><strong>Closed by TP (Base):</strong> </p>
                            <p><strong>Closed by SL (Base):</strong></p>
                            <p><strong>Closed by Other (Q):</strong></p>
                            <p><strong>Closed by Other (B):</strong></p>
                            <!-- Puedes agregar más datos aquí o dejar la columna vacía si no hay más datos -->
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>

                      <!-- Fila adicional para mostrar los detalles del reporte anterior -->
                  <tr v-if="comparingIndex === report.reportPath && report.previousReport">
                    <td colspan="9">
                      <div class="details-section bg-light">
                        <h5>Previous Report Details</h5>
                        <div class="row">
                          <!-- Columna 1 -->
                          <div class="col-md-6 col-lg-2">
                            <p><strong>Begin:</strong> {{ report.previousReport.beginDate ? report.previousReport.beginDate.slice(0, -13) : 'N/A' }} </p>
                            <p>@ {{ report.previousReport.beginRate || 'N/A' }} {{ report.previousReport.episodeQuotedAsset || '' }} </p>
                            <p><strong>End:</strong> {{ report.previousReport.endDate ? report.previousReport.endDate.slice(0, -13) : 'N/A' }} </p>
                            <p>@ {{ report.previousReport.endRate || 'N/A' }} {{ report.previousReport.episodeQuotedAsset || '' }} </p>
                            <p><strong>Periods:</strong> {{ report.previousReport.periods || 'N/A' }}</p>
                            <p><strong>Time Frame:</strong> </p>
                            <p>{{ report.previousReport.timeFrames || 'N/A' }}</p>
                          </div>

                          <!-- Columna 2 -->
                          <div class="col-md-6 col-lg-2">
                            <p><strong>Initial Quoted Balance ({{ report.previousReport.episodeQuotedAsset || '' }}):</strong> {{ report.previousReport.initialBalanceQuoted ? report.previousReport.initialBalanceQuoted.toFixed(2) : 'N/A' }}</p>
                            <p><strong>End Quoted Balance ({{ report.previousReport.episodeQuotedAsset || '' }}):</strong> {{ report.previousReport.endBalanceQuoted ? report.previousReport.endBalanceQuoted.toFixed(2) : 'N/A' }}</p>
                            <p><strong>Initial Base Balance ({{ report.previousReport.episodeBaseAsset || '' }}):</strong> {{ report.previousReport.initialBalanceBase ? report.previousReport.initialBalanceBase.toFixed(2) : 'N/A' }}</p>
                            <p><strong>End Base Balance ({{ report.previousReport.episodeBaseAsset || '' }}):</strong> {{ report.previousReport.endBalanceBase ? report.previousReport.endBalanceBase.toFixed(2) : 'N/A' }}</p>
                          </div>

                          <!-- Columna 3 -->
                          <div class="col-md-6 col-lg-2">
                            <p><strong>Hits (Quoted):</strong> {{ report.previousReport.hitsQuoted || 'N/A' }}</p>
                            <p><strong>Fails (Quoted):</strong> {{ report.previousReport.failsQuoted || 'N/A' }}</p>
                            <p><strong>Hits (Base):</strong> {{ report.previousReport.hitsBase || 'N/A' }}</p>
                            <p><strong>Fails (Base):</strong> {{ report.previousReport.failsBase || 'N/A' }}</p>
                          </div>

                          <!-- Columna 4 -->
                          <div class="col-md-6 col-lg-3">
                            <p><strong>Orders:</strong> {{ report.previousReport.orders || 'N/A' }}</p>
                            <p><strong>Positions:</strong> {{ report.previousReport.positions || 'N/A' }}</p>
                            <p><strong>Positions Open (Quoted):</strong> </p>
                            <p><strong>Positions Open (Base):</strong> </p>
                            <!-- Puedes agregar más datos aquí o dejar la columna vacía si no hay más datos -->
                          </div>

                          <!-- Columna 5 -->
                          <div class="col-md-6 col-lg-2">
                            <p><strong>Closed by TP (Quoted):</strong> </p>
                            <p><strong>Closed by SL (Quoted):</strong></p>
                            <p><strong>Closed by TP (Base):</strong> </p>
                            <p><strong>Closed by SL (Base):</strong></p>
                            <p><strong>Closed by Other (Q):</strong></p>
                            <p><strong>Closed by Other (B):</strong></p>
                            <!-- Puedes agregar más datos aquí o dejar la columna vacía si no hay más datos -->
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </template>

          <!-- Panel 2: Performance Chart -->
          <template v-slot:tabPanel-2>
            <div v-if="simulationData && simulationData.length > 0">
              <div class="row align-items-end">
                <!-- Selector de Reportes -->
                <div class="col-md-6">
                  <label for="reportSelector">Select Report:</label>
                  <select id="reportSelector" class="form-control" v-model="selectedReport">
                    <option disabled value="">Select a report</option>
                    <option v-for="report in simulationData" :value="report.reportPath" :key="report.reportPath">
                      {{ report.botName || 'No Reports' }}
                    </option>
                  </select>
                </div>

                <!-- Botón para actualizar el gráfico -->
                <div class="col-md-2">
                  <button class="btn btn-primary mt-4" @click="updatePerformanceChart">Load Report</button>
                </div>
                <div class="col-md-2">
                  <button class="btn btn-primary mt-4" @click="resetZoom">Reset Zoom</button>
                </div>
              </div>

              <!-- Bot Selection Dropdown -->
              <div class="dropdown" :class="{ 'is-active': activeDropdown === 'botSelection' }">
                <button class="btn btn-primary dropdown-toggle" @click="toggleDropdown('botSelection')">Select Bots</button>
                <div class="dropdown-menu">
                  <div class="dropdown-item" v-for="(bot, index) in botList" :key="index">
                    <input type="checkbox" :id="'bot' + index" v-model="selectedBots" :value="bot" />
                    <label :for="'bot' + index">{{ bot }}</label>
                  </div>
                </div>
              </div>

              <!-- Performance Chart -->
              <div class="chart-container">
                <canvas ref="performanceChartCanvas"></canvas>
                <p>Report loaded: {{ getReportByPath(selectedReport)?.botName || 'Unknown' }}</p>
              </div>
            </div>
            <div v-else>No simulation data available.</div>
          </template>

          <template v-slot:tabPanel-3>
            <div class="col-6 mt-4 text-center">
              <h2><strong></strong></h2>
              <h5>Comming soon...</h5>
            </div>
            <div>No data for this tab.</div>
          </template>

          <!-- Panel 4: Price Change Chart -->
          <template v-slot:tabPanel-4>
            <div v-if="candleDataPaths.length > 0">
              <div class="row align-items-end">
                <!-- Selector de datos de velas -->
                <div class="col-md-4">
                  <label for="candleSelector">Select Candle Data:</label>
                  <select id="candleSelector" class="form-control" v-model="selectedCandleData">
                    <option disabled value="">Select candle data</option>
                    <option v-for="key in candleDataPaths" :value="key" :key="key">
                      {{ key }}
                    </option>
                  </select>
                </div>

                <!-- Date Range Selectors -->
                <div class="col-md-3">
                  <label for="startDate">Start Date:</label>
                  <input type="date" id="startDate" class="form-control" v-model="startDate" @change="updateCandleChart" />
                </div>
                <div class="col-md-3">
                  <label for="endDate">End Date:</label>
                  <input type="date" id="endDate" class="form-control" v-model="endDate" @change="updateCandleChart" />
                </div>

                <!-- Update Button -->
                <div class="col-md-2">
                  <button class="btn btn-primary mt-4" @click="updateCandleChart">Update Chart</button>
                </div>
              </div>

              <!-- Candle Chart -->
              <div class="chart-container">
                <canvas ref="candleChartCanvas"></canvas>
              </div>
            </div>

            <div v-else>No candle data available.</div>
          </template>
        </Tabs>
      </div>
    </div>

    <div class="row col-12 footer">
      <div class="col-6">Last update: {{ timestamp ? timestamp.slice(0, -1)  : 'No timestamp available' }}</div>
      <div class="col-6">Running on: {{ host }}</div>
    </div>
  </div>
</template>

<script>
import dashboardIcon from "../assets/dashboard.png";
import Tabs from "../components/Tabs.vue";
//import ExpandableTree from "../components/expandableTree.vue";
import "bootstrap/dist/css/bootstrap.min.css";
import { Chart as ChartJS, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { defineComponent } from 'vue';
import zoomPlugin from 'chartjs-plugin-zoom';


ChartJS.register(...registerables, zoomPlugin);

export default defineComponent({
  props: ["incomingData", "timestamp"],
  components: {
    Tabs,
    //ExpandableTree,
  },
  data() {
    return {
      tabList: ["My Reports", "Performance", "Signal Providers", "Assets"],
      dashboardIcon: dashboardIcon,
      dataKey: "Platform-SimulationResult",
      candlesDataKey: "Platform-CandlesData",
      activeTab: 0,
      simulationData: [],
      priceChangeData: {},
      candleDataPaths: [],
      selectedReport: null,
      selectedCandleData: null, 
      startDate: null,
      endDate: null,  
      performanceChart: null,
      candleChart: null,
      isDestroyed: false,
      host: location.host.split(":")[0],
      activeIndex: null,
      comparingIndex: null, 
      activeDropdown: null,
      botList: [],
      selectedBots: [],
      performanceChartData: {
        labels: [],  // Time labels
        datasets: [
          {
            label: 'Balance Over Time',
            data: [],  // Balance data
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            fill: false,
          },
        ],
      },
      performanceChartOptions: {
        plugins: {
          zoom: {
            pan: {
              enabled: true,
              mode: 'x',
            },
            zoom: {
              wheel: {
                enabled: true, // Enable zooming via mouse wheel
              },
              drag: {
                enabled: true, // Enable drag zooming
              },
              pinch: {
                enabled: true, // Enable pinch zooming for touch devices
              },
              mode: 'x', // Zoom along x-axis
            },
          },
        },
        scales: {
          x: {
            type: 'time',
            title: { display: true, text: 'Time' },
          },
          y: {
            title: { display: true, text: 'Balance' },
            beginAtZero: true,
          },
        },
      },
      candleChartData: {
        labels: [],  // Time labels for candles
        datasets: [
          {
            label: 'High Price',
            data: [],  // High price data
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            fill: false,
          },
          {
            label: 'Low Price',
            data: [],  // Low price data
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            fill: false,
          },
        ],
      },
      candleChartOptions: {
        scales: {
          x: { 
            type: 'time', 
            title: { display: true, text: 'Date' } 
          },
          y: { 
            title: { display: true, text: 'Price' }, 
            beginAtZero: false 
          }
        },
        plugins: {
          zoom: {
            pan: {
              enabled: true,
              mode: 'x',
            },
            zoom: {
              wheel: {
                enabled: true,
              },
              drag: {
                enabled: true,
              },
              mode: 'x',
            },
          },
        },
      },
    };
  },

  watch: {
    incomingData: {
      handler(newValue) {
        this.processIncomingData(newValue);
      },
      deep: true,
      immediate: true,
    },
    
    simulationData(newData) {
      if (Array.isArray(newData) && newData.length > 0) {
        this.selectedReport = this.selectedReport || newData[0];
        this.updatePerformanceChart();
      }
    },


    selectedReport(newReport) {
      if (newReport) {
        this.updatePerformanceChart();
      }
    },

    selectedCandleData(newCandleData) {
      if (newCandleData) {
        this.updateCandleChart();
      }
    },

    priceChangeData(newData) {
      if (Object.keys(newData).length > 0) {
        this.selectedCandleData = this.selectedCandleData || Object.keys(newData)[0];
        this.updateCandleChart();
      }
    },
  },

  mounted() {
    this.$nextTick(() => {
      if (this.simulationData.length > 0) {
        this.selectedReport = this.selectedReport || this.simulationData[0];
        this.updatePerformanceChart();
      }

      if (Object.keys(this.priceChangeData).length > 0) {
        this.selectedCandleData = this.selectedCandleData || Object.keys(this.priceChangeData)[0];
        this.updateCandleChart();
      }
    });
  },

  computed: {
    getTimestamp() {
      return this.timestamp || 'No timestamp available';
    }
  },

  methods: {
    
    toggleDropdown(reportPath) {
      this.activeDropdown = this.activeDropdown === reportPath ? null : reportPath;
    },

    toggleDetails(reportPath) {
      this.activeIndex = this.activeIndex === reportPath ? null : reportPath;
      this.activeDropdown = null; // Close the dropdown
      if (this.activeIndex === reportPath) {
        this.comparingIndex = null;
      }
    },

    compareLastReport(reportPath) {
      this.comparingIndex = this.comparingIndex === reportPath ? null : reportPath;
      this.activeDropdown = null; // Close the dropdown
      if (this.comparingIndex === reportPath) {
        this.activeIndex = null;
      }
    },

    resetZoom() {
      if (this.performanceChart) {
        this.performanceChart.resetZoom();
      }
      if (this.candleChart) {
        this.candleChart.resetZoom();
      }
    },

    processCandlesData(candlesData) {
      try {
        const parsedData = typeof candlesData === 'string' ? JSON.parse(candlesData) : candlesData;
        this.priceChangeData = parsedData;
      } catch (error) {
        console.error('Error parsing candlesData:', error);
      }
    },

    getReportByPath(reportPath) {
      return this.simulationData.find(report => report.reportPath === reportPath);
    },

    activateTab(index) {
      this.activeTab = index;
      if (index === 1) {
        this.$nextTick(() => {
          this.updatePerformanceChart();
        });
      } else if (index === 3) {
        this.$nextTick(() => {
          this.updateCandleChart();
        });
      }
    },

    handleTabChange(tabIndex) {
      this.activeTab = tabIndex;
      if (tabIndex === 1) {
        this.$nextTick(() => {
          if (this.$refs.performanceChartCanvas) {
            this.updatePerformanceChart();
          }
        });
      } else if (tabIndex === 3) {
        this.$nextTick(() => {
          if (this.$refs.candleChartCanvas) {
            this.updateCandleChart();
          }
        });
      }
    },

    updatePerformanceChart() {
      this.$nextTick(() => {
        const selectedReport = this.getReportByPath(this.selectedReport);
        if (!selectedReport) {
          console.warn('No selected report to display.');
          return;
        }

        const canvas = this.$refs.performanceChartCanvas;
        if (!canvas || !canvas.getContext) {
          console.error('performanceChartCanvas is not available or not initialized.');
          return;
        }

        const ctx = canvas.getContext('2d');
        const labels = [
          new Date(selectedReport.beginDate),
          new Date(selectedReport.endDate),
        ];
        const data = [
          selectedReport.initialBalanceQuoted || selectedReport.initialBalanceBase,
          selectedReport.endBalanceQuoted || selectedReport.endBalanceBase,
        ];

        this.performanceChartData.labels = labels;
        this.performanceChartData.datasets[0].data = data;

        if (this.performanceChart) {
          this.performanceChart.destroy();
        }

        this.performanceChart = new ChartJS(ctx, {
          type: 'line',
          data: this.performanceChartData,
          options: this.performanceChartOptions,
        });
      });
    },

    updateCandleChart() {
      this.$nextTick(() => {
        const canvas = this.$refs.candleChartCanvas;
        if (!canvas || !canvas.getContext) {
          console.error('Candle chart canvas is not available or not initialized.');
          return;
        }

        if (!this.selectedCandleData) {
          console.warn('No selected candle data to display.');
          return;
        }

        const ctx = canvas.getContext('2d');
        const selectedData = this.priceChangeData[this.selectedCandleData];

        if (!selectedData || selectedData.length === 0) {
          console.warn('No valid candle data to display.');
          return;
        }

        // Filter data based on selected date range
        let filteredData = selectedData;
        if (this.startDate) {
          const startDateObj = new Date(this.startDate);
          filteredData = filteredData.filter(candle => candle.date >= startDateObj);
        }
        if (this.endDate) {
          const endDateObj = new Date(this.endDate);
          filteredData = filteredData.filter(candle => candle.date <= endDateObj);
        }

        if (filteredData.length === 0) {
          console.warn('No candle data available in the selected date range.');
          return;
        }

        const labels = filteredData.map(candle => candle.date);
        const highData = filteredData.map(candle => candle.high);
        const lowData = filteredData.map(candle => candle.low);

        this.candleChartData.labels = labels;
        this.candleChartData.datasets = [
          {
            label: 'High Price',
            data: highData,
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            fill: false,
          },
          {
            label: 'Low Price',
            data: lowData,
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            fill: false,
          },
        ];

        if (this.candleChart) {
          this.candleChart.destroy();
        }

        this.candleChart = new ChartJS(ctx, {
          type: 'line',
          data: this.candleChartData,
          options: this.candleChartOptions,
        });
      });
    },

    processIncomingData(data) {
      // Procesar datos de reporte
      if (this.dataKey in data) {
        const incomingReports = data[this.dataKey] || [];
        incomingReports.forEach(report => {
          if (!report || !report.reportPath) {
            console.warn('Reporte sin reportPath:', report);
            return;
          }
          const pathParts = report.reportPath.split("\\");
          report.displayName = this.generateDisplayName(report, pathParts);

          const isPrevious = report.isPreviousReport;
          const normalizedReportPath = report.reportPath.replace('Status.Report.json.Previous.json', 'Status.Report.json');

          const existingIndex = this.simulationData.findIndex(r => r.reportPath === normalizedReportPath);

          if (isPrevious) {
            // Es un reporte anterior
            if (existingIndex !== -1) {
              // Agregar el previousReport al reporte existente
              this.simulationData[existingIndex].previousReport = report;
            } else {
              // Crear una nueva entrada si el reporte actual no existe aún
              this.simulationData.push({
                reportPath: normalizedReportPath,
                previousReport: report,
              });
            }
          } else {
            // Es un reporte actual
            if (existingIndex !== -1) {
              // Actualizar el reporte existente
              this.simulationData[existingIndex] = Object.assign(this.simulationData[existingIndex], report);
            } else {
              // Agregar un nuevo reporte
              this.simulationData.push(report);
            }
          }
        });

        // Filtrar simulationData para que solo contenga reportes actuales
        this.simulationData = this.simulationData.filter(report => report && report.reportPath && !report.isPreviousReport);

        this.$nextTick(() => {
          if (this.$refs.performanceChartCanvas && this.simulationData.length > 0) {
            this.updatePerformanceChart();
          }
        });
      }
      if (!this.selectedReport && this.simulationData.length > 0) {
        this.selectedReport = this.simulationData[0];
      }

      // Procesar datos de velas (sin cambios)
      if (this.candlesDataKey in data) {
        const newCandleData = data[this.candlesDataKey].map(candle => {
          if (!candle || !candle.exchangePair || !Array.isArray(candle.candleData) || candle.candleData.length === 0) {
            console.warn('Missing or invalid candle data:', candle);
            return null;
          }

          const pathParts = candle.exchangePair.split("|");
          if (pathParts.length < 2) {
            console.warn('Invalid exchange pair structure:', candle.exchangePair);
            return null;
          }

          const exchange = pathParts[0].trim();
          const pair = pathParts[1].trim();

          const validCandles = candle.candleData.filter(cd => cd.high > 0 && cd.low > 0 && cd.beginDate && cd.endDate);
          if (validCandles.length === 0) {
            console.warn('No valid candle data in:', candle);
            return null;
          }

          return {
            exchange: exchange,
            pair: pair,
            candles: validCandles.map(c => ({
              date: new Date(c.beginDate),
              high: c.high,
              low: c.low
            }))
          };
        }).filter(candle => candle !== null);

        if (newCandleData.length === 0) {
          console.warn('No valid candle data to display.');
          return;
        }

        newCandleData.forEach(({ exchange, pair, candles }) => {
          const key = `${exchange} | ${pair}`;
          this.priceChangeData[key] = candles;
        });

        this.candleDataPaths = Object.keys(this.priceChangeData);

        if (!this.selectedCandleData && this.candleDataPaths.length > 0) {
          this.selectedCandleData = this.candleDataPaths[0];
        }

        this.$nextTick(() => {
          if (this.$refs.candleChartCanvas && this.candleDataPaths.length > 0) {
            this.updateCandleChart();
          }
        });
      }
      if (!this.selectedCandleData && this.candleDataPaths.length > 0) {
        this.selectedCandleData = this.candleDataPaths[0];
      }
    },
  


    cacheReportData(reports) {
      localStorage.setItem('cachedReports', JSON.stringify(reports));
      localStorage.setItem('cacheTimestamp', new Date().toISOString());
    },

    generateDisplayName(item, pathParts) {
      if (item.dataPath) {
        // Este bloque no es relevante para nuestros reportes actuales, lo podemos omitir o ajustar según sea necesario.
      } else {
        // Report Display Name
        const cleanLastExecution = item.lastExecution || "No Execution";
        const exchange = pathParts[9] || "Unknown Exchange";
        const pair = pathParts[10] || "Unknown Pair";
        const session = pathParts[12] || "Unknown Session";
        const botName = session; // Asignamos el session como botName

        // Asignamos las propiedades al objeto item (report)
        item.lastExecution = cleanLastExecution;
        item.exchange = exchange;
        item.pairAsset = pair;
        item.botName = botName;

        // Retornamos un displayName si aún lo necesitamos
        return `${cleanLastExecution} | ${botName} | ${pair} | ${exchange}`;
      }
    },
  },
});
</script>


<style scoped>
.dashboard-window {
  font-size: bold;
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
  height: auto;
}

.image {
  margin-top: 10px;
  height: 100px;
}

.btn-primary {
  margin-right: 2px;
  margin-left: 2px;
  background-color: #343a40;
  color: #fff;
}

.table-responsive {
  max-height: 70vh;
  overflow-y: auto;
}

.table {
  margin-top: 20px;
  background-color: #f8f9fa;
}

thead {
  background-color: #343a40;
  color: #fff;
  text-align: center;
}

.table-hover tbody tr:hover {
  background-color: #dee2e6;
}

.details-section {
  padding: 10px;
  background-color: #f1f1f1;
  border: 1px solid #ddd;
  display: block;
  width: 100%;
}

.details-section.bg-light {
  background-color: #e9ecef;
  display: block;
  width: 100%;
}

.col-md-6, .col-lg-2, .col-lg-3 {
  flex: 1; /* Ensure columns expand to full width inside details */
  margin-bottom: 10px; /* Add space between each block */
}

.empty {
  text-align: center;
  font-size: 1.2em;
  color: #6c757d;
  padding: 20px;
}

.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-menu {
  display: none; /* Oculto por defecto */
  position: absolute;
  z-index: 1000;
  background-color: #343a40;
  min-width: 1rem;
  padding: 0;
  margin-bottom: 20px; /* Add spacing between details */
  font-size: 1rem;
  text-align: left;
  list-style: none;
  border: none;
  border-radius: 0;
  right: 0; /* Alinear el menú al lado derecho */
}

.dropdown.is-active .dropdown-menu {
  display: block;
}

.dropdown-menu .dropdown-item {
  width: 100%;
  padding: 0.25rem 1rem;
  text-align: left;
  background-color: #343a40;
  color: #fff;
}

.dropdown-menu .btn {
  width: 100%;
  text-align: left;
  background-color: transparent;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
}

.dropdown-menu .dropdown-item:hover {
  background-color: #495057;
}

.dropdown-menu .btn {
  width: 100%;
  text-align: left;
  background-color: transparent;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
}


button {
  font-size: 0.9em;
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: #c5c4c42a;
  color: #000;
  padding: 5px 0;
  text-align: center;
  z-index: 1000;
}

.chart-container {
  position: relative;
  max-width: 80%;
  max-height: 400px;
  margin: 20px auto;
  overflow: hidden;
}

canvas {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: 100% !important;
  height: auto !important;
}


@media (max-width: 768px) {
  .image {
    height: 80px;
  }
}

</style>