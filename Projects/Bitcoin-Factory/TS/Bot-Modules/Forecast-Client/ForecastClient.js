﻿exports.newBitcoinFactoryBotModulesForecastClient = function (processIndex) {

    const MODULE_NAME = "Forecast-Client"
    const FORECAST_CLIENT_VERSION = 1

    let thisObject = {
        forecastCasesArray: undefined,
        utilities: undefined,
        initialize: initialize,
        finalize: finalize,
        start: start
    }

    thisObject.utilities = TS.projects.bitcoinFactory.utilities.miscellaneous
    let BOT_CONFIG = TS.projects.foundations.globals.taskConstants.TASK_NODE.bot.config
    let reforecasting = false

    let intervalId = setInterval(updateForcasts, 60 * 1000)

    return thisObject

    function initialize(pStatusDependenciesModule, callBackFunction) {
        try {
            /*
            Create Missing Folders, if needed.
            */
            console.log((new Date()).toISOString(), 'Running Forecast Client v.' + FORECAST_CLIENT_VERSION)
            let dir
            dir = global.env.PATH_TO_BITCOIN_FACTORY + '/Forecast-Client/StateData/ForecastCases'
            if (!SA.nodeModules.fs.existsSync(dir)) {
                SA.nodeModules.fs.mkdirSync(dir, { recursive: true });
            }

            thisObject.utilities.initialize()

            loadForecastCasesFile()

            function loadForecastCasesFile() {
                let fileContent = thisObject.utilities.loadFile(global.env.PATH_TO_BITCOIN_FACTORY + "/Forecast-Client/StateData/ForecastCases/Forecast-Cases-Array-" + BOT_CONFIG.networkCodeName + ".json")
                if (fileContent !== undefined) {
                    thisObject.forecastCasesArray = JSON.parse(fileContent)
                } else {
                    thisObject.forecastCasesArray = []
                }
            }

            callBackFunction(TS.projects.foundations.globals.standardResponses.DEFAULT_OK_RESPONSE)
        } catch (err) {
            TS.projects.foundations.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).UNEXPECTED_ERROR = err
            TS.projects.foundations.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE_OBJECT.write(MODULE_NAME,
                "[ERROR] initialize -> err = " + err.stack)
            callBackFunction(TS.projects.foundations.globals.standardResponses.DEFAULT_FAIL_RESPONSE)
        }
    }


    function finalize() {
        clearInterval(intervalId)
    }

    async function start(callBackFunction) {
        try {
            await getNextForecastCase()
                .then(onSuccess)
                .catch(onError)
            async function onSuccess(nextForecastCase) {
                if (nextForecastCase !== undefined) {
                    SA.nodeModules.fs.writeFileSync(global.env.PATH_TO_BITCOIN_FACTORY + "/Forecast-Client/notebooks/parameters.csv", nextForecastCase.files.parameters)
                    SA.nodeModules.fs.writeFileSync(global.env.PATH_TO_BITCOIN_FACTORY + "/Forecast-Client/notebooks/time-series.csv", nextForecastCase.files.timeSeries)

                    nextForecastCase.modelName = "MODEL-" + nextForecastCase.id

                    await buildModel(nextForecastCase)
                        .then(onSuccess)
                        .catch(onError)

                    async function onSuccess(forecastResult) {

                        nextForecastCase.expiration = thisObject.utilities.getExpiration(nextForecastCase)
                        nextForecastCase.timestamp = (new Date()).valueOf()
                        nextForecastCase.timeSeriesHash = thisObject.utilities.hash(nextForecastCase.files.timeSeries)
                        nextForecastCase.files = undefined
                        nextForecastCase.caseIndex = thisObject.forecastCasesArray.length

                        thisObject.forecastCasesArray.push(nextForecastCase)
                        saveForecastCasesFile()
                        logQueue(nextForecastCase)

                        if (forecastResult !== undefined) {
                            forecastResult.id = nextForecastCase.id
                            forecastResult.caseIndex = nextForecastCase.caseIndex
                            await setForecastCaseResults(forecastResult, 'clientInstanceBuilder', nextForecastCase.testServer)
                                .then(onSuccess)
                                .catch(onError)
                            async function onSuccess(response) {
                                let bestPredictions = JSON.parse(response.data.serverData.response)
                                console.log(' ')
                                console.log('Best Crowd-Sourced Predictions:')
                                console.table(bestPredictions)

                                callBackFunction(TS.projects.foundations.globals.standardResponses.DEFAULT_OK_RESPONSE)
                            }
                            async function onError(err) {
                                console.log((new Date()).toISOString(), 'Failed to send a Report to the Test Server with the Forecast Case Results and get a Reward for that. Err:', err, 'Aborting the processing of this case and retrying the main loop in 30 seconds...')
                                callBackFunction(TS.projects.foundations.globals.standardResponses.DEFAULT_RETRY_RESPONSE)
                            }
                        }
                    }

                    async function onError(err) {
                        console.log((new Date()).toISOString(), 'Failed to Build the Model for this Forecast Case. Err:', err, 'Aborting the processing of this case and retrying the main loop in 30 seconds...')
                        callBackFunction(TS.projects.foundations.globals.standardResponses.DEFAULT_RETRY_RESPONSE)
                    }
                } else {
                    console.log((new Date()).toISOString(), 'Nothing to Test', 'Retrying in 30 seconds...')
                    callBackFunction(TS.projects.foundations.globals.standardResponses.DEFAULT_RETRY_RESPONSE)
                }
            }
            async function onError(err) {
                console.log((new Date()).toISOString(), 'Failed to get a Forecast Case. Err:', err, 'Retrying in 30 seconds...')
                callBackFunction(TS.projects.foundations.globals.standardResponses.DEFAULT_RETRY_RESPONSE)
            }
        }
        catch (err) {
            TS.projects.foundations.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).UNEXPECTED_ERROR = err
            TS.projects.foundations.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE_OBJECT.write(MODULE_NAME,
                "[ERROR] start -> err = " + err.stack)
            callBackFunction(TS.projects.foundations.globals.standardResponses.DEFAULT_FAIL_RESPONSE)
        }
    }

    async function getNextForecastCase() {
        return new Promise(promiseWork)

        async function promiseWork(resolve, reject) {

            let message = {
                type: 'Get Next Forecast Case'
            }

            let queryMessage = {
                messageId: SA.projects.foundations.utilities.miscellaneousFunctions.genereteUniqueId(),
                sender: 'Forecast-Client',
                instance: TS.projects.foundations.globals.taskConstants.TASK_NODE.bot.config.clientInstanceBuilder,
                recipient: 'Forecast Client Manager',
                message: message,
                forecastClientVersion: FORECAST_CLIENT_VERSION
            }

            let messageHeader = {
                requestType: 'Query',
                networkService: 'Machine Learning',
                queryMessage: JSON.stringify(queryMessage)
            }

            if (TS.projects.foundations.globals.taskConstants.P2P_NETWORK.p2pNetworkClient.machineLearningNetworkServiceClient === undefined) {
                reject('Not connected to the Test Server yet... hold on...')
                return
            }

            await TS.projects.foundations.globals.taskConstants.P2P_NETWORK.p2pNetworkClient.machineLearningNetworkServiceClient.sendMessage(messageHeader)
                .then(onSuccess)
                .catch(onError)
            async function onSuccess(response) {
                if (response.data.serverData === undefined) {
                    reject('Not connected to Test Server')
                    return
                }
                if (response.data.serverData.response !== 'NO FORECAST CASES AVAILABLE AT THE MOMENT') {
                    let nextForecastCase = response.data.serverData.response
                    nextForecastCase.testServer = {
                        userProfile: response.data.serverData.userProfile,
                        instance: response.data.serverData.instance
                    }
                    resolve(nextForecastCase)
                } else {
                    reject('No more forecast cases at the Test Server')
                }
            }
            async function onError(err) {
                reject(err)
            }
        }
    }

    async function getThisForecastCase(forecastCase) {
        return new Promise(promiseWork)

        async function promiseWork(resolve, reject) {

            let message = {
                type: 'Get This Forecast Case',
                forecastCaseId: forecastCase.id
            }

            let queryMessage = {
                messageId: SA.projects.foundations.utilities.miscellaneousFunctions.genereteUniqueId(),
                sender: 'Forecast-Client',
                instance: TS.projects.foundations.globals.taskConstants.TASK_NODE.bot.config.clientInstanceForecaster,
                recipient: 'Forecast Client Manager',
                testServer: forecastCase.testServer,
                message: message,
                forecastClientVersion: FORECAST_CLIENT_VERSION
            }

            let messageHeader = {
                requestType: 'Query',
                networkService: 'Machine Learning',
                queryMessage: JSON.stringify(queryMessage)
            }

            await TS.projects.foundations.globals.taskConstants.P2P_NETWORK.p2pNetworkClient.machineLearningNetworkServiceClient.sendMessage(messageHeader)
                .then(onSuccess)
                .catch(onError)
            async function onSuccess(response) {
                if (response.data.serverData.response !== 'THIS FORECAST CASE IS NOT AVAILABLE ANYMORE') {
                    let thisForecastCase = response.data.serverData.response
                    thisForecastCase.testServer = {
                        userProfile: response.data.serverData.userProfile,
                        instance: response.data.serverData.instance
                    }
                    resolve(thisForecastCase)
                } else {
                    reject(response.data.serverData.response)
                }
            }
            async function onError(err) {
                reject(err)
            }
        }
    }

    async function setForecastCaseResults(forecastResult, clientInstanceConfigPropertyName, testServer) {
        return new Promise(promiseWork)

        async function promiseWork(resolve, reject) {
            let message = {
                type: 'Set Forecast Case Results',
                payload: JSON.stringify(forecastResult)
            }

            let queryMessage = {
                messageId: SA.projects.foundations.utilities.miscellaneousFunctions.genereteUniqueId(),
                sender: 'Forecast-Client',
                instance: TS.projects.foundations.globals.taskConstants.TASK_NODE.bot.config[clientInstanceConfigPropertyName],
                recipient: 'Forecast Client Manager',
                testServer: testServer,
                message: message,
                forecastClientVersion: FORECAST_CLIENT_VERSION
            }

            let messageHeader = {
                requestType: 'Query',
                networkService: 'Machine Learning',
                queryMessage: JSON.stringify(queryMessage)
            }

            await TS.projects.foundations.globals.taskConstants.P2P_NETWORK.p2pNetworkClient.machineLearningNetworkServiceClient.sendMessage(messageHeader)
                .then(onSuccess)
                .catch(onError)
            async function onSuccess(response) {
                resolve(response)
            }
            async function onError(err) {
                reject(err)
            }
        }
    }

    function writePhytonInstructionsFile(instruction, nextForecastCase) {
        /*
        Here we will instruct the Phyton Script to Build the model.
        */
        let instructionsFile = ""

        instructionsFile = instructionsFile +
            /* Headers */
            "INSTRUCTION" + "   " + "VALUE" + "\r\n" +
            /* Values */
            "ACTION_TO_TAKE" + "   " + instruction + "\r\n" +
            "MODEL_FILE_NAME" + "   " + nextForecastCase.modelName + "\r\n"
        SA.nodeModules.fs.writeFileSync(global.env.PATH_TO_BITCOIN_FACTORY + "/Forecast-Client/notebooks/instructions.csv", instructionsFile)
    }

    function getRelevantParameters(parameters) {
        /*
        Remove from Parameters the properties that are in OFF
        */
        let relevantParameters = {}
        for (const property in parameters) {
            if (parameters[property] !== 'OFF') {
                relevantParameters[property] = parameters[property]
            }
        }
        return relevantParameters
    }

    async function buildModel(nextForecastCase) {
        console.log('')
        console.log('------------------------------------------- Building Forecast Case # ' + nextForecastCase.id + ' ---- ' + (nextForecastCase.caseIndex + 1) + ' / ' + nextForecastCase.totalCases + ' --------------------------------------------------------')
        console.log('')
        console.log('Test Server: ' + nextForecastCase.testServer.userProfile + ' / ' + nextForecastCase.testServer.instance)
        console.log('')
        console.log('Parameters Received for this Forecast:')
        console.table(getRelevantParameters(nextForecastCase.parameters))
        console.log('')
        console.log((new Date()).toISOString(), 'Starting to process this Case')
        console.log('')

        writePhytonInstructionsFile("BUILD_AND_SAVE_MODEL", nextForecastCase)

        return new Promise(executeThePythonScript)
    }

    async function useModel(nextForecastCase) {
        console.log('')
        console.log('------------------------------------------------------- Reforcasting Case # ' + nextForecastCase.id + ' ------------------------------------------------------------')
        console.log('')
        console.log('Test Server: ' + nextForecastCase.testServer.userProfile + ' / ' + nextForecastCase.testServer.instance)
        console.log('')
        console.log('Parameters Received for this Forecast:')
        console.table(getRelevantParameters(nextForecastCase.parameters))
        console.log('')
        console.log((new Date()).toISOString(), 'Starting to process this Case')
        console.log('')

        writePhytonInstructionsFile("LOAD_MODEL_AND_PREDICT", nextForecastCase)

        return new Promise(executeThePythonScript)
    }

    async function executeThePythonScript(resolve, reject) {
        let processExecutionResult
        let startingTimestamp = (new Date()).valueOf()

        const { spawn } = require('child_process');
        const ls = spawn('docker', ['exec', 'Bitcoin-Factory-ML-Forecasting', 'python', '/tf/notebooks/Bitcoin_Factory_LSTM_Forecasting.py']);
        let dataReceived = ''
        ls.stdout.on('data', (data) => {
            data = data.toString()
            /*
            Removing Carriedge Return from string.
            */
            for (let i = 0; i < 1000; i++) {
                data = data.replace(/\n/, "")
            }
            dataReceived = dataReceived + data.toString()
        });

        ls.stderr.on('data', (data) => {
            onError(data)
        });

        ls.on('close', (code) => {
            console.log(`Docker Python Script exited with code ${code}`);
            if (code === 0) {
                onFinished(dataReceived)
            } else {
                console.log((new Date()).toISOString(), '[ERROR] Unexpected error trying to execute a Python script inside the Docker container. ')
                console.log((new Date()).toISOString(), '[ERROR] Check at a console if you can run this command: ')
                console.log((new Date()).toISOString(), '[ERROR] docker exec -it Bitcoin-Factory-ML-Forecasting python /tf/notebooks/Bitcoin_Factory_LSTM_Forecasting.py')
                console.log((new Date()).toISOString(), '[ERROR] Once you can sucessfully run it at the console you might want to try to run this App again. ')
                reject('Unexpected Error.')
            }
        });

        function onError(err) {
            err = err.toString()
            // ACTIVATE THIS ONLY FOR DEBUGGING console.log((new Date()).toISOString(), '[ERROR] Unexpected error trying to execute a Python script: ' + err)
        }

        function onFinished(dataReceived) {
            try {

                let index = dataReceived.indexOf('{')
                dataReceived = dataReceived.substring(index)
                console.log(dataReceived)
                processExecutionResult = JSON.parse(fixJSON(dataReceived))

                console.log('Prediction RMSE Error: ' + processExecutionResult.errorRMSE)
                console.log('Predictions [candle.max, candle.min, candle.close]: ' + processExecutionResult.predictions)

                let endingTimestamp = (new Date()).valueOf()
                processExecutionResult.enlapsedTime = (endingTimestamp - startingTimestamp) / 1000
                console.log('Enlapsed Time (HH:MM:SS): ' + (new Date(processExecutionResult.enlapsedTime * 1000).toISOString().substr(14, 5)) + ' ')

            } catch (err) {

                if (processExecutionResult !== undefined && processExecutionResult.predictions !== undefined) {
                    console.log('processExecutionResult.predictions:' + processExecutionResult.predictions)
                }

                console.log(err.stack)
                console.error(err)
            }

            resolve(processExecutionResult)
        }
    }

    async function updateForcasts() {
        if (reforecasting === true) {
            console.log((new Date()).toISOString(), 'Already Working on Reforcasting', 'Retrying in 60 seconds...')
            return
        }
        reforecasting = true
        for (let i = 0; i < thisObject.forecastCasesArray.length; i++) {
            let forecastCase = thisObject.forecastCasesArray[i]
            let timestamp = (new Date()).valueOf()

            if (timestamp < forecastCase.expiration) {
                console.log((new Date()).toISOString(), 'Forcast case ' + forecastCase.id + ' not expired yet. No need to Reforecast.', 'Reviewing this in 60 seconds...')
                continue
            } else {
                console.log((new Date()).toISOString(), 'Forcast case ' + forecastCase.id + ' expired.', 'Reforecasting now.')
                await reforecast(forecastCase, i)
                    .then(onSuccess)
                    .catch(onError)
                async function onSuccess() {
                    logQueue(forecastCase)
                }
                async function onError(err) {
                    if (err === 'THIS FORECAST CASE IS NOT AVAILABLE ANYMORE') {
                        console.log((new Date()).toISOString(), 'Removing Case Id ' + forecastCase.id + ' from our records.')
                        thisObject.forecastCasesArray.splice(i, 1)
                        i--
                        saveForecastCasesFile()
                    } else {
                        console.log((new Date()).toISOString(), 'Some problem at the Test Server prevented the forcasting of Case Id ' + forecastCase.id + ' . Server responded with: ' + err)
                    }
                }
            }
        }
        reforecasting = false
    }

    function logQueue(forecastCase) {
        let logQueue = []
        for (let i = Math.max(0, forecastCase.caseIndex - 5); i < Math.min(thisObject.forecastCasesArray.length, forecastCase.caseIndex + 5); i++) {
            let forecastCase = thisObject.forecastCasesArray[i]
            forecastCase.when = thisObject.utilities.getHHMMSS(forecastCase.timestamp) + ' HH:MM:SS ago'
            logQueue.push(forecastCase)
        }
        console.log()
        console.log((new Date()).toISOString(), 'A new Forecast for the Case Id ' + forecastCase.id + ' was produced / attemped.')
        console.table(logQueue)
    }

    async function reforecast(forecastCase, index) {
        return new Promise(promiseWork)

        async function promiseWork(resolve, reject) {
            await getThisForecastCase(forecastCase)
                .then(onSuccess)
                .catch(onError)
            async function onSuccess(thisForecastCase) {
                if (thisForecastCase !== undefined) {
                    SA.nodeModules.fs.writeFileSync(global.env.PATH_TO_BITCOIN_FACTORY + "/Forecast-Client/notebooks/parameters.csv", thisForecastCase.files.parameters)
                    SA.nodeModules.fs.writeFileSync(global.env.PATH_TO_BITCOIN_FACTORY + "/Forecast-Client/notebooks/time-series.csv", thisForecastCase.files.timeSeries)

                    thisForecastCase.modelName = "MODEL-" + thisForecastCase.id

                    let newTimeSeriesHash = thisObject.utilities.hash(thisForecastCase.files.timeSeries)
                    if (newTimeSeriesHash === forecastCase.timeSeriesHash) {
                        console.log((new Date()).toISOString(), 'The file provided by the Test Server is the same we already have.', 'Retrying the forcasting of case ' + thisForecastCase.id + ' in 60 seconds...')
                        reject('The same file that we already made a prediction with.')
                        return
                    }

                    await useModel(thisForecastCase)
                        .then(onSuccess)
                        .catch(onError)
                    async function onSuccess(forecastResult) {
                        thisForecastCase.files = undefined

                        if (forecastResult !== undefined) {
                            forecastResult.id = thisForecastCase.id
                            forecastResult.caseIndex = thisForecastCase.caseIndex
                            await setForecastCaseResults(forecastResult, 'clientInstanceForecaster', thisForecastCase.testServer)
                                .then(onSuccess)
                                .catch(onError)
                            async function onSuccess(response) {
                                let bestPredictions = JSON.parse(response.data.serverData.response)
                                console.log(' ')
                                console.log('Best Crowd-Sourced Predictions:')
                                console.table(bestPredictions)
                                /*
                                Recalculate the expiration, timestamp, hash and save.
                                */
                                let forecastCase = thisObject.forecastCasesArray[index]
                                forecastCase.expiration = thisObject.utilities.getExpiration(forecastCase)
                                forecastCase.timestamp = (new Date()).valueOf()
                                forecastCase.timeSeriesHash = newTimeSeriesHash

                                saveForecastCasesFile()
                                resolve()

                            }
                            async function onError(err) {
                                console.log((new Date()).toISOString(), 'Failed to send a Report to the Test Server with the Forecast Case Results and get a Reward for that. Err:', err, 'Retrying in 60 seconds...')
                                reject(err)
                            }
                        }
                    }
                    async function onError(err) {
                        console.log((new Date()).toISOString(), 'Failed to produce a Forecast for Case Id ' + forecastCase.id + '. Err:', err)
                        reject(err)
                    }
                } else {
                    console.log((new Date()).toISOString(), 'Nothing to Forecast', 'Retrying in 60 seconds...')
                    reject('Nothing to Forecast')
                }
            }
            async function onError(err) {
                console.log((new Date()).toISOString(), 'Failed to get the Forecast Case Id ' + forecastCase.id + '. Err:', err)
                reject(err)
            }
        }
    }

    function fixJSON(text) {
        /*
        Removing Carriedge Return from string.
        */
        for (let i = 0; i < 10; i++) {
            text = text.replace(" [", "[")
            text = text.replace("[ ", "[")
            text = text.replace(" ]", "]")
            text = text.replace("  ]", "]")
            text = text.replace("   ]", "]")
            text = text.replace("    ]", "]")
            text = text.replace("     ]", "]")
            text = text.replace("      ]", "]")
            text = text.replace("] ", "]")
        }
        for (let i = 0; i < 10; i++) {
            text = text.replace(",,", ",")
            text = text.replace(",]", "]")
            text = text.replace("[,", "[")
            text = text.replace(".,", ",")
            text = text.replace(".]", "]")
        }
        return text
    }

    function saveForecastCasesFile() {
        let fileContent = JSON.stringify(thisObject.forecastCasesArray, undefined, 4)
        SA.nodeModules.fs.writeFileSync(global.env.PATH_TO_BITCOIN_FACTORY + "/Forecast-Client/StateData/ForecastCases/Forecast-Cases-Array-" + BOT_CONFIG.networkCodeName + ".json", fileContent)
    }
}
