#!/usr/bin/env python
# coding: utf-8

# ## Import needed deps

# In[15]:


import random
import gym
from gym import spaces
from sklearn import preprocessing
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import time
import ray
import os
import sys
import math
import json
from ray import tune
from ray.rllib.agents import ppo
from ray.tune import CLIReporter
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from tabulate import tabulate


# ## Run tensorboard for data visualisation

# In[16]:


# %load_ext tensorboard
# %tensorboard --logdir "/tf/notebooks/ray_results/" --host 0.0.0.0


# ### Set of parameters received from Test Server

# In[17]:


parameters = pd.read_csv(
    '/tf/notebooks/parameters.csv', 
    sep=' ', 
)


parameters


# In[18]:


EXPERIMENT_NAME = "Trading_Signal_Predictor_RL_V01"
PERCENTAGE_OF_DATASET_FOR_TRAINING = 80
TIMESTEPS_TO_TRAIN = parameters['TIMESTEPS_TO_TRAIN'][0]
OBSERVATION_WINDOW_SIZE = parameters['OBSERVATION_WINDOW_SIZE'][0]
INITIAL_QUOTE_ASSET = parameters['INITIAL_QUOTE_ASSET'][0]
INITIAL_BASE_ASSET = parameters['INITIAL_BASE_ASSET'][0]
TRADING_FEE = parameters['TRADING_FEE'][0]
ENV_VERSION = parameters['ENV_VERSION'][0]
ENV_NAME =  parameters['ENV_NAME'][0]
EXPLORE_ON_EVAL = parameters['EXPLORE_ON_EVAL'][0]

# Hyper-parameters, in case we want to really control them from the test server not from ray
ALGORITHM = parameters['ALGORITHM'][0]
ROLLOUT_FRAGMENT_LENGTH = parameters['ROLLOUT_FRAGMENT_LENGTH'][0]
TRAIN_BATCH_SIZE = parameters['TRAIN_BATCH_SIZE'][0]
SGD_MINIBATCH_SIZE = parameters['SGD_MINIBATCH_SIZE'][0]
BATCH_MODE = parameters['BATCH_MODE'][0]
#VF_CLIP_PARAM = parameters['VF_CLIP_PARAM'][0]
FC_SIZE = [parameters['FC_SIZE'][0]]
LEARNING_RATE = parameters['LEARNING_RATE'][0]
GAMMA = parameters['GAMMA'][0]


# In[19]:


df = pd.read_csv(
    '/tf/notebooks/time-series.csv', 
    header=0, 
    index_col=None,
    sep=' ', 
    skipinitialspace=True
)


# In[20]:


def prepare_data(df):
    # renaming column labels as we wish, regardless what test server sends, hopefully he will maintain position
    df.rename(columns={df.columns[0]: "date"}, inplace=True)
    df.rename(columns={df.columns[1]: "high"}, inplace=True)
    df.rename(columns={df.columns[2]: "low"}, inplace=True)
    df.rename(columns={df.columns[3]: "close"}, inplace=True)
    df.rename(columns={df.columns[4]: "open"}, inplace=True)
    df.rename(columns={df.columns[5]: "volume"}, inplace=True)
    
    df['volume'] = np.int64(df['volume'])
    df['date'] = pd.to_datetime(df['date'],  unit='ms')
    df.sort_values(by='date', ascending=True, inplace=True)
    df.reset_index(drop=True, inplace=True)
    df['date'] = df['date'].dt.strftime('%Y-%m-%d %I:%M %p')

    return df


data = prepare_data(df)
data


# # Setup which data to use for training and which data to use for evaluation of RL Model

# In[21]:


def split_data(data):

    X_train_test, X_valid =         train_test_split(data, train_size=0.67, test_size=0.33, shuffle=False)
    
    X_train, X_test =         train_test_split(X_train_test, train_size=0.50, test_size=0.50, shuffle=False)


    return X_train, X_test, X_valid


# In[22]:


X_train, X_test, X_valid =     split_data(data)


# ## Normalize the dataset subsets to make the model converge faster

# In[23]:


scaler_type = MinMaxScaler

def get_feature_scalers(X, scaler_type=scaler_type):
    scalers = []
    for name in list(X.columns[X.columns != 'date']):
        scalers.append(scaler_type().fit(X[name].values.reshape(-1, 1)))
    return scalers

def get_scaler_transforms(X, scalers):
    X_scaled = []
    for name, scaler in zip(list(X.columns[X.columns != 'date']), scalers):
        X_scaled.append(scaler.transform(X[name].values.reshape(-1, 1)))
    X_scaled = pd.concat([pd.DataFrame(column, columns=[name]) for name, column in                           zip(list(X.columns[X.columns != 'date']), X_scaled)], axis='columns')
    return X_scaled

