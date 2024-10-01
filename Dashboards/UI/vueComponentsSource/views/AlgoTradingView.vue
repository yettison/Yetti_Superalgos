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
                    <th class="text-center">Bot Name</th>
                    <th class="text-center">Initial Balance</th>
                    <th class="text-center">End Balance</th>
                    <th class="text-center">Profit/Loss</th>
                    <th class="text-center">ROI</th>
                    <th class="text-center">Annualized Return</th>
                    <th class="text-center">Hit Ratio</th>
                    <th class="text-center">Details</th>
                  </tr>
                </thead>
                <tbody v-if="simulationData && simulationData.length > 0">
                  <tr v-for="report in simulationData" :key="report?.reportPath || 'unknown'">
                    <td class="text-center">{{ report.displayName || 'Unknown' }}</td>
                    <td class="text-center">{{ report.initialBalanceQuoted || report.initialBalanceBase || 'N/A' }}</td>
                    <td class="text-center">{{ report.endBalanceQuoted || report.endBalanceBase || 'N/A' }}</td>
                    <td class="text-center">{{ report.profitLossQuoted || report.profitLossBase || 'N/A' }}</td>
                    <td class="text-center">{{ report.ROIQuoted || report.ROIBase }}%</td>
                    <td class="text-center">{{ report.annualizedReturnQuoted || report.annualizedReturnBase }}%</td>
                    <td class="text-center">{{ report.hitRatioQuoted || report.hitRatioBase || 'N/A' }}%</td>
                    <td class="text-center">
                      <button class="btn btn-primary" @click="toggleDetails(report?.reportPath)">
                        {{ activeIndex === report?.reportPath ? 'Hide' : 'Show' }} Details
                      </button>
                    </td>
                  </tr>

                  <!-- Show additional details when the button is clicked -->
                  <tr v-if="activeIndex === report?.reportPath">
                    <td colspan="8">
                      <div class="details-section">
                        <p><strong>Begin Rate:</strong> {{ report.beginRate }}</p>
                        <p><strong>End Rate:</strong> {{ report.endRate }}</p>
                        <p><strong>Initial Base Balance ({{ report.episodeBaseAsset }}):</strong> {{ report.initialBalanceBase }}</p>
                        <p><strong>End Base Balance ({{ report.episodeBaseAsset }}):</strong> {{ report.endBalanceBase }}</p>
                        <p><strong>Initial Quoted Balance ({{ report.episodeQuotedAsset }}):</strong> {{ report.initialBalanceQuoted }}</p>
                        <p><strong>End Quoted Balance ({{ report.episodeQuotedAsset }}):</strong> {{ report.endBalanceQuoted }}</p>
                        <p><strong>Hits (Base):</strong> {{ report.hitsBase }}</p>
                        <p><strong>Fails (Base):</strong> {{ report.failsBase }}</p>
                        <p><strong>Hits (Quoted):</strong> {{ report.hitsQuoted }}</p>
                        <p><strong>Fails (Quoted):</strong> {{ report.failsQuoted }}</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <!-- Panel 2: Performance Chart -->
        <template v-slot:tabPanel-2>
          <div>
            <label for="reportSelector">Select Report:</label>
            <select id="reportSelector" v-model="selectedReport">
              <option v-for="report in simulationData" :value="report" :key="report.reportPath">
                {{ report.displayName || 'No Reports' }}
              </option>
            </select>
          </div>
          
          <div v-if="selectedReport">
            <canvas ref="performanceChartCanvas"></canvas>
            <p>Report loaded: {{ selectedReport.displayName }}</p>
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
          <div>
            <label for="candleSelector">Select Candle Data:</label>
            <select id="candleSelector" v-model="selectedCandleData">
              <option v-for="key in candleDataPaths" :value="key" :key="key">
                {{ key }}
              </option>
            </select>
          </div>

          <div v-if="selectedCandleData && candleChartData ">
              <canvas ref="candleChartCanvas"></canvas>
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
      priceChangeData: [],
      candleDataPaths: [],
      selectedReport: null,
      selectedCandleData: null, 
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
      if (newData.length) {
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
      if (newData.length) {
        this.updateCandleChart();
      }
    },
  },

  mounted() {
    this.$nextTick(() => {
        setTimeout(() => {
            if (this.simulationData.length > 0) {
                this.updatePerformanceChart();
            }

            if (this.priceChangeData.length > 0) {
                this.updateCandleChart();
            }
        }, 100);  // Delay to ensure DOM elements are ready
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
        const canvas = this.$refs.performanceChartCanvas;
        if (!canvas) {
          console.error('performanceChartCanvas is not available');
          return;
        }
        const ctx = canvas.getContext('2d');
        const labels = [new Date(this.selectedReport.beginDate), new Date(this.selectedReport.endDate)];
        const data = [this.selectedReport.initialBalanceQuoted || this.selectedReport.initialBalanceBase, 
                      this.selectedReport.endBalanceQuoted || this.selectedReport.endBalanceBase];

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

          const ctx = canvas.getContext('2d');
          const selectedData = this.priceChangeData[this.selectedCandleData];
          
          // Add logging to debug
          console.log('Selected Candle Data:', this.selectedCandleData);
          console.log('Price Change Data:', this.priceChangeData);
          console.log('Selected Data for Chart:', selectedData);
          
          if (!selectedData || selectedData.length === 0) {
              console.warn('No valid candle data to display.');
              return;
          }

          const labels = selectedData.map(candle => new Date(candle.date));  // Convert date strings to Date objects
          const highData = selectedData.map(candle => candle.high);
          const lowData = selectedData.map(candle => candle.low);

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
            }
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
          const pathParts = report.reportPath ? report.reportPath.split("\\") : [];
          report.displayName = this.generateDisplayName(report, pathParts);
          return report;
        });

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
    },

    cacheReportData(reports) {
      localStorage.setItem('cachedReports', JSON.stringify(reports));
      localStorage.setItem('cacheTimestamp', new Date().toISOString());
    },

    generateDisplayName(item, pathParts) {
      if (item.dataPath) { // Exchange | Pair Display
        const exchange = pathParts[9] || "Unknown Exchange";
        const pair = pathParts[10] || "Unknown Pair";
        const date = new Date(item.beginDate).toLocaleDateString();
        return `${exchange} | ${pair} | ${date}`;
      } else { // Report Display Name
        const cleanLastExecution = item.lastExecution || "No Execution";
        const exchange = pathParts[9] || "Unknown10";
        const pair = pathParts[10] || "Unknown12";
        const session = pathParts[12] || "Unknown14";
        return `${cleanLastExecution} | ${session} | ${pair} | ${exchange}`;
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