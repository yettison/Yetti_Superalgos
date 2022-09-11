exports.newPortfolioManagementModulesPortfolioManagerEventsInterface = function (processIndex) {
    /*
    This object represents the interface between the Portfolio Manager and Trading Bots.
    It is an events based interface because the communication happens via the Events Server.
    */
    let thisObject = {
        initialize: initialize,
        finalize: finalize
    }

    let tradingBotsInterfaceModuleObject

    return thisObject

    function initialize(portfolioManagedTradingBotsModuleObject, portfolioSystemModuleObject) {

        tradingBotsInterfaceModuleObject = TS.projects.portfolioManagement.modules.portfolioManagerTradingBotsInterface.newPortfolioManagementModulesPortfolioManagerTradingBotsInterface(processIndex)
        tradingBotsInterfaceModuleObject.initialize(portfolioManagedTradingBotsModuleObject, portfolioSystemModuleObject)

        for (let i = 0; i < TS.projects.foundations.globals.taskConstants.MANAGED_SESSIONS_REFERENCES.length; i++) {

            let SESSION_KEY = TS.projects.foundations.globals.taskConstants.MANAGED_SESSIONS_REFERENCES[i].referenceParent.name +
                '-' + TS.projects.foundations.globals.taskConstants.MANAGED_SESSIONS_REFERENCES[i].referenceParent.type +
                '-' + TS.projects.foundations.globals.taskConstants.MANAGED_SESSIONS_REFERENCES[i].referenceParent.id

            waitForRequests()

            function waitForRequests() {

                TS.projects.foundations.globals.taskConstants.EVENT_SERVER_CLIENT_MODULE_OBJECT.listenToEvent(
                    SESSION_KEY,
                    'Request From Trading Bot',
                    undefined,
                    SESSION_KEY,
                    undefined,
                    onRequest)

                function onRequest(eventMessage) {
                    if (tradingBotsInterfaceModuleObject === undefined) {
                        /*
                        This might happen when the Portfolio Bot goes to sleep.
                        */
                        let response = {
                            status: 'Not Ok',
                            reason: "Portfolio Bot Sleeping."
                        }
                        TS.projects.foundations.globals.taskConstants.EVENT_SERVER_CLIENT_MODULE_OBJECT.raiseEvent(
                            SESSION_KEY,
                            'Response From Portfolio Manager',
                            response,
                            SESSION_KEY
                        )
                        return
                    }

                    let response = tradingBotsInterfaceModuleObject.processMessage(
                        SESSION_KEY,
                        TS.projects.foundations.globals.taskConstants.MANAGED_SESSIONS_REFERENCES[i].referenceParent.id,
                        eventMessage.event
                    )
                    /* 
                    Return Response 
                    */
                    response.messageId = eventMessage.event.messageId
                    TS.projects.foundations.globals.taskConstants.EVENT_SERVER_CLIENT_MODULE_OBJECT.raiseEvent(
                        SESSION_KEY,
                        'Response From Portfolio Manager',
                        response,
                        SESSION_KEY
                    )
                }
            }
        }
    }

    function finalize() {
        tradingBotsInterfaceModuleObject.finalize()
        tradingBotsInterfaceModuleObject = undefined
    }
}