def scale_numpy_array(np_arr, scaler_type = scaler_type):
    return scaler_type().fit_transform(np_arr, (-1,1))

def normalize_data(X_train, X_test, X_valid):
    X_train_test = pd.concat([X_train, X_test], axis='index')
    X_train_test_valid = pd.concat([X_train_test, X_valid], axis='index')

    X_train_test_dates = X_train_test[['date']]
    X_train_test_valid_dates = X_train_test_valid[['date']]

    X_train_test = X_train_test.drop(columns=['date'])
    X_train_test_valid = X_train_test_valid.drop(columns=['date'])

    train_test_scalers =         get_feature_scalers(X_train_test, 
                            scaler_type=scaler_type)
    train_test_valid_scalers =         get_feature_scalers(X_train_test_valid, 
                            scaler_type=scaler_type)

    X_train_test_scaled =         get_scaler_transforms(X_train_test, 
                              train_test_scalers)
    X_train_test_valid_scaled =         get_scaler_transforms(X_train_test_valid, 
                              train_test_scalers)
    X_train_test_valid_scaled_leaking =         get_scaler_transforms(X_train_test_valid, 
                              train_test_valid_scalers)

    X_train_test_scaled =         pd.concat([X_train_test_dates, 
                   X_train_test_scaled], 
                  axis='columns')
    X_train_test_valid_scaled =         pd.concat([X_train_test_valid_dates, 
                   X_train_test_valid_scaled], 
                  axis='columns')
    X_train_test_valid_scaled_leaking =         pd.concat([X_train_test_valid_dates, 
                   X_train_test_valid_scaled_leaking], 
                  axis='columns')

    X_train_scaled = X_train_test_scaled.iloc[:X_train.shape[0]]
    X_test_scaled = X_train_test_scaled.iloc[X_train.shape[0]:]
    X_valid_scaled = X_train_test_valid_scaled.iloc[X_train_test.shape[0]:]
    X_valid_scaled_leaking = X_train_test_valid_scaled_leaking.iloc[X_train_test.shape[0]:]

    return (train_test_scalers, 
            train_test_valid_scalers, 
            X_train_scaled, 
            X_test_scaled, 
            X_valid_scaled, 
            X_valid_scaled_leaking)

train_test_scalers, train_test_valid_scalers, X_train_scaled, X_test_scaled, X_valid_scaled, X_valid_scaled_leaking =     normalize_data(X_train, X_test, X_valid)


# In[24]:


X_train_scaled.tail()


# # Defining the environment

# In[25]:


