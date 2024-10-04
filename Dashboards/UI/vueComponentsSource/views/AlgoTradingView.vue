<template>
  <div class="dashboard-window container-fluid">
    <div class="row col-12">
      <div class="col-3">
        <img class="image" :src="dashboardIcon" />
      </div>
      <div class="col-6 mt-4 text-center">
        <h2><strong></strong></h2>
        <h5>Track or Compare your Trading Bots Performance!</h5>
      </div>
    </div>
    
    <div class="row col-12">
      <Tabs :tabList="tabList" @tabChanged="handleTabChange">

        <!-- Panel 1: My Reports -->
        <template v-slot:tabPanel-1>
          <div class="dashboard-window container-fluid">
            <div class="row col-12">
              <table class="table table-striped table-hover">
                <thead>
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
                      <td class="text-center">{{ report.lastExecution || 'N/A' }}</td>
                      <!-- Bot Name -->
                      <td class="text-center">{{ report.botName || 'Unknown' }}</td>
                      <!-- Exchange -->
                      <td class="text-center">{{ report.exchange || 'Unknown' }}</td>
                      <!-- Pair Asset -->
                      <td class="text-center">{{ report.pairAsset || 'Unknown' }}</td>
                      <!-- Profit/Loss -->
                      <td class="text-center">{{ report.profitLossQuoted || report.profitLossBase || 'N/A' }}</td>
                      <!-- Hit Ratio -->
                      <td class="text-center">{{ report.hitRatioQuoted || report.hitRatioBase || 'N/A' }}%</td>
                      <!-- ROI -->
                      <td class="text-center">{{ report.ROIQuoted || report.ROIBase }}%</td>
                      <!-- Annualized Return -->
                      <td class="text-center">{{ report.annualizedReturnQuoted || report.annualizedReturnBase }}%</td>
                      <!-- Details Button -->
                      <td class="text-center">
                        <button class="btn btn-primary" @click="toggleDetails(report.reportPath)">
                          {{ activeIndex === report.reportPath ? 'Hide' : 'Show' }} Details
                        </button>
                      </td>
                    </tr>

                    <!-- Fila adicional para mostrar los detalles -->
                    <tr v-if="activeIndex === report.reportPath">
                      <td colspan="12">
                        <div class="details-section">
                          <div class="row">
                            <!-- Columna 1 -->
                            <div class="col-md-6 col-lg-3">
                              <p><strong>Begin Date:</strong> {{ report.beginDate ?? 'N/A' }}</p>
                              <p><strong>End Date:</strong> {{ report.endDate ?? 'N/A' }}</p>
                              <p><strong>Begin Rate:</strong> {{ report.beginRate ?? 'N/A' }}</p>
                              <p><strong>End Rate:</strong> {{ report.endRate ?? 'N/A' }}</p>
                            </div>

                            <!-- Columna 2 -->
                            <div class="col-md-6 col-lg-3">
                              <p><strong>Initial Quoted Balance ({{ report.episodeQuotedAsset }}):</strong> {{ report.initialBalanceQuoted }}</p>
                              <p><strong>End Quoted Balance ({{ report.episodeQuotedAsset }}):</strong> {{ report.endBalanceQuoted }}</p>
                              <p><strong>Initial Base Balance ({{ report.episodeBaseAsset }}):</strong> {{ report.initialBalanceBase }}</p>
                              <p><strong>End Base Balance ({{ report.episodeBaseAsset }}):</strong> {{ report.endBalanceBase }}</p>
                            </div>

                            <!-- Columna 3 -->
                            <div class="col-md-6 col-lg-2">
                              <p><strong>Hits (Quoted):</strong> {{ report.hitsQuoted }}</p>
                              <p><strong>Fails (Quoted):</strong> {{ report.failsQuoted }}</p>
                              <p><strong>Hits (Base):</strong> {{ report.hitsBase }}</p>
                              <p><strong>Fails (Base):</strong> {{ report.failsBase }}</p>
                              <!-- Puedes agregar más datos aquí si lo deseas -->
                            </div>

                            <!-- Columna 4 -->
                            <div class="col-md-6 col-lg-2">
                              <p><strong>Positions Open (Quoted):</strong> {{ report.hitsQuoted }}</p>
                              <p><strong>Closed by TP (Quoted):</strong> {{ report.failsQuoted }}</p>
                              <p><strong>Closed by SL (Quoted):</strong> {{ report.hitsBase }}</p>
                              <p><strong>Closed by Other (Quoted):</strong> {{ report.failsBase }}</p>
                              <!-- Puedes agregar más datos aquí o dejar la columna vacía si no hay más datos -->
                            </div>

                            <!-- Columna 5 -->
                            <div class="col-md-6 col-lg-2">
                              <p><strong>Positions Open (Base):</strong> {{ report.hitsQuoted }}</p>
                              <p><strong>Closed by TP (Base):</strong> {{ report.failsQuoted }}</p>
                              <p><strong>Closed by SL (Base):</strong> {{ report.hitsBase }}</p>
                              <p><strong>Closed by Other (Base):</strong> {{ report.failsBase }}</p>
                              <!-- Puedes agregar más datos aquí o dejar la columna vacía si no hay más datos -->
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>
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
            </div>

            <!-- Gráfico de rendimiento -->
            <div class="mt-4">
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

              <!-- Selectores de rango de fechas -->
              <div class="col-md-3">
                <label for="startDate">Start Date:</label>
                <input type="date" id="startDate" class="form-control" v-model="startDate" @change="updateCandleChart" />
              </div>
              <div class="col-md-3">
                <label for="endDate">End Date:</label>
                <input type="date" id="endDate" class="form-control" v-model="endDate" @change="updateCandleChart" />
              </div>

              <!-- Botón para actualizar el gráfico -->
              <div class="col-md-2">
                <button class="btn btn-primary mt-4" @click="updateCandleChart">Update Chart</button>
              </div>
            </div>

            <!-- Gráfico de velas -->
            <div class="mt-4">
              <canvas ref="candleChartCanvas"></canvas>
            </div>
          </div>

          <div v-else>No candle data available.</div>
        </template>

      </Tabs>
    </div>
    
    <div class="row col-12">
      <div class="col-6">Last update: {{ timestamp ? timestamp.slice(0, -1) : 'No timestamp available' }}</div>
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

