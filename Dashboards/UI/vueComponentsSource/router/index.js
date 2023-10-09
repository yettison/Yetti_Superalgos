import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import DevelopersView from '../views/DevelopersView.vue'
import BitcoinFactoryView from '../views/BitcoinFactoryView.vue'
import GovernanceView from '../views/GovernanceView.vue'
import AlgoTradingView from '../views/AlgoTradingView.vue'
import EventServerView from '../views/EventServerView.vue'
import TaskManagerView from '../views/TaskManagerView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/Developers',
    name: 'Developers',
    component: DevelopersView
  },
  {
    path: '/BitcoinFactory',
    name: 'BitcoinFactory',
    component: BitcoinFactoryView
  },
  {
    path: '/Governance',
    name: 'Governance',
    component: GovernanceView
  },
  {
    path: '/AlgoTrading',
    name: 'AlgoTrading',
    component: AlgoTradingView
  },
  {
    path: '/EventServer',
    name: 'EventServer',
    component: EventServerView
  },
  {
    path: '/TaskManager',
    name: 'TaskManager',
    component: TaskManagerView
  }    
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