class SimpleTradingEnv(gym.Env):
    
    metadata = {'render.modes': ['live', 'human', 'none']}
    visualization = None

    def __init__(self, config=None):
        
        self.df_scaled = config.get("df_scaled").reset_index(drop=True)
        self.df_normal = config.get("df_normal").reset_index(drop=True)
        self.window_size = OBSERVATION_WINDOW_SIZE
        self.prices, self.features = self._process_data(self.df_scaled)
        # The shape of the observation is (window_size * features + environment_features) the environment_features are: quote_asset, base_asset, net_worth. The entire observation is flattened in a 1D np array. 
        # NOT USED ANYMORE, KEPT FOR REFERENCE
        # self.obs_shape = ((OBSERVATION_WINDOW_SIZE * self.features.shape[1] + 3),) 

        # The shape of the observation is number of candles to look back, and the number of features (candle_features) + 3 (quote_asset, base_asset, net_worth)
        self.obs_shape = (OBSERVATION_WINDOW_SIZE, self.features.shape[1] + 3)

        # Action space
        #self.action_space = spaces.Box(low=np.array([0, 0]), high=np.array([3.0, 1.0]), dtype=np.float32)
        self.action_space = spaces.MultiDiscrete([3, 100])
        # Observation space
        self.observation_space = spaces.Box(low=-1, high=1, shape=self.obs_shape, dtype=np.float32)

        # Initialize the episode environment

        self._start_candle = OBSERVATION_WINDOW_SIZE # We assume that the first observation is not the first row of the dataframe, in order to avoid the case where there are no calculated indicators.
        self._end_candle = len(self.features) - 1
        self._trading_fee = config.get("trading_fee")

        self._quote_asset = None
        self._base_asset = None
        self._done = None
        self._current_candle = None
        self._net_worth = None
        self._previous_net_worth = None

        # Array that will contain observation history needed for appending it to the observation space
        # It will contain observations consisting of the net_worth, base_asset and quote_asset as list of floats
        # Other features (OHLC + Indicators) will be appended to the current observation in the _get_observation method that takes the data directly from the available dataframe
        self._obs_env_history = None

        # Render and analysis data
        self._total_reward_accumulated = None
        self.trade_history = None
        self._first_rendering = None
        

    def reset(self):
        self._done = False
        self._current_candle = self._start_candle
        self._quote_asset = INITIAL_QUOTE_ASSET
        self._base_asset = INITIAL_BASE_ASSET 
        self._net_worth = INITIAL_QUOTE_ASSET # at the begining our net worth is the initial quote asset
        self._previous_net_worth = INITIAL_QUOTE_ASSET # at the begining our previous net worth is the initial quote asset
        self._total_reward_accumulated = 0.
        self._first_rendering = True
        self.trade_history = []
        self._obs_env_history = []
        
        self._initial_obs_data()

        return self._get_observation()

    def _take_action(self, action):
        self._done = False
        current_price = random.uniform(
            self.df_normal.loc[self._current_candle, "low"], self.df_normal.loc[self._current_candle, "high"])


        action_type = action[0]
        amount = action[1] / 100
        
        if action_type == 0: # Buy
            # Buy % assets
            # Determine the maximum amount of quote asset that can be bought
            available_amount_to_buy_with = self._quote_asset / current_price
            # Buy only the amount that agent chose
            assets_bought = available_amount_to_buy_with * amount
            # Update the quote asset balance
            self._quote_asset -= assets_bought * current_price
            # Update the base asset
            self._base_asset += assets_bought
            # substract trading fee from base asset based on the amount bought
            self._base_asset -= self._trading_fee * assets_bought

            # Add to trade history the amount bought if greater than 0
            if assets_bought > 0:
                self.trade_history.append({'step': self._current_candle, 'type': 'Buy', 'amount': assets_bought, 'price': current_price, 'total' : assets_bought * current_price, 'percent_amount': action[1]})
        

        elif action_type == 1: # Sell
            # Sell % assets
            # Determine the amount of base asset that can be sold
            amount_to_sell = self._base_asset * amount
            received_quote_asset = amount_to_sell * current_price
            # Update the quote asset
            self._quote_asset += received_quote_asset
            # Update the base asset
            self._base_asset -= amount_to_sell
            
            # substract trading fee from quote asset based on the amount sold
            self._quote_asset -= self._trading_fee * received_quote_asset

            # Add to trade history the amount sold if greater than 0
            if amount_to_sell > 0:
                self.trade_history.append({'step': self._current_candle, 'type': 'Sell', 'amount': amount_to_sell, 'price': current_price, 'total' : received_quote_asset, 'percent_amount': action[1]})

        else:
            # Hold
            self.trade_history.append({'step': self._current_candle, 'type': 'Hold', 'amount': '0', 'price': current_price, 'total' : 0, 'percent_amount': action[1]})


        # Update the current net worth
        self._net_worth = self._base_asset * current_price + self._quote_asset


    def step(self, action):
        """
        Returns the next observation, reward, done and info.
        """
        
        self._take_action(action)

        # Calculate reward comparing the current net worth with the previous net worth
        reward = self._net_worth - self._previous_net_worth

        self._total_reward_accumulated += reward

        # Update the previous net worth to be the current net worth after the reward has been applied
        self._previous_net_worth = self._net_worth

        obs = self._get_observation()
        # Update the info and add it to history data
        info = dict (
            total_reward_accumulated = self._total_reward_accumulated,
            net_worth = self._net_worth,
            last_action_type = self.trade_history[-1]['type'] if len(self.trade_history) > 0 else None,
            last_action_amount = self.trade_history[-1]['amount'] if len(self.trade_history) > 0 else None,
            current_step = self._current_candle
        )

        self._current_candle += 1

        # Update observation history
        self._obs_env_history.append([self._net_worth, self._base_asset, self._quote_asset])

        self._done = self._net_worth <= 0 or self._current_candle >= (len(
            self.df_normal.loc[:, 'open'].values) - 30)# We assume that the last observation is not the last row of the dataframe, in order to avoid the case where there are no calculated indicators.

        if self._done:
            print('I have finished the episode')
        
        return obs, reward, self._done, info


    def _get_observation(self):
        """
        Returns the current observation.
        """
        data_frame = self.features[(self._current_candle - self.window_size):self._current_candle]

        obs_env_history = np.array(self._obs_env_history).astype(np.float32)

        #TODO We definetely need to scale the observation history in a better way, this might influence training results
        # Doing it ad-hoc might change the scale of the min and max, thus changing the results
        obs_env_history = preprocessing.minmax_scale(obs_env_history, (-0.9,0.9)) 

        obs = np.hstack((data_frame, obs_env_history[(self._current_candle - self.window_size):self._current_candle]))

        return obs


    def render(self, mode='human', **kwargs):
        """
        Renders a plot with trades made by the agent.
        """
        
        if mode == 'human':
            print(f'Accumulated Reward: {self._total_reward_accumulated} ---- Current Net Worth: {self._net_worth}')
            print(f'Current Quote asset: {self._quote_asset} ---- Current Base asset: {self._base_asset}')
            print(f'Number of trades: {len(self.trade_history)}')
        
            if(len(self.trade_history) > 0):
                print(f'Last Action: {self.trade_history[-1]["type"]} {self.trade_history[-1]["amount"]} assets ({self.trade_history[-1]["percent_amount"]} %) at price {self.trade_history[-1]["price"]}, total: {self.trade_history[-1]["total"]}')
            print(f'--------------------------------------------------------------------------------------')
        elif mode == 'live':
            pass
            # if self.visualization == None:
            #     self.visualization = LiveTradingGraph(self.df_normal, kwargs.get('title', None))

            # if self._current_candle > OBSERVATION_WINDOW_SIZE:
            #     self.visualization.render(self._current_candle, self._net_worth, self.trade_history, window_size=OBSERVATION_WINDOW_SIZE)

    def close(self):
        if self.visualization != None:
            self.visualization.close()
            self.visualization = None
         

    def _process_data(self, df_scaled):
        """
        Processes the dataframe into features.
        """
        
        prices = self.df_scaled.loc[:, 'close'].to_numpy(dtype=np.float32)

        data_frame = df_scaled.iloc[:, 1:] # drop first column which is date TODO: Should be probably fixed outside of this class
        # Convert df to numpy array
        return prices, data_frame.to_numpy(dtype=np.float32)

    def _initial_obs_data(self):
        for i in range(self.window_size - len(self._obs_env_history)):
            self._obs_env_history.append([self._net_worth, self._base_asset, self._quote_asset])