ChartJS.register(...registerables);

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
        scales: {
          x: { type: 'time', title: { display: true, text: 'Time' } },
          y: { 
            title: { display: true, text: 'Balance' },
            beginAtZero: true,
            position: 'right'  // Move Y-axis to the right
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
            title: { display: true, text: 'Time' },
          },
          y: { 
            title: { display: true, text: 'Price' }, 
            beginAtZero: false, 
            position: 'right'  // Move Y-axis to the right
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

    toggleDetails(reportPath) {
      this.activeIndex = this.activeIndex === reportPath ? null : reportPath;
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
        if (!canvas) {
          console.error('performanceChartCanvas is not available');
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
        if (!canvas) {
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
        const newReports = (data[this.dataKey] || []).map(report => {
          if (!report || !report.reportPath) {
            console.warn('Reporte sin reportPath:', report);
            return null;
          }
          const pathParts = report.reportPath.split("\\");
          report.displayName = this.generateDisplayName(report, pathParts);
          return report;
        }).filter(report => report !== null); // Filtrar reportes inválidos

        // Limpiar simulationData existente para eliminar entradas inválidas
        this.simulationData = this.simulationData.filter(report => report && report.reportPath);

        // Actualizar reportes
        newReports.forEach(newReport => {
          const existingIndex = this.simulationData.findIndex(report => report.reportPath === newReport.reportPath);
          if (existingIndex === -1) {
            this.simulationData.push(newReport);
          } else if (JSON.stringify(newReport) !== JSON.stringify(this.simulationData[existingIndex])) {
            this.simulationData[existingIndex] = newReport;
          }
        });

        this.$nextTick(() => {
          if (this.$refs.performanceChartCanvas && this.simulationData.length > 0) {
            this.updatePerformanceChart();
          }
        });
      }
      if (!this.selectedReport && this.simulationData.length > 0) {
        this.selectedReport = this.simulationData[0];
      }

      // Procesar datos de velas
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
              date: new Date(c.beginDate),  // Convert beginDate to Date object
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
}

.image {
    margin-top: 10px;
    height: 100px;
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

.text-center {
  text-align: center;
}

.text-left {
  text-align: left;
}

.details-section {
  padding: 10px;
}

.details-section p {
  margin-bottom: 5px;
}

.empty {
  text-align: center;
  font-size: 1.2em;
  color: #6c757d;
  padding: 20px;
}

button {
  font-size: 0.9em;
}
</style>