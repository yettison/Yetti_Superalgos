exports.newDashboardsInterface = function newDashboardsInterface() {
    /* This file holds the interface that aggregates metrics and any other system data
       and then sends it over websocket to the Dashboards App */
    
    // todo: refactor eventserver client to it's own file
    // todo: events server dashboard
    // todo: tasks manager dashboard 
    // todo: create generic dashboard reporter function that can be drop into any place within the platform
    // todo: make dashboard reporter function able to be interval or event based
    // todo: connect dashboard interface when dashboard app is started second
    // todo: set up dashboards project to hold function libraries
    // todo: add platform menu to launch dashboards app
    // todo: create dashboards reporter node to allow control of dashboard reporting from platform UI 


    let thisObject = {
        initialize: initialize,
        finalize: finalize,
        run: run
    }

    const WEB_SOCKET = SA.nodeModules.ws
    let socketClient
    let port = global.env.DASHBOARDS_WEB_SOCKETS_INTERFACE_PORT
    let url = 'ws://localhost:'+ port
    let eventsServerClient = PL.servers.TASK_MANAGER_SERVER.newEventsServerClient()
    //const path = require('path'); 


    return thisObject

    function initialize () {

        eventsServerClient.createEventHandler('Dashboard Manager')
        eventsServerClient.listenToEvent('Dashboard Manager', 'Dashboard App Status', undefined, undefined, undefined, runInterface)
        
        function runInterface (response){
            if (response.event.isRunning === true) {
                SA.logger.info('')
                SA.logger.info(response.event.message)
                setUpWebSocketClient(url)

            } else if (response.event.isRunning === false) {
                //Skip websocket client initalization
                //SA.logger.info('')
                //SA.logger.info(response.event.message)

            } else {
                SA.logger.error('[ERROR] Something went wrong running the Dashboard App Interface: ', response)
            }
        }


        // Beginings of Task manager code
            //SA.logger.info('can we get this object', tasksMap)
            //eventsServerClient.listenToEvent('Task Manager', 'Run Task', undefined, undefined, undefined, newMessage)
            //eventsServerClient.listenToEvent('Task Manager', 'Stop Task', undefined, undefined, undefined, newMessage)
            //eventsServerClient.listenToEvent('Task Manager', 'Task Status', undefined, undefined, undefined, newMessage)
            // listen to all the task clients let eventHandlerKey = "Task Client - " + node.payload.parentNode.payload.parentNode.payload.parentNode.id
            // eventsServerClient.listenToEvent(eventHandlerKey, 'Task Status', undefined, node.id, onResponse, onStatus)
            // let task = tasksMap.get(message.event.taskId)
            // eventsServerClient.raiseEvent('Task Client - ' + message.event.taskId, 'Task Status', event)

            /* function newMessage (message) {
                SA.logger.info('this is the message in the dashboards client event listeners', message)
            } */

  
            // eventsServerClient.listenToEvent('Task Manager - ' + message.event.taskId, 'Nodejs Process Ready for Task', undefined, undefined, undefined, sendStartingEvent)

                    /* Listen to event to start or stop the session. 
                    TS.projects.foundations.globals.taskConstants.EVENT_SERVER_CLIENT_MODULE_OBJECT.listenToEvent(
                        TS.projects.foundations.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).SESSION_KEY,
                        'Trading Session Status',
                        undefined,
                        TS.projects.foundations.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).SESSION_KEY,
                        undefined,
                        onSessionStatus)
                    TS.projects.foundations.globals.taskConstants.EVENT_SERVER_CLIENT_MODULE_OBJECT.listenToEvent(
                        TS.projects.foundations.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).SESSION_KEY,
                        'Run Trading Session',
                        undefined,
                        TS.projects.foundations.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).SESSION_KEY,
                        undefined,
                        onSessionRun)
                    TS.projects.foundations.globals.taskConstants.EVENT_SERVER_CLIENT_MODULE_OBJECT.listenToEvent(
                        TS.projects.foundations.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).SESSION_KEY,
                        'Stop Trading Session',
                        undefined,
                        TS.projects.foundations.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).SESSION_KEY,
                        undefined,
                        onSessionStop)
                    TS.projects.foundations.globals.taskConstants.EVENT_SERVER_CLIENT_MODULE_OBJECT.listenToEvent(
                        TS.projects.foundations.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).SESSION_KEY,
                        'Resume Trading Session',
                        undefined,
                        TS.projects.foundations.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).SESSION_KEY,
                        undefined,
                        onSessionResume)
                        */
    }      

    function finalize() {
        socketClient = undefined
    }

    async function run() {
     
        checkDashboardAppStatus(port, statusResponse)

        function statusResponse(status, message) {
            let event = {
                isRunning: status,
                message: message
            }   
            eventsServerClient.raiseEvent("Dashboard Manager", 'Dashboard App Status', event)
        }
    }

    async function checkDashboardAppStatus(port, callbackFunc) {
        var net = require('net')
        var tester = net.createServer()
        .once('error', function (err) {
          if (err.code != 'EADDRINUSE') {
            callbackFunc(err)
          } else {
            callbackFunc(true, 'Dashboard App Interface is Running!')
          }
        })
        .once('listening', function() {
            tester.once('close', function() { 
                callbackFunc(false, 'Dashboard App is not Running... Pausing Interface.') 
            })
            .close()
        })
        .listen(port)
    }
    
    function setUpWebSocketClient(url) {
        socketClient = new WEB_SOCKET.WebSocket(url)

        socketClient.on('open', function (open) {
            let message = (new Date()).toISOString() + '|*|Platform|*|Info|*|Platform Dashboards Client has been Opened'
            socketClient.send(message)
            
            //sendExample()
            //sendGlobals()
            // Resend every 10 minutes
            //setInterval(sendGlobals, 6000)
            //sendGovernance()

            sendSimulationData();
            sendCandlesData();  
            //sendOutputData();
            setInterval(sendSimulationData, 60000);
            setInterval(sendCandlesData, 60000);         
            // setInterval(sendOutputData, 60000);         
        });

        socketClient.on('close', function (close) {
            SA.logger.info('[INFO] Dashboard App has been disconnected.')
        })

        socketClient.on('error', function (error) {
            SA.logger.error('[ERROR] Dashboards Client error: ', error.message, error.stack)
        });
        
        socketClient.on('message', function (message) {
            SA.logger.info('This is a message coming from the Dashboards App', message)
        });
    }

    async function sendSimulationData() {
        const fs = require('fs').promises;
        const path = require('path');
    
        const basePath = path.join(global.env.PATH_TO_DATA_STORAGE, 'Project', 'Algorithmic-Trading', 'Trading-Mine', 'Masters', 'Low-Frequency');
    
        // Función para encontrar los reportes de estado
        async function findStatusReports(dir) {
            let results = [];
            const list = await fs.readdir(dir);
            for (const file of list) {
                const filePath = path.resolve(dir, file);
                const stat = await fs.stat(filePath);
                if (stat && stat.isDirectory()) {
                    results = results.concat(await findStatusReports(filePath));
                } else if (filePath.endsWith('Status.Report.json') || filePath.endsWith('Status.Report.json.Previous.json')) {
                    results.push(filePath);
                }
            }
            return results;
        }
    
        try {
            const reportPaths = await findStatusReports(basePath);
    
            for (const reportPath of reportPaths) {
                const data = await fs.readFile(reportPath, 'utf8');
                let jsonData;
                try {
                    jsonData = JSON.parse(data);
                } catch (parseError) {
                    console.error('Error parsing JSON:', parseError);
                    continue;
                }
    
                jsonData.reportPath = reportPath; // Agrega el path del reporte
    
                //SA.logger.info('Data to send (before stringifying):', jsonData);
    
                // Serializar jsonData a una cadena JSON
                const jsonDataString = JSON.stringify(jsonData);
    
                // Construir el mensaje a enviar
                const messageToSend = `${new Date().toISOString()}|*|Platform|*|Data|*|SimulationResult|*|${jsonDataString}`;
    
                //SA.logger.info('Message send from:', JSON.stringify(reportPath));
    
                socketClient.send(messageToSend);
            }
        } catch (error) {
            console.error('Error processing simulation data:', error);
        }
    }

    async function sendCandlesData() {
        const fs = require('fs').promises;
        const path = require('path');
    
        const basePath = path.join(global.env.PATH_TO_DATA_STORAGE, 'Project', 'Data-Mining', 'Data-Mine', 'Candles', 'Exchange-Raw-Data');
    
        async function findCandlesFiles(dir) {
            let results = [];
            const list = await fs.readdir(dir);
            for (const file of list) {
                const filePath = path.resolve(dir, file);
                const stat = await fs.stat(filePath);
                if (stat && stat.isDirectory()) {
                    results = results.concat(await findCandlesFiles(filePath));
                } else if (filePath.endsWith('Data.json')) {
                    results.push(filePath);
                }
            }
            return results;
        }
    
        function isValidCandleData(candle) {
            return candle.high > 0 && candle.low > 0 && candle.low < candle.high;
        }
    
        function extractCandleDataFromPath(candlePath) {
            const pathParts = candlePath.split(path.sep); 
            const outputIndex = pathParts.indexOf('Output');
            if (outputIndex === -1 || outputIndex >= pathParts.length - 1) return null;
            if (pathParts[outputIndex + 1] !== 'Candles') return null;
    
            const exchange = pathParts[outputIndex - 2];
            const assetPair = pathParts[outputIndex - 1];
            const year = pathParts[outputIndex + 3];
            const month = pathParts[outputIndex + 4];
            const day = pathParts[outputIndex + 5];
    
            const beginDate = `${year}-${month}-${day}T00:00:00.000Z`;
            const endDate = `${year}-${month}-${day}T23:59:59.999Z`;
    
            return { exchange, assetPair, beginDate, endDate };
        }
    
        try {
            const candlePaths = await findCandlesFiles(basePath);
            const candlesByExchangePair = {};
    
            for (const candlePath of candlePaths) {
                const data = await fs.readFile(candlePath, 'utf8');
                let jsonData;
                try {
                    jsonData = JSON.parse(data);
                } catch (parseError) {
                    console.warn(`Error parsing JSON: ${parseError}, path: ${candlePath}`);
                    continue;
                }
    
                if (!jsonData || jsonData.length === 0) {
                    console.warn('Empty or invalid JSON data:', candlePath);
                    continue;
                }
    
                const pathData = extractCandleDataFromPath(candlePath);
                if (!pathData) {
                    continue;
                }
    
                const { exchange, assetPair} = pathData;
                const key = `${exchange} | ${assetPair}`;
    
                const candleData = {
                    high: Math.max(...jsonData.map(c => c[2])),
                    low: Math.min(...jsonData.map(c => c[1])),
                    beginDate: new Date(jsonData[0][4]).toISOString().slice(0, -1), 
                    endDate: new Date(jsonData[jsonData.length - 1][5]).toISOString().slice(0, -1),  
                    dataPath: candlePath,
                };
    
                if (!isValidCandleData(candleData)) {
                    continue;
                }
    
                if (!candlesByExchangePair[key]) {
                    candlesByExchangePair[key] = [];
                }
    
                candlesByExchangePair[key].push(candleData);
            }
    
            // Enviar los datos agrupados
            for (const [exchangePair, candleData] of Object.entries(candlesByExchangePair)) {
                const filteredData = {
                    exchangePair,
                    candleData,
                };
                let messageToSend = `${new Date().toISOString()}|*|Platform|*|Data|*|CandlesData|*|${JSON.stringify(filteredData)}`;
                socketClient.send(messageToSend);
                //SA.logger.info(`Candles data sent from SA to Dashboard for ${exchangePair}`);
                //SA.logger.info(`Candles data sent from SA to Dashboard for ${messageToSend}`);  
            }
        } catch (error) {
            SA.logger.error('Error processing candle data:', error);
        }
    }   
    
    /*async function sendOutputData() {
        const fs = require('fs').promises;
        const path = require('path');
        const zlib = require('zlib');
    
        const basePath = path.join(global.env.PATH_TO_DATA_STORAGE, 'Project', 'Algorithmic-Trading', 'Trading-Mine', 'Masters', 'Low-Frequency');
    
        function extractTradingSessionInfo(outputPath) {
            const pathParts = outputPath.split(path.sep);
            const outputIndex = pathParts.indexOf('Output');
            if (outputIndex === -1 || outputIndex >= pathParts.length - 1) return null;
    
            const exchange = pathParts[outputIndex - 2];
            const assetPair = pathParts[outputIndex - 1];
            const tradingSession = pathParts[outputIndex + 1];
    
            return { exchange, assetPair, tradingSession };
        }
    
        async function findDataFiles(dir, timeFrames) {
            let results = [];
            const list = await fs.readdir(dir);
    
            for (const file of list) {
                const filePath = path.resolve(dir, file);
                const stat = await fs.stat(filePath);
    
                if (stat && stat.isDirectory()) {
                    if (timeFrames.some(timeFrame => filePath.includes(timeFrame))) {
                        results = results.concat(await findDataFiles(filePath, timeFrames));
                    }
                } else if (filePath.endsWith('Data.json')) {
                    results.push(filePath);
                }
            }
            return results;
        }
    
        async function getTimeFrames(dir) {
            const timeFramesPath = path.join(dir, 'Time.Frames.json');
            try {
                const timeFramesData = await fs.readFile(timeFramesPath, 'utf8');
                return JSON.parse(timeFramesData);
            } catch (error) {
                console.error(`Error reading Time.Frames.json from ${timeFramesPath}: ${error}`);
                return [];
            }
        }
    
        function extractDataFromFile(jsonData) {
            return jsonData.map(item => {
                const potentialDates = item.filter(val => !isNaN(new Date(val).getTime()));
    
                if (potentialDates.length < 2) {
                    console.warn(`Invalid date in data: ${item}`);
                    return null;
                }
    
                const startDate = new Date(potentialDates[0]).toISOString();
                const endDate = new Date(potentialDates[1]).toISOString();
    
                const positionStatus = item.find(val => val === 'Open' || val === 'Closed') || 'Unknown';
                const entryTarget = item.find(val => typeof val === 'number') || 'Unknown';
                const exitTarget = item.find((val, idx) => idx > item.indexOf(entryTarget) && typeof val === 'number') || 'Unknown';
                const profitLoss = item.find(val => typeof val === 'number') || 0;
                const roi = item.find(val => typeof val === 'number' && val > 0) || 0;
                const hitOrFail = item.includes('Hit') ? 'Hit' : 'Fail';
    
                return {
                    startDate,
                    endDate,
                    positionStatus,
                    entryTarget,
                    exitTarget,
                    profitLoss,
                    roi,
                    hitOrFail
                };
            }).filter(item => item !== null);
        }
    
        async function processFilesInBatches(files, exchange, assetPair, tradingSession) {
            const batchSize = 100;
            for (let i = 0; i < files.length; i += batchSize) {
                const batch = files.slice(i, i + batchSize);
                const batchData = [];
    
                for (const dataFile of batch) {
                    const data = await fs.readFile(dataFile, 'utf8');
                    let jsonData;
                    try {
                        jsonData = JSON.parse(data);
                    } catch (parseError) {
                        console.error('Error parsing JSON:', parseError);
                        continue;
                    }
    
                    const extractedData = extractDataFromFile(jsonData);
                    if (extractedData.length > 0) {
                        batchData.push(...extractedData);
                    }
                }
    
                if (batchData.length > 0) {
                    const messageToSend = {
                        exchange,
                        assetPair,
                        tradingSession,
                        data: batchData
                    };
    
                    const message = `${new Date().toISOString()}|*|Platform|*|Data|*|Platform-SimulationOutput|*|${JSON.stringify(messageToSend)}`;
                    const compressedData = zlib.gzipSync(message);
                    socketClient.send(compressedData);
                    //SA.logger.info(`Compressed output data sent for batch: ${exchange}/${assetPair}/${tradingSession}`);
                }
            }
        }
    
        try {
            const exchangeDirs = await fs.readdir(basePath);
            for (const exchange of exchangeDirs) {
                const exchangePath = path.join(basePath, exchange);
                const assetPairs = await fs.readdir(exchangePath);
    
                for (const assetPair of assetPairs) {
                    const outputPath = path.join(exchangePath, assetPair, 'Output');
                    const tradingSessionInfo = extractTradingSessionInfo(outputPath);
    
                    // Validate tradingSessionInfo before destructuring
                    if (!tradingSessionInfo) {
                        console.warn(`Could not extract trading session info from path: ${outputPath}`);
                        continue;
                    }
    
                    // Now it's safe to destructure the tradingSessionInfo
                    const { exchange, assetPair, tradingSession } = tradingSessionInfo;
    
                    const timeFrames = await getTimeFrames(outputPath);
                    const dataFiles = await findDataFiles(outputPath, timeFrames);
    
                    if (dataFiles.length > 0) {
                        await processFilesInBatches(dataFiles, exchange, assetPair, tradingSession);
                    } else {
                        console.warn(`No Data.json files found for ${exchange}/${assetPair}/${tradingSession}`);
                    }
                }
            }
        } catch (error) {
            console.error('Error processing output data:', error);
        }
    }
    */

     
    
    // async function sendGovernance() {
    //     let test = {
    //                             User1: {name: 'UserName', wallet: 'User BlockchainWallet', SAbalance: 123456789, TokenPower: 987654321},
    //                             User2: {name: 'UserName', wallet: 'User BlockchainWallet', SAbalance: 'User Token Balance', TokenPower: 'User Token Power'},
    //                             User3: {name: 'UserName', wallet: 'User BlockchainWallet', SAbalance: 'User Token Balance', TokenPower: 'User Token Power'},

    //                         }
        
    //     let userInfo1 = Array.from(SA.projects.network.globals.memory.maps.USER_PROFILES_BY_ID)
    //     let userInfo2 = await SA.projects.network.modules.AppBootstrapingProcess.extractInfoFromUserProfiles(userProfile)

    //     userInfo2

    //    // let messageToSend = (new Date()).toISOString() + '|*|Platform|*|Data|*|Governance-UserInfo|*|'/* + JSON.stringify(test) */+ '|*|' + JSON.stringify(userInfo1) + '|*|' + JSON.stringify(userInfo2)
    //     //socketClient.send(messageToSend)

    //     //SA.logger.info('from UserInfo to Dashboard APP:' , test)
    //     //SA.logger.info('from UserInfo 1 to Dashboard APP:' , userInfo1)
    //     //SA.logger.info('from UserInfo 2 to Dashboard APP:' , userInfo2)

    // }  

    // function sendGlobals() {
    //     // This function packs and then sends the Global objects to the inspector
    //     packedSA = packGlobalObj('SA', SA)
    //     packedPL = packGlobalObj('PL', PL)

    //     //let parsed = JSON.parse(data)
    //     //SA.logger.info('this is the parsed object', parsed)
    //     let messageToSend = (new Date()).toISOString() + '|*|Platform|*|Data|*|Globals|*|' + packedSA + '|*|' + packedPL
    //     socketClient.send(messageToSend)

    //     // todo: handle global TS object 
    //     // note: Access event handlers PL.servers.EVENT_SERVER.eventHandlers

    //     function packGlobalObj (name, object) {
    //         // This function copies a global object over to a simple JS Object and then is stringified to JSON in order to be sent over websocket
    //         let packedGlobal = {}
    //         packedGlobal[name] = recursivelyCopy(object)

    //         return JSON.stringify(packedGlobal)

    //         function recursivelyCopy (object) {
    //             let objectCopy = {}
        
    //             if (typeof object === 'object') {
    //                 // Break down various object types and copy them all to a simple javascript object
    //                 if (object instanceof Array) {
    //                     object.forEach( function (value, index) {
    //                         objectCopy[index] = recursivelyCopy(value)

    //                     })
    //                 } else if (object instanceof Map) {
    //                     object.forEach( function (value, key) {
    //                         objectCopy[key] = recursivelyCopy(value)

    //                     })
    //                 } else if (object instanceof Object) {
    //                     for (let element in object ) {
    //                         if (element === 'nodeModules') {
    //                             //Only copies name of each dependency
    //                             let dependencies = []
    //                             for (let module in object[element] ) {
    //                                 dependencies.push(module)
    //                             }
    //                             objectCopy[element] = dependencies
    //                         } else {
    //                             objectCopy[element] = recursivelyCopy(object[element])
    //                         }
    //                     }
    //                 } 
    //             } else if (typeof object === 'function') {
    //                 objectCopy = object.constructor.name

    //             } else {
    //                 // All other variables are directly assigned to objectCopy
    //                 objectCopy = object

    //             } 
    //             return objectCopy
    //         }
    //     }
    // }
    // function sendExample() {
    //     let oneObjToSend = { 
    //                             example1: 'string data', 
    //                             example2: 79456, 
    //                             example3: { nestedObj1: 'more string data', nestedObj2: 9097789 }
    //                         }

    //     let twoObjToSend = {
    //                             exampleArray1: [ "data string", "more Data", "hold on one more" ],
    //                             exampleArray2: [ 34, 645, 2354, 58655 ]
    //                         }

    //     let messageToSend = (new Date()).toISOString() + '|*|Platform|*|Data|*|Example|*|' + JSON.stringify(oneObjToSend) + '|*|' + JSON.stringify(twoObjToSend)
    //     socketClient.send(messageToSend)
    // }
}