# In[26]:


import random
import gym
from gym import spaces
from sklearn import preprocessing
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# infinite number in python
MAX_NET_WORTH = 2147483647
MAX_NUM_QUOTE_OR_BASE_ASSET = 2147483647

INITIAL_QUOTE_ASSET = 0
INITIAL_BASE_ASSET = 1
OBSERVATION_WINDOW_SIZE = 24 # Probably we should put it as param ?

class BTCAccumulationEnv(gym.Env):
    
    metadata = {'render.modes': ['live', 'human', 'none']}
    visualization = None

    def __init__(self, config=None):
        
        self.df_scaled = config.get("df_scaled").reset_index(drop=True)
        self.df_normal = config.get("df_normal").reset_index(drop=True)
        self.window_size = OBSERVATION_WINDOW_SIZE
        self.prices, self.features = self._process_data(self.df_scaled)
        # The shape of the observation is (window_size * features + environment_features) the environment_features are: quote_asset, base_asset, net_worth. The entire observation is flattened in a 1D np array. 
        # NOT USED ANYMORE, KEPT FOR REFERENCE
        # self.obs_shape = ((OBSERVATION_WINDOW_SIZE * self.features.shape[1] + 3),) 

        # The shape of the observation is number of candles to look back, and the number of features (candle_features) + 3 (quote_asset, base_asset, net_worth)
        self.obs_shape = (OBSERVATION_WINDOW_SIZE, self.features.shape[1] + 3)

        # Action space
        #self.action_space = spaces.Box(low=np.array([0, 0]), high=np.array([3.0, 1.0]), dtype=np.float32)
        self.action_space = spaces.MultiDiscrete([3, 100])
        # Observation space
        self.observation_space = spaces.Box(low=-1, high=1, shape=self.obs_shape, dtype=np.float32)

        # Initialize the episode environment

        self._start_candle = OBSERVATION_WINDOW_SIZE # We assume that the first observation is not the first row of the dataframe, in order to avoid the case where there are no calculated indicators.
        self._end_candle = len(self.features) - 1
        self._trading_fee = config.get("trading_fee")

        self._quote_asset = None
        self._base_asset = None
        self._done = None
        self._current_candle = None
        self._net_worth = None
        self._previous_net_worth = None
        self._previous_base_asset = None
        self._previous_quote_asset = None

        # Array that will contain observation history needed for appending it to the observation space
        # It will contain observations consisting of the net_worth, base_asset and quote_asset as list of floats
        # Other features (OHLC + Indicators) will be appended to the current observation in the _get_observation method that takes the data directly from the available dataframe
        self._obs_env_history = None

        # Render and analysis data
        self._total_reward_accumulated = None
        self.trade_history = None
        self._first_rendering = None
        

    def reset(self):
        self._done = False
        self._current_candle = self._start_candle
        self._quote_asset = INITIAL_QUOTE_ASSET
        self._base_asset = INITIAL_BASE_ASSET 
        self._net_worth = INITIAL_QUOTE_ASSET # at the begining our net worth is the initial quote asset
        self._previous_net_worth = INITIAL_QUOTE_ASSET # at the begining our previous net worth is the initial quote asset
        self._previous_base_asset = INITIAL_BASE_ASSET
        self._previous_quote_asset = INITIAL_QUOTE_ASSET
        self._total_reward_accumulated = 0
        self._first_rendering = True
        self.trade_history = []
        self._obs_env_history = []
        
        self._initial_obs_data()

        return self._get_observation()

    def _take_action(self, action):
        self._done = False
        current_price = random.uniform(
            self.df_normal.loc[self._current_candle, "low"], self.df_normal.loc[self._current_candle, "high"])


        action_type = action[0]
        amount = action[1] / 100
        
        if action_type == 0: # Buy
            # Buy % assets
            # Determine the maximum amount of quote asset that can be bought
            available_amount_to_buy_with = self._quote_asset / current_price
            # Buy only the amount that agent chose
            assets_bought = available_amount_to_buy_with * amount
            # Update the quote asset balance
            self._quote_asset -= assets_bought * current_price
            # Update the base asset
            self._base_asset += assets_bought
            # substract trading fee from base asset based on the amount bought
            self._base_asset -= self._trading_fee * assets_bought

            # Add to trade history the amount bought if greater than 0
            if assets_bought > 0:
                self.trade_history.append({'step': self._current_candle, 'type': 'Buy', 'amount': assets_bought, 'price': current_price, 'total' : assets_bought * current_price, 'percent_amount': action[1]})
        

        elif action_type == 1: # Sell
            # Sell % assets
            # Determine the amount of base asset that can be sold
            amount_to_sell = self._base_asset * amount
            received_quote_asset = amount_to_sell * current_price
            # Update the quote asset
            self._quote_asset += received_quote_asset
            # Update the base asset
            self._base_asset -= amount_to_sell
            
            # substract trading fee from quote asset based on the amount sold
            self._quote_asset -= self._trading_fee * received_quote_asset

            # Add to trade history the amount sold if greater than 0
            if amount_to_sell > 0:
                self.trade_history.append({'step': self._current_candle, 'type': 'Sell', 'amount': amount_to_sell, 'price': current_price, 'total' : received_quote_asset, 'percent_amount': action[1]})

        else:
            # Hold
            self.trade_history.append({'step': self._current_candle, 'type': 'Hold', 'amount': '0', 'price': current_price, 'total' : 0, 'percent_amount': action[1]})


        # Update the current net worth
        self._net_worth = self._base_asset * current_price + self._quote_asset


    def step(self, action):
        """
        Returns the next observation, reward, done and info.
        """
        
        self._take_action(action)

        # Calculate reward comparing the current base asset with the previous base asset
        reward = self._base_asset - self._previous_base_asset

        self._total_reward_accumulated += reward

        # Update the previous net worth to be the current net worth after the reward has been applied
        self._previous_net_worth = self._net_worth
        self._previous_base_asset = self._base_asset
        self._previous_quote_asset = self._quote_asset

        obs = self._get_observation()
        # Update the info and add it to history data
        info = dict (
            total_reward_accumulated = self._total_reward_accumulated,
            net_worth = self._net_worth,
            last_action_type = self.trade_history[-1]['type'] if len(self.trade_history) > 0 else None,
            last_action_amount = self.trade_history[-1]['amount'] if len(self.trade_history) > 0 else None,
            quote_asset = self._quote_asset,
            base_asset = self._base_asset,
            current_step = self._current_candle
        )

        self._current_candle += 1

        # Update observation history
        self._obs_env_history.append([self._net_worth, self._base_asset, self._quote_asset])

        self._done = self._net_worth <= 0 or self._current_candle >= (len(
            self.df_normal.loc[:, 'open'].values) - 30)# We assume that the last observation is not the last row of the dataframe, in order to avoid the case where there are no calculated indicators.

        if self._done:
            print('The episode has finished')
        
        return obs, reward, self._done, info


    def _get_observation(self):
        """
        Returns the current observation.
        """
        data_frame = self.features[(self._current_candle - self.window_size):self._current_candle]

        obs_env_history = np.array(self._obs_env_history).astype(np.float32)

        #TODO We definetely need to scale the observation history in a better way, this might influence training results
        # Doing it ad-hoc might change the scale of the min and max, thus changing the results
        obs_env_history = preprocessing.minmax_scale(obs_env_history, (-0.9,0.9)) 

        obs = np.hstack((data_frame, obs_env_history[(self._current_candle - self.window_size):self._current_candle]))

        return obs


    def render(self, mode='human', **kwargs):
        """
        Renders a plot with trades made by the agent.
        """
        
        if mode == 'human':
            print(f'Accumulated Reward: {self._total_reward_accumulated} ---- Current Net Worth: {self._net_worth}')
            print(f'Current Quote asset: {self._quote_asset} ---- Current Base asset: {self._base_asset}')
            print(f'Number of trades: {len(self.trade_history)}')
        
            if(len(self.trade_history) > 0):
                print(f'Last Action: {self.trade_history[-1]["type"]} {self.trade_history[-1]["amount"]} assets ({self.trade_history[-1]["percent_amount"]} %) at price {self.trade_history[-1]["price"]}, total: {self.trade_history[-1]["total"]}')
            print(f'--------------------------------------------------------------------------------------')
        elif mode == 'live':
            pass
            # if self.visualization == None:
            #     self.visualization = LiveTradingGraph(self.df_normal, kwargs.get('title', None))

            # if self._current_candle > OBSERVATION_WINDOW_SIZE:
            #     self.visualization.render(self._current_candle, self._net_worth, self.trade_history, window_size=OBSERVATION_WINDOW_SIZE)

    def close(self):
        if self.visualization != None:
            self.visualization.close()
            self.visualization = None
         

    def _process_data(self, df_scaled):
        """
        Processes the dataframe into features.
        """
        
        prices = self.df_scaled.loc[:, 'close'].to_numpy(dtype=np.float32)

        data_frame = df_scaled.iloc[:, 1:] # drop first column which is date TODO: Should be probably fixed outside of this class
        # Convert df to numpy array
        return prices, data_frame.to_numpy(dtype=np.float32)

    def _initial_obs_data(self):
        for i in range(self.window_size - len(self._obs_env_history)):
            self._obs_env_history.append([self._net_worth, self._base_asset, self._quote_asset])


