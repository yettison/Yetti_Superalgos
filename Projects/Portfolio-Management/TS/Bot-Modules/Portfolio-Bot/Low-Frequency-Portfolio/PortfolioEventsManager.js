exports.newPortfolioManagementBotModulesPortfolioEventsManager = function (processIndex) {
    /*
    This object represents the Events Manager at the Portfolio System.
    Here we will process requests comming from Trading Bots to
    the Events Manager.
    */
    let thisObject = {
        confirmThisEvent: confirmThisEvent,
        setThisEvent: setThisEvent,
        initialize: initialize,
        finalize: finalize
    }

    let portfolioSystem
    let eventsManagerMap

    return thisObject

    function initialize() {
        portfolioSystem = TS.projects.foundations.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).SIMULATION_STATE.portfolioSystem

        eventsManagerMap = new Map()
        for (let i = 0; i < portfolioSystem.managedSessionReferences.length; i++) {
            let managedSessionReference = portfolioSystem.managedSessionReferences[i]
            if (managedSessionReference.referenceParent === undefined) { continue }
            eventsManagerMap.set(managedSessionReference.referenceParent.id, managedSessionReference.eventsManager)
        }
    }

    function finalize() {
        portfolioSystem = undefined
        eventsManagerMap = undefined
    }

    function confirmThisEvent(sessionId, event) {
        let eventsManager = eventsManagerMap.get(sessionId)

        if (eventsManager === undefined) {
            let response = {
                status: 'Not Ok',
                reason: "No Portfolio Events Manager found at Portfolio System for this Managed Session."
            }
            return response
        }
        if (eventsManager.confirmEventRules === undefined) {
            let response = {
                status: 'Not Ok',
                reason: "No Confirm Events Rules found at Portfolio Events Manager"
            }
            return response
        }

        for (let i = 0; i < eventsManager.confirmEventRules.confirmEventReferences.length; i++) {
            let confirmEventReference = eventsManager.confirmEventRules.confirmEventReferences[i]

            if (confirmEventReference.referenceParent === undefined) { continue }
            if (confirmEventReference.referenceParent.id !== event.node.id) { continue }

            portfolioSystem.evalConditions(confirmEventReference, 'Confirm Event Reference')

            for (let k = 0; k < confirmEventReference.situations.length; k++) {
                let situation = confirmEventReference.situations[k]
                let passed
                if (situation.conditions.length > 0) {
                    passed = true
                }

                passed = portfolioSystem.checkConditions(situation, passed)

                portfolioSystem.values.push([situation.id, passed])

                if (passed) {

                    portfolioSystem.highlights.push(situation.id)
                    portfolioSystem.highlights.push(confirmEventReference.id)
                    portfolioSystem.highlights.push(confirmEventReference.id)

                    let response = {
                        status: 'Ok',
                        passed: true
                    }
                    return response
                }
            }

            let response = {
                status: 'Ok',
                passed: false
            }
            return response
        }
    }

    function setThisEvent(sessionId, event) {
        let eventsManager = eventsManagerMap.get(sessionId)

        if (eventsManager === undefined) {
            let response = {
                status: 'Not Ok',
                reason: "No Portfolio Events Manager found at Portfolio System for this Managed Session."
            }
            return response
        }
        if (eventsManager.setEventRules === undefined) {
            let response = {
                status: 'Not Ok',
                reason: "No Set Events Rules found at Portfolio Events Manager"
            }
            return response
        }

        for (let i = 0; i < eventsManager.setEventRules.setEventReferences.length; i++) {
            let setEventReference = eventsManager.setEventRules.setEventReferences[i]

            if (setEventReference.referenceParent === undefined) { continue }
            if (setEventReference.referenceParent.id !== event.node.id) { continue }

            portfolioSystem.evalConditions(setEventReference, 'Set Event Reference')

            for (let k = 0; k < setEventReference.situations.length; k++) {
                let situation = setEventReference.situations[k]
                let passed
                if (situation.conditions.length > 0) {
                    passed = true
                }

                passed = portfolioSystem.checkConditions(situation, passed)

                portfolioSystem.values.push([situation.id, passed])

                if (passed) {

                    portfolioSystem.highlights.push(situation.id)
                    portfolioSystem.highlights.push(setEventReference.id)
                    portfolioSystem.highlights.push(setEventReference.id)

                    let response = {
                        status: 'Ok',
                        passed: true
                    }
                    return response
                }
            }

            let response = {
                status: 'Ok',
                passed: false
            }
            return response
        }
    }
}