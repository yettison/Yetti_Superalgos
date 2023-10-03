<template>
  <div class="dashboard-window">
    <img class="image" :src="dashboardIcon">
    <h2><strong>Welcome to the Superalgos Dashboard App!</strong></h2>
    <br/>
    <span>The purpose of this app is to help make visualizing and accessing data from Superalgos a breeze.</span>
    <div class="row col-2">
      <button class="btn" @click="createDashboard" :disabled="loadingDashboard">
          <span v-if="!loadingDashboard">Create New Dashboard</span>
          <span v-else>Loading...</span>
      </button>
      <button class="btn" @click="createDashboard" :disabled="loadingDashboard">
          <span v-if="!loadingDashboard">Button Not Defined</span>
          <span v-else>Loading...</span>
      </button>
      <button class="btn" @click="createDashboard" :disabled="loadingDashboard">
          <span v-if="!loadingDashboard">Button Not Defined</span>
          <span v-else>Loading...</span>
      </button>
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
        loadingDashboard: false
      }
    },
    computed: {

    },
    methods: {
      createDashboard () {
        named = window.prompt("Name your New Dashboard");
      }
    },  
  };
</script>

<style scoped>
  .dashboard-window {
    background-color: #242424;
    color: #d1d1d1;
    min-height: 100vh;
    padding: 20px;
  }
  
  .header {
    text-align: center;
  }
  
  .image {
    margin-top: 10px;
    width: 100px;
    height: auto;
  }
  
  .action-buttons {
    margin-top: 20px;
  }
  
  .btn {
    background-color: #c72929;
    color: #d1d1d1;
    padding: 12px 24px;
    margin: 5px;
    border: 2px solid #c72929;
    transition: all 0.3s ease;
  }
  
  .btn:hover {
    background-color: #c72929;
    border: 2px solid #d3d2d2;
  }
  
  .btn:disabled {
    background-color: #343434;
    color: #a0a0a0;
  }
  </style>