# ### Allocate optimal resources method

# In[27]:


def find_optimal_resource_allocation(available_cpu, available_gpu):
    """
    Finds the optimal resource allocation for the agent based on the available resources in the cluster
    """
    # If we have GPU available, we allocate it all for the training, while creating as much workers as CPU cores we have minus one for the driver which holds the trainer
    if available_gpu > 0:
        return {
            'num_workers': available_cpu - 1,
            'num_cpus_per_worker': 1,
            'num_envs_per_worker': 1,
            'num_gpus_per_worker': 0,
            'num_cpus_for_driver': 1,
            'num_gpus' : available_gpu
        }
    # If we don't have GPU available, we allocate enough CPU cores for stepping the env (workers) while having enough for training maintaing a ratio of around 3 workers with 1 CPU to 1 driver CPU
    else:
        # according to the benchmark, we should allocate more workers, each with 1 cpu, letting the rest for the driver
        num_workers = int(math.floor((available_cpu  * 75) / 100))
        num_cpu_for_driver = available_cpu - num_workers
        return {
            'num_workers': num_workers,
            'num_cpus_per_worker': 1, # this should be enough for stepping an env at once
            'num_envs_per_worker': 1, # it doesn't seem to add any benefits to have more than one env per worker
            'num_gpus_per_worker': 0, # the inference is done pretty fast, so there is no need to use GPU, at least not when we run one trial at once
            'num_cpus_for_driver': num_cpu_for_driver,
            'num_gpus' : 0
        }


