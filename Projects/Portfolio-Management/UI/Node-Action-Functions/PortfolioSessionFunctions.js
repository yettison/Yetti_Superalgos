function newPortfolioManagementFunctionLibraryPortfolioSessionFunctions() {
    let thisObject = {
        synchronizeSessionWithBackEnd: synchronizeSessionWithBackEnd,
        runSession: runSession,
        stopSession: stopSession,
        runManagedSessions: runManagedSessions,
        stopManagedSessions: stopManagedSessions
    }

    return thisObject

    function synchronizeSessionWithBackEnd(node) {
        let validationsResult = validations(node)
        if (validationsResult === undefined) {
            /* If something fails at validations we just quit. */
            return
        }
        let lanNetworkNode = validationsResult.lanNetworkNode
        if (lanNetworkNode === undefined) {
            /* Nodes that do not belong to a network can not get ready. */
            return
        }

        let eventsServerClient = UI.projects.workspaces.spaces.designSpace.workspace.eventsServerClients.get(lanNetworkNode.id)

        /* First we setup everything so as to listen to the response from the Task Server */
        let eventSubscriptionIdOnStatus
        let key = node.name + '-' + node.type + '-' + node.id
        eventsServerClient.listenToEvent(key, 'Status Response', undefined, node.id, onResponse, onStatus)

        function onResponse(message) {
            eventSubscriptionIdOnStatus = message.eventSubscriptionId
        }

        function onStatus(message) {
            eventsServerClient.stopListening(key, eventSubscriptionIdOnStatus, node.id)
            if (message.event.status === 'Portfolio Session Runnning') {
                node.payload.uiObject.menu.internalClick('Run Portfolio Session')
            }
        }

        /* Second we ask the Task Server if this Session is Running. */
        eventsServerClient.raiseEvent(key, 'Portfolio Session Status')
    }

    function runSession(node, resume, callBackFunction) {

        if (UI.environment.DEMO_MODE === true) {
            if (window.location.hostname !== 'localhost') {
                node.payload.uiObject.setWarningMessage('Superalgos is running is DEMO MODE. This means that you can not RUN Sessions.', 5)
                callBackFunction(GLOBAL.DEFAULT_FAIL_RESPONSE)
                return
            }
        }

        let validationsResult = validations(node)
        if (validationsResult === undefined) {
            /* If something fails at validations we just quit. */
            return
        }
        let lanNetworkNode = validationsResult.lanNetworkNode
        if (lanNetworkNode === undefined) {
            /* This means that the validations failed. */
            callBackFunction(GLOBAL.DEFAULT_FAIL_RESPONSE)
            return
        }

        let eventsServerClient = UI.projects.workspaces.spaces.designSpace.workspace.eventsServerClients.get(lanNetworkNode.id)

        let key = node.name + '-' + node.type + '-' + node.id

        /* Setup Listener to check Parent Task Status of the Session */
        let eventSubscriptionIdOnStatus
        let eventHandlerKey = "Task Client - " + node.payload.parentNode.payload.parentNode.payload.parentNode.id

        eventsServerClient.listenToEvent(eventHandlerKey, 'Task Status', undefined, node.id, onResponse, onStatus)

        function onResponse(message) {
            eventSubscriptionIdOnStatus = message.eventSubscriptionId
        }

        function onStatus(message) {
            eventsServerClient.stopListening(eventHandlerKey, eventSubscriptionIdOnStatus, node.id)

            /* If Task is Not Running Display Error */
            let task = UI.projects.visualScripting.utilities.meshes.findNodeInNodeMesh(node, 'Task', undefined, true, false, true, false)
            if (
                message.event.status === 'Task Process Not Running' &&
                task.payload.uiObject.isDebugging === undefined
            ) {
                node.payload.uiObject.setErrorMessage('Parent Task Not Running.')
                callBackFunction(GLOBAL.DEFAULT_FAIL_RESPONSE)
            } else {
                node.payload.uiObject.run(eventsServerClient, callBackFunction)
            }
        }

        /* Raise Event to Check Task Status */
        let eventKey = {}
        eventKey.taskId = node.payload.parentNode.payload.parentNode.payload.parentNode.id

        eventsServerClient.raiseEvent("Task Manager", 'Task Status', eventKey)

        let lightingPath = '' +
            'Portfolio System->' +
            'Managed Session Reference->' + 
            'Backtesting Session->Paper Trading Session->Forward Testing Session->Live Trading Session->' +
            'Events Manager->' +
            'Set Event Rules->Set Event Reference->Confirm Event Rules->Confirm Event Reference->' +
            'Formulas Manager->Confirm Formula Rules->Confirm Formula Reference->' +
            'Set Formula Rules->Set Formula Reference->' +
            'Situation->Condition->' +
            'Trading System->' +
            'Dynamic Indicators->Indicator Function->Formula->' +
            'Trading Strategy->' +
            'Trigger Stage->Trigger On Event->Trigger Off Event->Take Position Event->' +
            'Open Stage->' +
            'Manage Stage->' +
            'Managed Stop Loss->Managed Take Profit->' +
            'Phase->Formula->Next Phase Event->Move To Phase Event->Phase->' +
            'Situation->Condition->Javascript Code->' +
            'Outgoing Signals->Incoming Signals->Signal Reference->' +
            'Trigger On Signal->Trigger Off Signal->Take Position Signal->' +
            'Create Order Signal->Cancel Order Signal->' +
            'Close Stage->' +
            'Initial Targets->Target Size In Base Asset->Target Size In Quoted Asset->Target Rate->Formula->' +
            'Open Execution->Close Execution->' +
            'Execution Algorithm->Market Buy Order->Market Sell Order->Limit Buy Order->Limit Sell Order->' +
            'Order Rate->Formula->' +
            'Create Order Event->Cancel Order Event->' +
            'Close Stage Event->' +
            'Announcement->Announcement Formula->Announcement Condition->' +
            'Size In Base Asset->Size In Quoted Asset->Position Rate->Formula->' +
            'Situation->Condition->Javascript Code->' +
            'Market Order->Limit Order->' +
            'Simulated Exchange Events->Simulated Partial Fill->Simulated Actual Rate->Simulated Fees Paid->Formula->' +
            'User Defined Portfolio Code->Javascript Code->' +
            /* TODO: Nodes that probable will be deleted */
            'Episode Base Asset->Episode Quoted Asset->' +
            'Balance->Begin Balance->End Balance->Hits->Fails->' +
            'Profit Loss->Hit Ratio->Hit Fail->Days->ROI->Annualized Rate Of Return->User Defined Statistic->'

        let portfolioSystem = UI.projects.visualScripting.nodeActionFunctions.protocolNode.getProtocolNode(node.portfolioSystemReference.payload.referenceParent, false, true, true, false, false, lightingPath)

        lightingPath = '' +
            'Portfolio Engine->' +
            'Portfolio Current->Portfolio Last->' +
            'Exchange Managed Assets->Exchange Managed Asset->Asset Initial Balance->Asset Free Balance->Asset Locked Balance->Asset Total Balance->' +
            'Managed Trading Bots->Managed Trading Bot->Managed Trading Bot Engine->' +
            /*
            Portfolio Episode
            */
            'Portfolio Episode->' +
            'Episode Base Asset->Episode Quoted Asset->Portfolio Episode Counters->Portfolio Episode Statistics->' +
            'Strategies->Positions->Orders->Hits->Fails->User Defined Counter->' +
            'Profit Loss->Hit Ratio->Hit Fail->Days->ROI->Annualized Rate Of Return->User Defined Statistic->' +
            'Candle->Cycle->' +
            'Begin->End->Last Begin->Last End->Open->Close->Min->Max->Index->' +
            'Distance To Portfolio Event->' +
            'Head Of The Market->Process Date->' +
            'Trigger On->Trigger Off->Take Position->Close Position->Next Phase->Move To Phase->Create Order->Cancel Order->Close Order->' +
            'Strategy->' +
            'Strategy Counters->' +
            'Position->' +
            'Entry Target Rate->Exit Target Rate->' +
            'Stop Loss->Stop Loss Phase->Stop Loss Position->Begin->End->Initial Value->Final Value->' +
            'Take Profit->Take Profit Phase->Take Profit Position->Begin->End->Initial Value->Final Value->' +
            'Position Counters->' +
            'Position Statistics->Days->User Defined Statistic->' +
            'Position Base Asset->Position Quoted Asset->Entry Target Size->Exit Target Size->' +
            'Profit Loss->ROI->Hit Fail->' +
            'Exchange Orders->Market Buy Orders->Market Sell Orders->Limit Buy Orders->Limit Sell Orders->' +
            'Market Order->Limit Order->' +
            'Exchange Id->Rate->Order Name->Algorithm Name->Lock->' +
            'Order Counters->' +
            'Order Base Asset->Order Quoted Asset->' +
            'Actual Size->Size->Size Filled->Amount Received->Fees Paid->Fees To Be Paid->' +
            'Order Statistics->Percentage Filled->Actual Rate->Days->User Defined Statistic->' +
            'Strategy Trigger Stage->Strategy Open Stage->Strategy Manage Stage->Strategy Close Stage->' +
            'Begin->End->Exit Type->Status->Begin Rate->End Rate->Stage Base Asset->Stage Quoted Asset->Size Placed->Target Size->Size Filled->Fees Paid->Stage Defined In->' +
            'Serial Number->Identifier->Begin->End->Begin Rate->End Rate->Strategy Name->Status->Exit Type->' +
            'Balance->Begin Balance->End Balance->' +
            'Index->Situation Name->Formula->Periods->' +
            'User Defined Variables->User Defined Variable->' +
            /*
            Trading Engine
            */
            'Trading Engine->' +
            'Dynamic Indicators->Indicator Function->' +
            'Trading Current->Trading Last->Previous->' +
            'Trading Episode->' +
            'Episode Base Asset->Episode Quoted Asset->Trading Episode Counters->Trading Episode Statistics->' +
            'Strategies->Positions->Orders->Hits->Fails->User Defined Counter->' +
            'Profit Loss->Hit Ratio->Hit Fail->Days->ROI->Annualized Rate Of Return->User Defined Statistic->' +
            'Candle->Cycle->' +
            'Begin->End->Last Begin->Last End->Open->Close->Min->Max->Index->' +
            'Distance To Trading Event->' +
            'Head Of The Market->Process Date->' +
            'Trigger On->Trigger Off->Take Position->Close Position->Next Phase->Move To Phase->Create Order->Cancel Order->Close Order->' +
            'Strategy->' +
            'Strategy Counters->' +
            'Position->' +
            'Entry Target Rate->Exit Target Rate->' +
            'Stop Loss->Stop Loss Phase->Stop Loss Position->Begin->End->Initial Value->Final Value->' +
            'Take Profit->Take Profit Phase->Take Profit Position->Begin->End->Initial Value->Final Value->' +
            'Position Counters->' +
            'Position Statistics->Days->User Defined Statistic->' +
            'Position Base Asset->Position Quoted Asset->Entry Target Size->Exit Target Size->' +
            'Profit Loss->ROI->Hit Fail->' +
            'Exchange Orders->Market Buy Orders->Market Sell Orders->Limit Buy Orders->Limit Sell Orders->' +
            'Market Order->Limit Order->' +
            'Exchange Id->Rate->Order Name->Algorithm Name->Lock->' +
            'Order Counters->' +
            'Order Base Asset->Order Quoted Asset->' +
            'Actual Size->Size->Size Filled->Amount Received->Fees Paid->Fees To Be Paid->' +
            'Order Statistics->Percentage Filled->Actual Rate->Days->User Defined Statistic->' +
            'Strategy Trigger Stage->Strategy Open Stage->Strategy Manage Stage->Strategy Close Stage->' +
            'Begin->End->Exit Type->Status->Begin Rate->End Rate->Stage Base Asset->Stage Quoted Asset->Size Placed->Target Size->Size Filled->Fees Paid->Stage Defined In->' +
            'Serial Number->Identifier->Begin->End->Begin Rate->End Rate->Strategy Name->Status->Exit Type->' +
            'Balance->Begin Balance->End Balance->' +
            'Index->Situation Name->Formula->Periods->' +
            'User Defined Variables->User Defined Variable->'

        let portfolioEngine = UI.projects.visualScripting.nodeActionFunctions.protocolNode.getProtocolNode(node.portfolioEngineReference.payload.referenceParent, false, true, true, false, false, lightingPath)

        lightingPath = '' +
            'Backtesting Portfolio Session->Paper Portfolio Session->Forward Portfolio Session->Live Portfolio Session->' +
            'Portfolio Parameters->' +
            'Session Base Asset->Session Quoted Asset->Time Range->Time Frame->Slippage->Fee Structure->Snapshots->Heartbeats->User Defined Parameters->Managed Assets->Managed Asset->Asset->' +
            'Social Bots->Telegram Bot->Discord Bot->Slack Bot->Twitter Bot->' +
            'Social Bot Command->Formula->' +
            'Exchange Account Asset->Asset->'

        let session = UI.projects.visualScripting.nodeActionFunctions.protocolNode.getProtocolNode(node, false, true, true, false, false, lightingPath)

        let defaultExchange = UI.projects.visualScripting.utilities.nodeConfig.loadConfigProperty(validationsResult.exchange.payload, 'codeName')
        let defaultMarket =
            UI.projects.visualScripting.utilities.nodeConfig.loadConfigProperty(validationsResult.market.baseAsset.payload.referenceParent.payload, 'codeName')
            + '-' +
            UI.projects.visualScripting.utilities.nodeConfig.loadConfigProperty(validationsResult.market.quotedAsset.payload.referenceParent.payload, 'codeName')

        let dependencyFilter = UI.projects.foundations.nodeActionFunctions.dependenciesFilter.createDependencyFilter(
            defaultExchange,
            defaultMarket,
            node.portfolioSystemReference.payload.referenceParent
        )

        /* Raise event to run the session */
        let event = {
            session: JSON.stringify(session),
            portfolioSystem: JSON.stringify(portfolioSystem),
            portfolioEngine: JSON.stringify(portfolioEngine),
            dependencyFilter: JSON.stringify(dependencyFilter),
            resume: resume
        }

        if (resume !== true) {
            eventsServerClient.raiseEvent(key, 'Run Portfolio Session', event)
        } else {
            eventsServerClient.raiseEvent(key, 'Resume Portfolio Session', event)
        }

        if (node.payload.parentNode.payload.parentNode.payload.parentNode.payload.parentNode === undefined) {
            callBackFunction(GLOBAL.DEFAULT_FAIL_RESPONSE)
            return
        } else {
            // Check for Managed-Sessions and run them:
            if (node.managedSessions !== undefined) {
                runManagedSessions(node.managedSessions);
            }
        }
    }

    function stopSession(node, callBackFunction) {

        if (UI.environment.DEMO_MODE === true) {
            if (window.location.hostname !== 'localhost') {
                node.payload.uiObject.setWarningMessage('Superalgos is running is DEMO MODE. This means that you can not STOP Sessions.', 5)
                callBackFunction(GLOBAL.DEFAULT_FAIL_RESPONSE)
                return
            }
        }

        let validationsResult = validations(node)
        if (validationsResult === undefined) {
            /* If something fails at validations we just quit. */
            return
        }
        let lanNetworkNode = validationsResult.lanNetworkNode
        if (lanNetworkNode === undefined) {
            /* This means that the validations failed. */
            callBackFunction(GLOBAL.DEFAULT_FAIL_RESPONSE)
            return
        }

        /* Deal with any Managed Sessions and shut them down: */
        if (node.managedSessions !== undefined) {
            stopManagedSessions(node.managedSessions);
        }

        let eventsServerClient = UI.projects.workspaces.spaces.designSpace.workspace.eventsServerClients.get(lanNetworkNode.id)

        let key = node.name + '-' + node.type + '-' + node.id
        eventsServerClient.raiseEvent(key, 'Stop Portfolio Session')

        node.payload.uiObject.stop(callBackFunction, undefined, true)
    }

    function runManagedSessions(managedSessions) {
        for (let i = 0; i < managedSessions.sessionReferences.length; i++) {
            let refParent = managedSessions.sessionReferences[i].payload.referenceParent;
            let sessionType = refParent.type;

            if (sessionType === 'Live Trading Session' ||
                sessionType === 'Backtesting Session' ||
                sessionType === 'Forward Testing Session' ||
                sessionType === 'Paper Trading Session') {
                refParent.payload.uiObject.menu.internalClick('Run Trading Session');
            } else if (sessionType === 'Back Learning Session' || sessionType === 'Live Learning Session') {
                refParent.payload.uiObject.menu.internalClick('Run Learning Session');
            }
        }
    }

    function stopManagedSessions(managedSessions) {
        for (let i = 0; i < managedSessions.sessionReferences.length; i++) {
            let refParent = managedSessions.sessionReferences[i].payload.referenceParent;
            let sessionType = refParent.type;

            if (sessionType === 'Live Trading Session' ||
                sessionType === 'Backtesting Session' ||
                sessionType === 'Forward Testing Session' ||
                sessionType === 'Paper Trading Session') {
                refParent.payload.uiObject.menu.internalClick('Stop Trading Session');
            } else if (sessionType === 'Back Learning Session' || sessionType === 'Live Learning Session') {
                refParent.payload.uiObject.menu.internalClick('Stop Learning Session');
            }
        }
    }

    function validations(node) {

        let result = {}

        if (node.payload.parentNode === undefined) {
            node.payload.uiObject.setErrorMessage('Session needs a Process Instance parent to be able to run.')
            return
        }

        if (node.payload.parentNode.payload.parentNode === undefined) {
            node.payload.uiObject.setErrorMessage('Session needs to be inside a Process Instance node.')
            return
        }

        if (node.payload.parentNode.payload.parentNode.payload.parentNode === undefined) {
            node.payload.uiObject.setErrorMessage('Session needs to be inside a Task.')
            return
        }

        if (node.payload.parentNode.payload.parentNode.payload.parentNode.payload.parentNode === undefined) {
            node.payload.uiObject.setErrorMessage('Session needs to be inside a Task Manager.')
            return
        }

        result.taskManager = node.payload.parentNode.payload.parentNode.payload.parentNode.payload.parentNode

        if (result.taskManager.payload.parentNode === undefined) {
            node.payload.uiObject.setErrorMessage('Session needs to be inside Mine Tasks.')
            return
        }

        if (result.taskManager.payload.parentNode.payload.parentNode === undefined) {
            node.payload.uiObject.setErrorMessage('Session needs to be inside Market Tasks.')
            return
        }

        if (result.taskManager.payload.parentNode.payload.parentNode.payload.parentNode === undefined) {
            node.payload.uiObject.setErrorMessage('Session needs to be inside Exchange Tasks.')
            return
        }

        if (result.taskManager.payload.parentNode.payload.parentNode.payload.parentNode.payload.parentNode === undefined) {
            node.payload.uiObject.setErrorMessage('Session needs to be inside a Testing or Production Portfolio Tasks.')
            return
        }

        if (result.taskManager.payload.parentNode.payload.parentNode.payload.parentNode.payload.parentNode.payload.parentNode === undefined) {
            node.payload.uiObject.setErrorMessage('Session needs to be inside a Network Node.')
            return
        }

        result.lanNetworkNode = UI.projects.visualScripting.utilities.meshes.findNodeInNodeMesh(result.taskManager, 'LAN Network Node', undefined, true, false, true, false)

        if (node.portfolioSystemReference === undefined) {
            node.payload.uiObject.setErrorMessage('Session needs a child Portfolio System Reference.')
            return
        }

        if (node.portfolioEngineReference === undefined) {
            node.payload.uiObject.setErrorMessage('Session needs a child Portfolio Engine Reference.')
            return
        }

        if (node.portfolioSystemReference.payload.referenceParent === undefined) {
            node.payload.uiObject.setErrorMessage('Portfolio System Reference needs to reference a Portfolio System.')
            return
        }

        if (node.portfolioEngineReference.payload.referenceParent === undefined) {
            node.payload.uiObject.setErrorMessage('Portfolio Engine Reference needs to reference a Portfolio Engine.')
            return
        }

        if (result.taskManager.payload.parentNode.payload.parentNode.payload.referenceParent === undefined) {
            node.payload.uiObject.setErrorMessage('Session needs to have a Default Market.')
            return
        }

        result.market = result.taskManager.payload.parentNode.payload.parentNode.payload.referenceParent

        if (result.market.payload.parentNode === undefined) {
            node.payload.uiObject.setErrorMessage('Default Market needs to be a child of Exchange Markets.')
            return
        }

        if (result.market.payload.parentNode.payload.parentNode === undefined) {
            node.payload.uiObject.setErrorMessage('Exchange Markets neeed to be a child of Crypto Exchange.')
            return
        }

        if (result.market.baseAsset === undefined) {
            node.payload.uiObject.setErrorMessage('Default Market needs to have a Base Asset.')
            return
        }

        if (result.market.quotedAsset === undefined) {
            node.payload.uiObject.setErrorMessage('Default Market needs to have a Quoted Asset.')
            return
        }

        if (result.market.baseAsset.payload.referenceParent === undefined) {
            node.payload.uiObject.setErrorMessage('Market Base Asset needs to reference an Asset.')
            return
        }

        if (result.market.quotedAsset.payload.referenceParent === undefined) {
            node.payload.uiObject.setErrorMessage('Market Quoted Asset needs to reference an Asset.')
            return
        }

        result.exchange = result.market.payload.parentNode.payload.parentNode

        return result
    }
}
