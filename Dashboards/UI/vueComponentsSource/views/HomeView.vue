<template>
  <div class="dashboard-window">
    <img class="image" :src="dashboardIcon">
    <h2><strong>Welcome to the Superalgos Dashboard App!</strong></h2>
    <br/>
    <span>The purpose of this app is to help make visualizing and accessing data from Superalgos a breeze.</span>
    <div class="row col-12">
      <h2><strong> Dashboard App status:</strong></h2>
      <h4>Dashboards:</h4>
      <h5>- Developers Dashboard, used to check raw data comming from SA via websocket </h5>
      <h5>- Bitcoin Factory Dashboard, used for ML testing purposes</h5>
      <h5>- Governance Dashboard, [Not working for now...] used to your profile, staking programs, etc. (Issue is that Governance data runs on Superalgos GUI, and therefore is not reachable from the Dashboards App)</h5>
      <h5>- Algorithmic Trading Dashboard, used to monitor your trading bots</h5>
      <p></p>
      <h4>Comming Next:</h4>
      <h5>- More Charts and Stats...</h5>
      <h5>- Fix Dashboard App initialization when SA is already running</h5>
      <h5>- Button on SA GUI to open Dashboards App</h5>
      <h5>- Bot Comparsion</h5>
    </div>
  </div>
  
</template>

<script>
  import dashboardIcon from "../assets/dashboard.png"
  export default {
    // Receive incoming data from parent app 
    props: ["incomingData"],
 
    data () {
      return {
        dataKey: '',
        dataObjects: [],
        dashboardIcon: dashboardIcon,
      }
    },
    computed: {
    },
    methods: {
    },  
  };
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
</style>