# ### Init ray and trainer config

# In[28]:


import os
import time
import ray
import os
from ray import tune
from ray.rllib.env.vector_env import VectorEnv
from ray.tune.registry import register_env



# Initialize Ray
ray.shutdown() # let's shutdown first any running instances of ray (don't confuse it with the cluster)
os.environ['RAY_record_ref_creation_sites'] = '1' # Needed for debugging when things go wrong
ray.init() 

try:
    available_gpu_in_cluster = ray.available_resources()['GPU']
except KeyError as e:
    available_gpu_in_cluster = 0

available_cpu_in_cluster = ray.available_resources()['CPU'] if ray.available_resources()['CPU']  else 0

# In the first version we assume that we have only one node cluster, so the allocation logic is based on that
# So the resources are maximized for one ray tune trial at a time
parallel_config = find_optimal_resource_allocation(available_cpu_in_cluster, 0) # Currently we are going to disable GPU ussage due to it's poor performance on a single instance cluster

trading_fee = 0.0075
training_config = {
            "trading_fee": trading_fee,
            "df_normal": X_train,
            "df_scaled": X_train_scaled,
}

eval_config = {
            "trading_fee": trading_fee,
            "df_normal": X_test,
            "df_scaled": X_test_scaled,
}

if ENV_NAME == 'SimpleTrading':
    training_env = SimpleTradingEnv(training_config)
    eval_env = SimpleTradingEnv(eval_config)

    training_env_key = "SimpleTradingEnv-training-V01"
    eval_env_key = "SimpleTradingEnv-evaluating-V01"
    
