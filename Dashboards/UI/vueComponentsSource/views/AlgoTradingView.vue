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
            <div class="table-responsive">
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
                <template v-for="(report) in simulationData" :key="report.reportPath">
                  <tr>
                    <!-- Last Execution -->
                    <td class="text-center">
                      {{ typeof report.lastExecution === 'string' ? report.lastExecution.slice(0, -14) : (report.lastFile || 'N/A') }}
                    </td>
                    <!-- Bot Name -->
                    <td class="text-center">{{ report.botName || 'Unknown' }}</td>
                    <!-- Exchange -->
                    <td class="text-center">{{ report.exchange || 'Unknown' }}</td>
                    <!-- Pair Asset -->
                    <td class="text-center">{{ report.pairAsset || 'Unknown' }}</td>
                    <!-- Profit/Loss -->
                    <td class="text-center">
                      {{ report.episodeProfitLoss != null ? report.episodeProfitLoss.toFixed(2) : 'N/A' }} {{ report.quotedAssetValue != null ? report.quotedAssetValue : 'N/A'}}
                    </td>
                    <!-- Hit Ratio  -->
                    <td class="text-center">
                      {{ report.baseAssetHitRatio != null ? report.baseAssetHitRatio : 'N/A' }}% {{ report.baseAssetValue != null ? report.baseAssetValue : 'N/A' }}/ {{ report.quotedAssetHitRatio != null ? report.quotedAssetHitRatio : 'N/A' }}% {{ report.quotedAssetValue != null ? report.quotedAssetValue : 'N/A' }} 
                    </td>
                    <!-- ROI -->
                    <td class="text-center">
                      {{ report.episodeROI != null ? report.episodeROI.toFixed(2) : 'N/A' }}%
                    </td>
                    <!-- Annualized Return -->
                    <td class="text-center">
                      {{ report.episodeAnnualizedRateOfReturn != null ? report.episodeAnnualizedRateOfReturn.toFixed(2) : 'N/A' }}%
                    </td>
                    <!-- Actions -->
                    <td class="text-center">
                      <div class="dropdown" :class="{ 'is-active': activeDropdown === report.reportPath }">
                        <button class="btn btn-primary btn-sm dropdown-toggle" @click="toggleDropdown(report.reportPath)">
                          ···
                        </button>
                        <div class="dropdown-menu" v-if="activeDropdown === report.reportPath">
                          <button class="dropdown-item btn btn-primary btn-sm" @click.prevent="toggleDetails(report.reportPath)">Stats</button>
                          <button class="dropdown-item btn btn-primary btn-sm" @click.prevent="compareLastReport(report.reportPath)">Previous Stats</button>
                          <!-- Nueva opción para Conditions -->
                          <button class="dropdown-item btn btn-primary btn-sm" @click.prevent="toggleConditions(report.reportPath)">Strategies</button>
                        </div>
                      </div>
                    </td>
                  </tr>

                  <!-- Fila adicional para mostrar los detalles -->
                  <tr v-if="activeIndex === report.reportPath">
                    <td colspan="13">
                      <div class="details-section">
                        <h5>Last Report Details</h5>
                        <div class="row">
                          <!-- Columna 1: Información General -->
                          <div class="col-md-6 col-lg-2">
                            <p><strong>Begin:</strong> {{ formatDate(report.beginDate) }}</p>
                            <p>@ {{ report.beginRate || 'N/A' }} {{ report.quotedAssetValue != null ? report.quotedAssetValue : 'N/A'}}</p>
                            <p><strong>End :</strong> {{ formatDate(report.endDate) }}</p>
                            <p>@ {{ report.endRate || 'N/A' }} {{ report.quotedAssetValue != null ? report.quotedAssetValue : 'N/A'}}</p>
                            <p><strong>Periods:</strong> {{ report.periods || 'N/A' }}</p>
                            <p><strong>Time Frame:</strong> {{ report.timeFrames || 'N/A' }}</p>
                            <p><strong>Exit Type:</strong> {{ report.exitType || 'N/A' }}</p>
                          </div>

                          <!-- Columna 2: Balance del Activo Base -->
                          <div class="col-md-6 col-lg-2">
                            <p><strong>Initial Base Balance:</strong> {{ report.baseAssetBeginBalance != null ? report.baseAssetBeginBalance.toFixed(6) : 'N/A' }} {{ report.baseAssetValue != null ? report.baseAssetValue : 'N/A'}}</p>
                            <p><strong>End Base Balance:</strong> {{ report.baseAssetEndBalance != null ? report.baseAssetEndBalance.toFixed(6) : 'N/A' }} {{ report.baseAssetValue != null ? report.baseAssetValue : 'N/A'}}</p>
                            <p><strong>Profit/Loss:</strong> {{ report.baseAssetProfitLoss != null ? report.baseAssetProfitLoss.toFixed(2) : 'N/A' }} {{ report.baseAssetValue != null ? report.baseAssetValue : 'N/A'}}</p>
                          </div>

                          <!-- Columna 3: Balance del Activo Cotizado -->
                          <div class="col-md-6 col-lg-2">
                            <p><strong>Initial Quoted Balance:</strong> {{ report.quotedAssetBeginBalance != null ? report.quotedAssetBeginBalance.toFixed(2) : 'N/A' }} {{ report.quotedAssetValue != null ? report.quotedAssetValue : 'N/A'}}</p>
                            <p><strong>End Quoted Balance:</strong> {{ report.quotedAssetEndBalance != null ? report.quotedAssetEndBalance.toFixed(2) : 'N/A' }} {{ report.quotedAssetValue != null ? report.quotedAssetValue : 'N/A'}}</p>
                            <p><strong>Profit/Loss:</strong> {{ report.quotedAssetProfitLoss != null ? report.quotedAssetProfitLoss.toFixed(2) : 'N/A' }} {{ report.quotedAssetValue != null ? report.quotedAssetValue : 'N/A'}}</p> 
                          </div>

                          <!-- Columna 4: Estadísticas de Hits y Fails -->
                          <div class="col-md-6 col-lg-2">
                            <p><strong>Hits:</strong> {{ report.baseAssetHits || 'N/A' }} {{ report.baseAssetValue != null ? report.baseAssetValue : 'N/A'}}</p>
                            <p><strong>Fails:</strong> {{ report.baseAssetFails || 'N/A' }} {{ report.baseAssetValue != null ? report.baseAssetValue : 'N/A'}}</p>
                            <p><strong>Hit Ratio:</strong> {{ report.baseAssetHitRatio != null ? report.baseAssetHitRatio.toFixed(2) : 'N/A' }}% {{ report.baseAssetValue != null ? report.baseAssetValue : 'N/A'}}</p>
                            <p><strong>Hits:</strong> {{ report.quotedAssetHits || 'N/A' }} {{ report.quotedAssetValue != null ? report.quotedAssetValue : 'N/A'}}</p>
                            <p><strong>Fails :</strong> {{ report.quotedAssetFails || 'N/A' }} {{ report.quotedAssetValue != null ? report.quotedAssetValue : 'N/A'}}</p> 
                            <p><strong>Hit Ratio:</strong> {{ report.quotedAssetHitRatio != null ? report.quotedAssetHitRatio.toFixed(2) : 'N/A' }}% {{ report.quotedAssetValue != null ? report.quotedAssetValue : 'N/A'}}</p>
                          </div>

                          <!-- Columna 5: Contadores y Estadísticas -->
                          <div class="col-md-6 col-lg-2">
                            <p><strong>Strategies:</strong> {{ report.strategiesCount || 'N/A' }}</p>
                            <p><strong>Positions:</strong> {{ report.positionsCount || 'N/A' }}</p>
                            <p><strong>Orders:</strong> {{ report.ordersCount || 'N/A' }}</p>
                            <p><strong>Episode Profit/Loss:</strong> {{ report.episodeProfitLoss != null ? report.episodeProfitLoss.toFixed(2) : 'N/A' }} {{ report.quotedAssetValue != null ? report.quotedAssetValue : 'N/A'}}</p>
                            <p><strong>Episode ROI:</strong> {{ report.episodeROI != null ? report.episodeROI.toFixed(2) : 'N/A' }}%</p>
                            <p><strong>Episode Annualized Return:</strong> {{ report.episodeAnnualizedRateOfReturn != null ? report.episodeAnnualizedRateOfReturn.toFixed(2) : 'N/A' }}%</p>
                          </div>

                          <!-- Columna 6: Otros Datos -->
                          <div class="col-md-6 col-lg-2">
                            <!-- Puedes agregar más datos aquí o dejar la columna vacía si no hay más datos -->
                            <p><strong>Episode Days:</strong> {{ report.episodeDays.toFixed(2) || 'N/A' }}</p>
                            <p><strong>Process Date:</strong> {{ formatDate(report.processDate) }}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>

                  <!-- Fila adicional para mostrar los detalles del reporte anterior -->
                  <tr v-if="comparingIndex === report.reportPath && report.previousReport">
                    <td colspan="13">
                      <div class="details-section bg-light">
                        <h5>Previous Report Details</h5>
                        <div class="row">
                          <!-- Repite las columnas para report.previousReport -->
                          <div class="col-md-6 col-lg-2">
                            <p><strong>Begin:</strong> {{ formatDate(report.previousReport.beginDate) }}</p>
                            <p>@ {{ report.previousReport.beginRate || 'N/A' }}</p>
                            <p><strong>End:</strong> {{ formatDate(report.previousReport.endDate) }}</p>
                            <p>@ {{ report.previousReport.endRate || 'N/A' }}</p>
                            <p><strong>Periods:</strong> {{ report.previousReport.periods || 'N/A' }}</p>
                            <p><strong>Time Frame:</strong> {{ report.previousReport.timeFrames || 'N/A' }}</p>
                            <p><strong>Exit Type:</strong> {{ report.previousReport.exitType || 'N/A' }}</p>
                          </div>

                          <!-- Columna 2: Balance del Activo Base -->
                          <div class="col-md-6 col-lg-2">
                            <p><strong>Initial Base Balance ({{ report.previousReport.baseAssetValue || '' }}):</strong> {{ report.previousReport.baseAssetBeginBalance != null ? report.previousReport.baseAssetBeginBalance.toFixed(8) : 'N/A' }}</p>
                            <p><strong>End Base Balance ({{ report.previousReport.baseAssetValue || '' }}):</strong> {{ report.previousReport.baseAssetEndBalance != null ? report.previousReport.baseAssetEndBalance.toFixed(8) : 'N/A' }}</p>
                            <p><strong>Profit/Loss (Base):</strong> {{ report.previousReport.baseAssetProfitLoss != null ? report.previousReport.baseAssetProfitLoss.toFixed(8) : 'N/A' }}</p>
                          </div>

                          <!-- Columna 3: Balance del Activo Cotizado -->
                          <div class="col-md-6 col-lg-2">
                            <p><strong>Initial Quoted Balance ({{ report.previousReport.quotedAssetValue || '' }}):</strong> {{ report.previousReport.quotedAssetBeginBalance != null ? report.previousReport.quotedAssetBeginBalance.toFixed(2) : 'N/A' }}</p>
                            <p><strong>End Quoted Balance ({{ report.previousReport.quotedAssetValue || '' }}):</strong> {{ report.previousReport.quotedAssetEndBalance != null ? report.previousReport.quotedAssetEndBalance.toFixed(2) : 'N/A' }}</p>
                            <p><strong>Profit/Loss (Quoted):</strong> {{ report.previousReport.quotedAssetProfitLoss != null ? report.previousReport.quotedAssetProfitLoss.toFixed(2) : 'N/A' }}</p>
                          </div>

                          <!-- Columna 4: Estadísticas de Hits y Fails -->
                          <div class="col-md-6 col-lg-2">
                            <p><strong>Hits (Base):</strong> {{ report.previousReport.baseAssetHits || 'N/A' }}</p>
                            <p><strong>Fails (Base):</strong> {{ report.previousReport.baseAssetFails || 'N/A' }}</p>
                            <p><strong>Hit Ratio (Base):</strong> {{ report.previousReport.baseAssetHitRatio != null ? report.previousReport.baseAssetHitRatio.toFixed(2) : 'N/A' }}%</p>
                            <p><strong>Hits (Quoted):</strong> {{ report.previousReport.quotedAssetHits || 'N/A' }}</p>
                            <p><strong>Fails (Quoted):</strong> {{ report.previousReport.quotedAssetFails || 'N/A' }}</p>
                            <p><strong>Hit Ratio (Quoted):</strong> {{ report.previousReport.quotedAssetHitRatio != null ? report.previousReport.quotedAssetHitRatio.toFixed(2) : 'N/A' }}%</p>
                          </div>

                          <!-- Columna 5: Contadores y Estadísticas -->
                          <div class="col-md-6 col-lg-2">
                            <p><strong>Strategies:</strong> {{ report.previousReport.strategiesCount || 'N/A' }}</p>
                            <p><strong>Positions:</strong> {{ report.previousReport.positionsCount || 'N/A' }}</p>
                            <p><strong>Orders:</strong> {{ report.previousReport.ordersCount || 'N/A' }}</p>
                            <p><strong>Episode Profit/Loss:</strong> {{ report.previousReport.episodeProfitLoss != null ? report.previousReport.episodeProfitLoss.toFixed(2) : 'N/A' }}</p>
                            <p><strong>Episode ROI:</strong> {{ report.previousReport.episodeROI != null ? report.previousReport.episodeROI.toFixed(2) : 'N/A' }}%</p>
                            <p><strong>Episode Annualized Return:</strong> {{ report.previousReport.episodeAnnualizedRateOfReturn != null ? report.previousReport.episodeAnnualizedRateOfReturn.toFixed(2) : 'N/A' }}%</p>
                          </div>

                          <!-- Columna 6: Otros Datos -->
                          <div class="col-md-6 col-lg-2">
                            <!-- Puedes agregar más datos aquí o dejar la columna vacía si no hay más datos -->
                            <p><strong>Episode Days:</strong> {{ report.previousReport.episodeDays || 'N/A' }}</p>
                            <p><strong>Process Date:</strong> {{ typeof report.previousReport.processDate === 'string' ? report.previousReport.processDate.slice(0, -13) : 'N/A' }}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>

                    <!-- Fila adicional para mostrar las condiciones -->
                    <tr v-if="conditionsIndex === report.reportPath">
                      <td colspan="13">
                        <div class="conditions-section">
                          <h5>Conditions Used</h5>
                          <p><strong>Trading System:</strong> {{ report.simulationState?.tradingSystem?.name || 'N/A' }}</p>

                          <!-- Tabla de condiciones -->
                          <div class="table-responsive">
                            <table class="table table-bordered">
                              <thead>
                                <tr>
                                  <th style="width: 20%;">Event</th>
                                  <th>Situation</th>
                                  <th>Condition</th>
                                  <th>Code</th>
                                </tr>
                              </thead>
                              <tbody>
                                <!-- Loop sobre las estrategias de trading -->
                                <template v-for="strategy in report.simulationState?.tradingSystem?.tradingStrategies || []" :key="strategy.id">
                                  <!-- Trigger On Conditions -->
                                  <tr>
                                    <td colspan="4"><strong>Trigger On Conditions - {{ strategy.name }}</strong></td>
                                  </tr>
                                  <template v-for="situation in strategy.triggerStage?.triggerOn?.situations || []" :key="situation.id">
                                    <template v-for="condition in situation.conditions || []" :key="condition.id">
                                      <tr>
                                        <td>Trigger On</td>
                                        <td>{{ situation.name }}</td>
                                        <td>{{ condition.name }}</td>
                                        <td><pre>{{ condition.javascriptCode?.code }}</pre></td>
                                      </tr>
                                    </template>
                                  </template>

                                  <!-- Trigger Off Conditions -->
                                  <tr>
                                    <td colspan="4"><strong>Trigger Off Conditions - {{ strategy.name }}</strong></td>
                                  </tr>
                                  <template v-for="situation in strategy.triggerStage?.triggerOff?.situations || []" :key="situation.id">
                                    <template v-for="condition in situation.conditions || []" :key="condition.id">
                                      <tr>
                                        <td>Trigger Off</td>
                                        <td>{{ situation.name }}</td>
                                        <td>{{ condition.name }}</td>
                                        <td><pre>{{ condition.javascriptCode?.code }}</pre></td>
                                      </tr>
                                    </template>
                                  </template>

                                  <!-- Take Position Conditions -->
                                  <tr>
                                    <td colspan="4"><strong>Take Position Conditions - {{ strategy.name }}</strong></td>
                                  </tr>
                                  <template v-for="situation in strategy.triggerStage?.takePosition?.situations || []" :key="situation.id">
                                    <template v-for="condition in situation.conditions || []" :key="condition.id">
                                      <tr>
                                        <td>Take Position</td>
                                        <td>{{ situation.name }}</td>
                                        <td>{{ condition.name }}</td>
                                        <td><pre>{{ condition.javascriptCode?.code }}</pre></td>
                                      </tr>
                                    </template>
                                  </template>

                                  <!-- Managed Stop Loss Formulas -->
                                  <tr>
                                    <td colspan="4"><strong>Managed Stop Loss Formulas - {{ strategy.name }}</strong></td>
                                  </tr>
                                  <template v-for="phase in strategy.manageStage?.managedStopLoss?.phases || []" :key="phase.id">
                                    <tr>
                                      <td>Stop Loss Phase: {{ phase.name }}</td>
                                      <td colspan="3"><pre>{{ phase.formula?.code }}</pre></td>
                                    </tr>
                                  </template>

                                  <!-- Managed Take Profit Formulas -->
                                  <tr>
                                    <td colspan="4"><strong>Managed Take Profit Formulas - {{ strategy.name }}</strong></td>
                                  </tr>
                                  <template v-for="phase in strategy.manageStage?.managedTakeProfit?.phases || []" :key="phase.id">
                                    <tr>
                                      <td>Take Profit Phase: {{ phase.name }}</td>
                                      <td colspan="3"><pre>{{ phase.formula?.code }}</pre></td>
                                    </tr>
                                  </template>
                                </template>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
            </table>
              </div>
          </template>

          <!-- Panel 1.2: Test -->
          <template v-slot:tabPanel-5>
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
              
            </table>
          </template>

          <!-- Panel 2: Performance Chart -->
          <template v-slot:tabPanel-2>
            <div v-if="simulationData && simulationData.length > 0">
              <div class="row align-items-center mb-3">
                
                <!-- Bot Selection Dropdown -->
                <div class="col-md-4 chart-dropdown" :class="{ 'is-active': activeDropdown === 'botSelection' }">
                  <button class="btn btn-primary dropdown-toggle" @click="toggleDropdown('botSelection')">Select Bots</button>
                  <div class="chart-dropdown-menu">
                    <div class="dropdown-item" v-for="(report, index) in simulationData" :key="index">
                      <input type="checkbox" :id="'bot' + index" v-model="selectedBots" :value="report.displayName" />
                      <label :for="'bot' + index">{{ report.displayName }}</label>
                    </div>
                  </div>
                </div>

                <!-- Chart Type Dropdown (Without checkboxes) -->
                <div class="col-md-4 chart-dropdown" :class="{ 'is-active': activeDropdown === 'chartSelection' }">
                  <button class="btn btn-primary dropdown-toggle" @click="toggleDropdown('chartSelection')">Select Chart Type</button>
                  <div class="chart-dropdown-menu">
                    <div class="dropdown-item" @click="selectedChartType = 'line'">Balance Over Time</div>
                    <div class="dropdown-item" @click="selectedChartType = 'bar'">Profit & Loss</div>
                    <div class="dropdown-item" @click="selectedChartType = 'roi'">ROI</div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="col-md-4 d-flex">
                  <button class="btn btn-primary mr-2" @click="updatePerformanceChart">Load Report</button>
                </div>
              </div>

              <!-- Performance Chart -->
              <div class="chart-container mt-4">
                <canvas ref="performanceChartCanvas"></canvas>
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
                <div class="col-md-4 chart-dropdown" :class="{ 'is-active': activeDropdown === 'candleSelection' }">
                  <button class="btn btn-primary dropdown-toggle" @click="toggleDropdown('candleSelection')">Select Candle Data</button>
                  <div class="chart-dropdown-menu">
                    <div class="dropdown-item" v-for="(key, index) in candleDataPaths" :key="index">
                      <input type="radio" :id="'candle' + index" v-model="selectedCandleData" :value="key" />
                      <label :for="'candle' + index">{{ key }}</label>
                    </div>
                  </div>
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
import "bootstrap/dist/css/bootstrap.min.css";
import { Chart as ChartJS, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { defineComponent } from 'vue';

ChartJS.register(...registerables);

export default defineComponent({
  props: ["incomingData", "timestamp"],
  components: {
    Tabs,
  },
  data() {
    return {
      tabList: ["Reports", "Performance", "Signal Providers", " Candle Data", "Test"],
      dashboardIcon: dashboardIcon,
      dataKey: "Platform-SimulationResult",
      candlesDataKey: "Platform-CandlesData",
      outputData: "Platform-SimulationOutput",
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
      conditionsIndex: null,
      selectedBots: [],
      selectedChartType: [],

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

    formatDate(value) {
      if (!value) return 'N/A';
      const date = new Date(value);
      return date.toISOString(); // Puedes ajustar el formato según tus necesidades
    },

    toggleConditions(reportPath) {
      if (this.conditionsIndex === reportPath) {
        this.conditionsIndex = null;
      } else {
        this.conditionsIndex = reportPath;
      }
      this.activeDropdown = null;
    },
    
    toggleDropdown(reportPath) {
      if (this.activeDropdown === reportPath) {
        this.activeDropdown = null;
      } else {
        this.activeDropdown = reportPath;
      }
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

    getRandomColor() {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
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
        if (this.selectedBots.length === 0) {
          console.warn('No bots selected to display.');
          return;
        }

        const canvas = this.$refs.performanceChartCanvas;
        if (!canvas || !canvas.getContext) {
          console.error('Performance chart canvas is not available or not initialized.');
          return;
        }

        const ctx = canvas.getContext('2d');

        // Destruir el gráfico si ya existe
        if (this.performanceChart) {
          this.performanceChart.destroy();
        }

        // Generar datasets para los bots seleccionados
        const datasets = this.selectedBots.map(botName => {
          const report = this.simulationData.find(r => r.displayName === botName);
          if (!report) {
            console.warn(`No report found for bot: ${botName}`);
            return null;
          }
          return {
            label: botName,
            data: [
              report.initialBalanceQuoted || report.initialBalanceBase,
              report.endBalanceQuoted || report.endBalanceBase,
            ],
            borderColor: this.getRandomColor(),
            fill: false,
          };
        }).filter(dataset => dataset !== null);

        // Crear el nuevo gráfico
        this.performanceChart = new ChartJS(ctx, {
          type: this.selectedChartType === 'line' ? 'line' : 'bar',
          data: {
            labels: ['Start', 'End'],
            datasets: datasets,
          },
          options: {
            scales: {
              x: { title: { display: true, text: 'Time' } },
              y: { title: { display: true, text: 'Balance' } },
            },
            animation: {
              duration: 0,  // Evitar la animación si está interfiriendo
            }
          },
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
        if (!ctx) {
          console.error('Failed to get the canvas context.');
          return;
        }

        const selectedData = this.priceChangeData[this.selectedCandleData];
        if (!selectedData || selectedData.length === 0) {
          console.warn('No valid candle data to display.');
          return;
        }

        // Filter data by date range
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

        // Destroy previous chart
        if (this.candleChart) {
          this.candleChart.destroy();
          this.candleChart = null;
        }

        // Chart options with better date formatting
        this.candleChartOptions = {
          scales: {
            x: {
              type: 'time',
              time: {
                tooltipFormat: 'MMM dd', // Shorten date format
                unit: 'day',
                displayFormats: {
                  day: 'MMM dd', // Display short date format
                },
              },
              title: { display: true, text: 'Date' },
            },
            y: {
              title: { display: true, text: 'Price' },
              beginAtZero: false,
            },
          },
          animation: {
            duration: 0, // Avoid animation if it's interfering
          },
        };

        // Create the new chart
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
        const reportData = data[this.dataKey];
        console.log('Data received:', reportData);

        let report;
        if (Array.isArray(reportData)) {
          report = reportData[0]; // Asumiendo que recibimos un solo reporte por mensaje
        } else {
          report = reportData;
        }

        if (!report || !report.reportPath) {
          console.warn('Reporte sin reportPath:', report);
          return;
        }

        const isPrevious = report.isPreviousReport || false;
        const normalizedReportPath = report.reportPath.replace('Status.Report.json.Previous.json', 'Status.Report.json');

        // Extraer partes del path
        const pathParts = report.reportPath.split('\\');

        // Generar displayName y asignar botName, exchange y pairAsset
        report.displayName = this.generateDisplayName(report, pathParts);

        // Extraer datos necesarios del reporte
        this.extractReportData(report);

        // Generar uniqueKey para identificar el reporte
        const uniqueKey = `${report.botName}-${report.exchange}-${report.pairAsset}`;
        report.uniqueKey = uniqueKey;

        // Buscar si el reporte ya existe en simulationData
        const existingIndex = this.simulationData.findIndex(r => r.uniqueKey === uniqueKey);

        if (isPrevious) {
          // Es un reporte anterior
          if (existingIndex !== -1) {
            // Agregar el previousReport al reporte existente
            this.simulationData[existingIndex].previousReport = report;
          } else {
            // Crear una nueva entrada si el reporte actual no existe aún
            this.simulationData.push({
              ...report,
              reportPath: normalizedReportPath,
              previousReport: report,
            });
          }
        } else {
          // Es un reporte actual
          if (existingIndex !== -1) {
            // Actualizar el reporte existente
            this.simulationData.splice(existingIndex, 1, {
              ...report,
              previousReport: this.simulationData[existingIndex].previousReport,
            });
          } else {
            // Agregar un nuevo reporte
            this.simulationData.push(report);
          }
        }

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

      /* Handle Output Data
      if (this.outputData in data) {
        const outputData = data[this.outputData];
        if (outputData && outputData.filePath) {
              // Assuming we get one outputData object per exchange and asset pair
              const pathParts = outputData.filePath.split("\\");
              const displayName = `${outputData.exchange} | ${outputData.assetPair}`;

              // Store output data (or merge with an existing object)
              const existingIndex = this.simulationData.findIndex(r => r.displayName === displayName);
              if (existingIndex !== -1) {
                  this.simulationData[existingIndex] = {
                      ...this.simulationData[existingIndex],
                      outputData: {
                          balance: outputData.balance,
                          ROI: outputData.ROI,
                          hitRatio: outputData.hitRatio,
                      },
                  };
              } else {
                  // Create a new entry
                  this.simulationData.push({
                      displayName: displayName,
                      outputData: {
                          balance: outputData.balance,
                          ROI: outputData.ROI,
                          hitRatio: outputData.hitRatio,
                      },
                  });
              }

              this.$nextTick(() => {
                  if (this.$refs.performanceChartCanvas && this.simulationData.length > 0) {
                      this.updatePerformanceChart();
                  }
              });
          }
      }
      */
    },
      
    addOrUpdateReport(report) {
      // Primero, extraemos los datos para obtener botName, exchange y pairAsset
      this.extractReportData(report);

      const isPrevious = report.isPreviousReport || false;

      // Generamos un reportKey basado en propiedades únicas
      const reportKey = report.reportPath || `${report.botName}-${report.exchange}-${report.pairAsset}`;

      // Establecemos report.reportPath para que sea consistente
      report.reportPath = reportKey;

      const existingIndex = this.simulationData.findIndex(r => r.reportPath === reportKey);

      if (existingIndex !== -1) {
        if (isPrevious) {
          this.simulationData[existingIndex].previousReport = report;
        } else {
          this.simulationData.splice(existingIndex, 1, report);
        }
      } else {
        if (isPrevious) {
          report.previousReport = report;
        }
        this.simulationData.push(report);
      }
    },

    extractReportData(report) {
      const reportFieldsMapping = {
        // Campos existentes
        lastExecution: {
          path: ['lastExecution'],
          default: 'N/A'
        },
        lastFile: {
          path: ['lastFile'],
          default: 'N/A'
        },
        timeFrames: {
          path: ['timeFrames'],
          default: 'N/A'
        },
        beginRate: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'beginRate', 'value'],
          default: 'N/A'
        },
        endRate: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'endRate', 'value'],
          default: 'N/A'
        },
        beginDate: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'begin', 'value'],
          default: 'N/A'
        },
        endDate: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'end', 'value'],
          default: 'N/A'
        },
        processDate: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'processDate', 'value'],
          default: 'N/A'
        },
        exitType: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'exitType', 'value'],
          default: 'N/A'
        },
        // Nuevos campos: episodeBaseAsset
        baseAssetBeginBalance: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'episodeBaseAsset', 'beginBalance', 'value'],
          default: null
        },
        baseAssetEndBalance: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'episodeBaseAsset', 'endBalance', 'value'],
          default: null
        },
        baseAssetHits: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'episodeBaseAsset', 'hits', 'value'],
          default: null
        },
        baseAssetFails: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'episodeBaseAsset', 'fails', 'value'],
          default: null
        },
        baseAssetHitRatio: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'episodeBaseAsset', 'hitRatio', 'value'],
          default: null
        },
        baseAssetProfitLoss: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'episodeBaseAsset', 'profitLoss', 'value'],
          default: null
        },
        baseAssetROI: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'episodeBaseAsset', 'ROI', 'value'],
          default: null
        },
        baseAssetAnnualizedRateOfReturn: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'episodeBaseAsset', 'annualizedRateOfReturn', 'value'],
          default: null
        },
        baseAssetHitFail: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'episodeBaseAsset', 'hitFail', 'value'],
          default: null
        },
        baseAssetValue: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'episodeBaseAsset', 'value'],
          default: null
        },
        // Nuevos campos: episodeQuotedAsset
        quotedAssetBeginBalance: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'episodeQuotedAsset', 'beginBalance', 'value'],
          default: null
        },
        quotedAssetEndBalance: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'episodeQuotedAsset', 'endBalance', 'value'],
          default: null
        },
        quotedAssetHits: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'episodeQuotedAsset', 'hits', 'value'],
          default: null
        },
        quotedAssetFails: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'episodeQuotedAsset', 'fails', 'value'],
          default: null
        },
        quotedAssetHitRatio: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'episodeQuotedAsset', 'hitRatio', 'value'],
          default: null
        },
        quotedAssetProfitLoss: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'episodeQuotedAsset', 'profitLoss', 'value'],
          default: null
        },
        quotedAssetROI: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'episodeQuotedAsset', 'ROI', 'value'],
          default: null
        },
        quotedAssetAnnualizedRateOfReturn: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'episodeQuotedAsset', 'annualizedRateOfReturn', 'value'],
          default: null
        },
        quotedAssetHitFail: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'episodeQuotedAsset', 'hitFail', 'value'],
          default: null
        },
        quotedAssetValue: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'episodeQuotedAsset', 'value'],
          default: null
        },
        // Nuevos campos: tradingEpisodeCounters
        strategiesCount: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'tradingEpisodeCounters', 'strategies', 'value'],
          default: null
        },
        positionsCount: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'tradingEpisodeCounters', 'positions', 'value'],
          default: null
        },
        ordersCount: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'tradingEpisodeCounters', 'orders', 'value'],
          default: null
        },
        countersHits: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'tradingEpisodeCounters', 'hits', 'value'],
          default: null
        },
        countersFails: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'tradingEpisodeCounters', 'fails', 'value'],
          default: null
        },
        userDefinedCounters: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'tradingEpisodeCounters', 'userDefinedCounters'],
          default: null
        },
        // Nuevos campos: tradingEpisodeStatistics
        episodeProfitLoss: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'tradingEpisodeStatistics', 'profitLoss', 'value'],
          default: null
        },
        episodeROI: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'tradingEpisodeStatistics', 'ROI', 'value'],
          default: null
        },
        episodeHitFail: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'tradingEpisodeStatistics', 'hitFail', 'value'],
          default: null
        },
        episodeDays: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'tradingEpisodeStatistics', 'days', 'value'],
          default: null
        },
        episodeAnnualizedRateOfReturn: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'tradingEpisodeStatistics', 'annualizedRateOfReturn', 'value'],
          default: null
        },
        userDefinedStatistics: {
          path: ['simulationState', 'tradingEngine', 'tradingCurrent', 'tradingEpisode', 'tradingEpisodeStatistics', 'userDefinedStatistics'],
          default: null
        },
        // Agrega más campos según sea necesario
      };

      // Función para extraer los datos dinámicamente
      for (const [field, config] of Object.entries(reportFieldsMapping)) {
        const { path, default: defaultValue } = config;
        let value = report;

        for (const key of path) {
          if (value && typeof value === 'object' && key in value) {
            value = value[key];
          } else {
            value = defaultValue;
            break;
          }
        }

        report[field] = value !== undefined ? value : defaultValue;
      }

      // `exchange`, `pairAsset`, y `botName` ya fueron asignados en `generateDisplayName`
    },

    cacheReportData(reports) {
      localStorage.setItem('cachedReports', JSON.stringify(reports));
      localStorage.setItem('cacheTimestamp', new Date().toISOString());
    },

    generateDisplayName(item, pathParts) {
      // Imprimir pathParts para verificar los índices
      console.log('Path parts:', pathParts);

      // Ajusta los índices según la estructura de tu path
      const exchangeIndex = 9; // Ajusta este índice según tu estructura
      const pairIndex = 10;    // Ajusta este índice según tu estructura
      const sessionIndex = 12; // Ajusta este índice según tu estructura

      const exchange = pathParts[exchangeIndex] || 'Unknown Exchange';
      const pair = pathParts[pairIndex] || 'Unknown Pair';
      const session = pathParts[sessionIndex] || 'Unknown Session';

      // Asignamos las propiedades al objeto item (report)
      item.exchange = exchange;
      item.pairAsset = pair;
      item.botName = session;

      // Opcionalmente, limpiar lastExecution si es necesario
      const cleanLastExecution = item.lastExecution || "No Execution";
      item.lastExecution = cleanLastExecution;

      // Retornamos un displayName
      return `${cleanLastExecution} | ${item.botName} | ${item.pairAsset} | ${item.exchange}`;
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

.conditions-section table th:first-child,
.conditions-section table td:first-child {
  width: 20%; /* Ajusta el porcentaje según tus necesidades */
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

.chart-dropdown-menu {
  display: none;
  position: absolute;
  z-index: 1000;
  background-color: #343a40;
  min-width: 1rem;
  padding: 0;
  margin-bottom: 20px;
  font-size: 1rem;
  text-align: left;
  list-style: none;
  border: none;
  border-radius: 0;
  left: 10;
}

.chart-dropdown-menu .dropdown-item {
  width: 100%;
  padding: 0.50rem 1rem;
  text-align: left;
  background-color: #343a40;
  color: #fff;
}
.chart-dropdown.is-active .chart-dropdown-menu {
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
  max-width: 90%;
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
  .details-section .row > div {
    flex: 0 0 100%;
    max-width: 100%;
  }
}
</style>