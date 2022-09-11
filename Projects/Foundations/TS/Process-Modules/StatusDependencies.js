﻿exports.newFoundationsProcessModulesStatusDependencies = function (processIndex) {

    const MODULE_NAME = "Status Dependencies"

    let thisObject = {
        nodeArray: undefined,
        statusReports: new Map(),
        reportsByMainUtility: new Map(),
        initialize: initialize,
        finalize: finalize,
        keys: []
    }

    return thisObject

    function initialize(callBackFunction) {
        try {
            /* Basic Validations */
            if (TS.projects.foundations.globals.taskConstants.TASK_NODE.bot.processes[processIndex].referenceParent.processDependencies !== undefined) {
                if (TS.projects.foundations.globals.taskConstants.TASK_NODE.bot.processes[processIndex].referenceParent.processDependencies.statusDependencies !== undefined) {
                    thisObject.nodeArray = TS.projects.foundations.globals.taskConstants.TASK_NODE.bot.processes[processIndex].referenceParent.processDependencies.statusDependencies
                    if (thisObject.nodeArray.length === 0) {
                        callBackFunction(TS.projects.foundations.globals.standardResponses.DEFAULT_OK_RESPONSE)
                        return
                    }
                } else {
                    TS.projects.foundations.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE_OBJECT.write(MODULE_NAME, "[ERROR] initialize -> onInitilized -> It is not possible to not have status dependencies at all.")
                    callBackFunction(TS.projects.foundations.globals.standardResponses.DEFAULT_OK_RESPONSE)
                    return
                }
            } else {
                TS.projects.foundations.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE_OBJECT.write(MODULE_NAME, "[ERROR] initialize -> onInitilized -> It is not possible to not have process dependencies, which means not status dependencies.")
                callBackFunction(TS.projects.foundations.globals.standardResponses.DEFAULT_FAIL_RESPONSE)
                return
            }

            /*For each dependency we will initialize the status report, and load it as part of this initialization process.*/

            let alreadyCalledBack = false
            let loadCount = 0
            let dependenciesToProcess = []
            for (let i = 0; i < thisObject.nodeArray.length; i++) {
                let statusDependency = {
                    dependency: thisObject.nodeArray[i]
                }

                dependenciesToProcess.push(statusDependency)

            }

            for (let i = 0; i < dependenciesToProcess.length; i++) {

                let statusReportModule = TS.projects.foundations.processModules.statusReport.newFoundationsProcessModulesStatusReport(processIndex)

                let statusDependency = dependenciesToProcess[i]
                statusReportModule.initialize(statusDependency.dependency, onInitilized)

                function onInitilized(err) {

                    if (err.result !== TS.projects.foundations.globals.standardResponses.DEFAULT_OK_RESPONSE.result) {
                        if (alreadyCalledBack === false) {
                            TS.projects.foundations.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE_OBJECT.write(MODULE_NAME, "[ERROR] initialize -> onInitilized -> err = " + err.stack)
                            TS.projects.foundations.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE_OBJECT.write(MODULE_NAME, "[ERROR] initialize -> onInitilized -> err.message = " + err.message)
                            alreadyCalledBack = true
                            callBackFunction(err)
                        } else {
                            TS.projects.foundations.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE_OBJECT.write(MODULE_NAME, "[WARN] initialize -> Can not call back because I already did.")
                        }
                        return
                    }

                    TS.projects.foundations.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE_OBJECT.write(MODULE_NAME, "[INFO] initialize -> onInitilized -> Loading Status Report # " + (i + 1))
                    statusReportModule.load(onLoad)
                }

                function onLoad(err) {

                    try {
                        statusReportModule.status = err.message

                        switch (err.message) {
                            case TS.projects.foundations.globals.standardResponses.DEFAULT_OK_RESPONSE.message: {
                                addReport()
                                return
                            }
                            case "Status Report was never created.": {

                                TS.projects.foundations.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE_OBJECT.write(MODULE_NAME, "[WARN] initialize -> onLoad -> err = " + err.stack)
                                TS.projects.foundations.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE_OBJECT.write(MODULE_NAME, "[WARN] initialize -> onLoad -> Report Not Found. -> Status Dependency = " + JSON.stringify(statusDependency.dependency))

                                addReport()
                                return
                            }

                            case "Status Report is corrupt.": {

                                TS.projects.foundations.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE_OBJECT.write(MODULE_NAME, "[WARN] initialize -> onLoad -> err = " + err.stack)
                                TS.projects.foundations.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE_OBJECT.write(MODULE_NAME, "[WARN] initialize -> onLoad -> Report Not Found. -> Status Dependency = " + JSON.stringify(statusDependency.dependency))

                                addReport()
                                return
                            }
                            default:
                                {
                                    TS.projects.foundations.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE_OBJECT.write(MODULE_NAME, "[ERROR] initialize -> onLoad -> Operation Failed.")

                                    if (alreadyCalledBack === false) {
                                        alreadyCalledBack = true
                                        callBackFunction(err)
                                    }
                                    return
                                }
                        }
                    }
                    catch (err) {
                        TS.projects.foundations.globals.processVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).UNEXPECTED_ERROR = err
                        TS.projects.foundations.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE_OBJECT.write(MODULE_NAME, "[ERROR] initialize -> onLoad -> err = " + err.stack)
                        callBackFunction(TS.projects.foundations.globals.standardResponses.DEFAULT_FAIL_RESPONSE)
                    }
                }

                function addReport() {

                    loadCount++

                    let key = statusDependency.dependency.dataMine + "-" + statusDependency.dependency.bot + "-" + statusDependency.dependency.process

                    thisObject.keys.push(key)
                    thisObject.statusReports.set(key, statusReportModule)

                    if (statusReportModule.mainUtility !== undefined) {
                        thisObject.reportsByMainUtility.set(statusReportModule.mainUtility, statusReportModule)
                    }

                    if (loadCount === dependenciesToProcess.length) {
                        if (alreadyCalledBack === false) {
                            alreadyCalledBack = true
                            callBackFunction(TS.projects.foundations.globals.standardResponses.DEFAULT_OK_RESPONSE)
                            return
                        } else {
                            TS.projects.foundations.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE_OBJECT.write(MODULE_NAME, "[WARN] initialize -> addReport -> Can not call back because I already did.")
                        }
                    }
                }
            }

        } catch (err) {
            TS.projects.foundations.globals.loggerVariables.VARIABLES_BY_PROCESS_INDEX_MAP.get(processIndex).BOT_MAIN_LOOP_LOGGER_MODULE_OBJECT.write(MODULE_NAME, "[ERROR] initialize -> err = " + err.stack)
            callBackFunction(TS.projects.foundations.globals.standardResponses.DEFAULT_FAIL_RESPONSE)
        }
    }

    function finalize() {
        thisObject.statusReports.forEach(forEachStatusDependency)
        function forEachStatusDependency(statusDependency) {
            statusDependency.finalize()
        }
        thisObject.statusReports = undefined
        bot = undefined
        thisObject = undefined
    }
}