elif ENV_NAME == 'BTCAccumulationEnv':
    training_env = BTCAccumulationEnv(training_config)
    eval_env = BTCAccumulationEnv(eval_config)
    
    training_env_key = "BTCAccumulationEnv-training-V01"
    eval_env_key = "BTCAccumulationEnv-evaluating-V01"





tune.register_env(training_env_key, lambda _: training_env)
tune.register_env(eval_env_key, lambda _: eval_env)


# Create the ppo trainer configuration
ppo_trainer_config = {
        "env": training_env_key, # Ray will automatically create multiple environments and vectorize them if needed
        "horizon": len(X_train_scaled) - 30,
        "log_level": "INFO",
        "framework": "tf",
        #"eager_tracing": True,
        "ignore_worker_failures": True, 
        "num_workers": parallel_config.get("num_workers"), # Number of workers is per trial run, so the more we put the less parallelism we have
        "num_envs_per_worker": parallel_config.get("num_envs_per_worker"), # This influences also the length of the episode. the environment length will be split by the number of environments per worker
        "num_gpus": parallel_config.get("num_gpus"), # Number of GPUs to use in training (0 means CPU only). After a few experiments, it seems that using GPU is not helping
        "num_cpus_per_worker": parallel_config.get("num_cpus_per_worker"), # After some testing, seems the fastest way for this kind of enviroment. It's better to run more trials in parallel than to finish a trial with a couple of minutes faster. Because we can end trial earlier if we see that our model eventuall converge
        "num_cpus_for_driver": parallel_config.get("num_cpus_for_driver"), # Number of CPUs to use for the driver. This is the number of CPUs used for the training process.
        "num_gpus_per_worker": parallel_config.get("num_gpus_per_worker"), 
        "rollout_fragment_length": 200, # Size of batches collected from each worker. If num_envs_per_worker is > 1 the rollout value will be multiplied by num_envs_per_worker
        "train_batch_size": 2048, # Number of timesteps collected for each SGD round. This defines the size of each SGD epoch. the batch size is composed of fragments defined above
        "sgd_minibatch_size": 64,
        "batch_mode": "complete_episodes",
        "vf_clip_param": 100, # Default is 10, but we increase it to 100 to adapt it to our rewards scale. It helps our value function to converge faster
        "lr": 0.00001,  # Hyperparameter grid search defined above
        "gamma": 0.95,  # This can have a big impact on the result and needs to be properly tuned
        #"observation_filter": "MeanStdFilter",
        "model": {
        #    "fcnet_hiddens": FC_SIZE,  # Hyperparameter grid search defined above
            # "use_lstm": True,
            # "lstm_cell_size": 256,
            # "lstm_use_prev_action_reward": True,
            # "lstm_use_prev_action": True,
            
        },
        #"sgd_minibatch_size": MINIBATCH_SIZE,  # Hyperparameter grid search defined above
        "evaluation_interval": 5,  # Run one evaluation step on every x `Trainer.train()` call.
        "evaluation_duration": 1,  # How many episodes to run evaluations for each time we evaluate.
        "evaluation_config": {
            "explore": True,  # We usually don't want to explore during evaluation. All actions have to be repeatable. Similar to deterministic = True, but on-policy algorithms can get better results with exploration.
            "env": eval_env_key, # We need to define a new environment for evaluation with different parameters
        },
        "logger_config": {
            "logdir": "/tmp/ray_logging/",
            "type": "ray.tune.logger.UnifiedLogger",
        }
    }


# ### Custom reporter to get progress in Superalgos

# In[36]:


from ray.tune import ProgressReporter
from typing import Dict, List, Optional, Union
import json

class CustomReporter(ProgressReporter):

    def __init__(
        self,
        max_report_frequency: int = 10, # in seconds
        location: str = "/tf/notebooks/",
    ):
        self._max_report_freqency = max_report_frequency
        self._last_report_time = 0
        self._location = location

    def should_report(self, trials, done=False):
        if time.time() - self._last_report_time > self._max_report_freqency:
            self._last_report_time = time.time()
            return True
        return done

    def report(self, trials, *sys_info):

        trial_status_dict = {}
        for trial in trials:
            trial_status_dict['status'] = trial.status
            trial_status_dict['name'] = trial.trial_id
            trial_status_dict['episodeRewardMax'] = int(trial.last_result['episode_reward_max']) if trial.last_result.get("episode_reward_max") else 0
            trial_status_dict['episodeRewardMean'] = int(trial.last_result['episode_reward_mean']) if trial.last_result.get("episode_reward_mean") else 0
            trial_status_dict['episodeRewardMin'] = int(trial.last_result['episode_reward_min']) if trial.last_result.get("episode_reward_min") else 0
            trial_status_dict['timestepsExecuted'] = int(trial.last_result['timesteps_total']) if trial.last_result.get("timesteps_total") else 0
            trial_status_dict['timestepsTotal'] = int(TIMESTEPS_TO_TRAIN)

        
        sys.stdout.write(json.dumps(trial_status_dict))
        sys.stdout.write('\n')

        # Write the results to JSON file
        with open(self._location + "training_results.json", "w+") as f:
            json.dump(trial_status_dict, f)
            f.close()
    
    def set_start_time(self, timestamp: Optional[float] = None):
        if timestamp is not None:
            self._start_time = time.time()
        else:
            self._start_time = timestamp

custom_reporter = CustomReporter(max_report_frequency=10)


# In[ ]:


# Before starting printing a custom text to let Superalgos know that we are in a RL scenario
sys.stdout.write('RL_SCENARIO')
sys.stdout.write('\n')


# ### Run ray tune 

# In[32]:


analysis = tune.run(
    run_or_experiment=ALGORITHM,
    name=EXPERIMENT_NAME,
    metric='episode_reward_mean',
    mode='max',
    stop={
        # An iteration is equal with one SGD round which in our case is equal to train_batch_size. If after X iterations we still don't have a good result, we stop the trial
        "timesteps_total": TIMESTEPS_TO_TRAIN      
    },
    config=ppo_trainer_config,
    num_samples=1,  # Have one sample for each hyperparameter combination. You can have more to average out randomness.
    keep_checkpoints_num=30,  # Keep the last X checkpoints
    checkpoint_freq=5,  # Checkpoint every X iterations (save the model)
    local_dir="/tf/notebooks/ray_results/",  # Local directory to store checkpoints and results, we are using tmp folder until we move the notebook to a docker instance and we can use the same directory across all instances, no matter the underlying OS
    progress_reporter=custom_reporter,
    fail_fast="raise",
    resume=False # Resume training from the last checkpoint if any exists
)


# ### Evaluate trained model restoring it from checkpoint
# 
# #### Store the results in a file to be picked up by Superalgos

# In[33]:


best_trial = analysis.get_best_trial(metric="episode_reward_mean", mode="max", scope="all") 
best_checkpoint = analysis.get_best_checkpoint(best_trial, metric="episode_reward_mean")


agent = ppo.PPOTrainer(config=ppo_trainer_config)
agent.restore(best_checkpoint)

json_dict = {}
net_worths = []
q_assets = []
b_assets = []
net_worths_at_end = []
q_assets_at_end = []
b_assets_at_end = []
episodes_to_run = 1

for i in range(episodes_to_run):
    episode_reward = 0
    done = False
    obs = eval_env.reset() # we are using the evaluation environment for evaluation
    last_info = None
    while not done:
        action = agent.compute_single_action(obs, explore=True) # stochastic evaluation
        obs, reward, done, info = eval_env.step(action)
        net_worths.append(info['net_worth']) # Add all historical net worths to a list to print statistics at the end of the episode
        q_assets.append(info['quote_asset']) # Add all historical quote assets to a list to print statistics at the end of the episode
        b_assets.append(info['base_asset']) # Add all historical base assets to a list to print statistics at the end of the episode
        episode_reward += reward
        last_info = info

    net_worths_at_end.append(last_info['net_worth']) # Add all historical net worths to a list to print statistics at the end of the episode
    q_assets_at_end.append(last_info['quote_asset']) # Add all historical quote assets to a list to print statistics at the end of the episode
    b_assets_at_end.append(last_info['base_asset']) # Add all historical base assets to a list to print statistics at the end of the episode

json_dict['meanNetWorth'] = np.mean(net_worths)
json_dict['stdNetWorth'] = np.std(net_worths)
json_dict['minNetWorth'] = np.min(net_worths)
json_dict['maxNetWorth'] = np.max(net_worths)
json_dict['stdQuoteAsset'] = np.std(q_assets)
json_dict['minQuoteAsset'] = np.min(q_assets)
json_dict['maxQuoteAsset'] = np.max(q_assets)
json_dict['stdBaseAsset'] = np.std(b_assets)
json_dict['minBaseAsset'] = np.min(b_assets)
json_dict['maxBaseAsset'] = np.max(b_assets)
json_dict['meanNetWorthAtEnd'] = np.mean(net_worths_at_end)
json_dict['stdNetWorthAtEnd'] = np.std(net_worths_at_end)
json_dict['minNetWorthAtEnd'] = np.min(net_worths_at_end)
json_dict['maxNetWorthAtEnd'] = np.max(net_worths_at_end)


# Write the results to JSON file
with open("evaluation_results.json", "w+") as f:
    json.dump(json_dict, f)


# In[35]:


# Cleanup
os.remove('/tf/notebooks/training_results.json')
os.remove('/tf/notebooks/evaluation_results.json')
ray.shutdown()

