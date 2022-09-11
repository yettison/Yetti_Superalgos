function newWorkspacesNodeActionSwitch() {

    let thisObject = {
        executeAction: executeAction,
        initialize: initialize,
        finalize: finalize
    }

    return thisObject

    function finalize() {

    }

    function initialize() {
        /* Nothing to initialize since a Function Library does not hold any state. */
    }

    async function executeAction(action) {
        switch (action.name) {
            case 'Add Missing Workspace Projects':
                {
                    let newUiObjects = await UI.projects.workspaces.nodeActionFunctions.workspaceFunctions.addMissingWorkspaceProjects(action.node, action.rootNodes)

                    if (newUiObjects !== undefined && newUiObjects.length > 0) {
                        let historyObject = {
                            action: action,
                            newUiObjects: newUiObjects,
                            nodeClones: []
                        }
                        UI.projects.workspaces.spaces.designSpace.workspace.undoStack.push(historyObject)
                        UI.projects.workspaces.spaces.designSpace.workspace.redoStack = []
                        UI.projects.workspaces.spaces.designSpace.workspace.buildSystemMenu()
                    }
                }
                break
            case 'Add Specified Project':
                {
                    let historyObject = {
                        action: action,
                        nodeClones: []
                    }
                    /* we’re passing the historyObject along since the action involves an event handled elsewhere */
                    UI.projects.workspaces.nodeActionFunctions.workspaceFunctions.addSpecifiedWorkspaceProject(action.node, action.rootNodes, historyObject)
                }
                break
            case 'Check For Missing References':
                {
                    UI.projects.workspaces.nodeActionFunctions.workspaceFunctions.checkForMissingReferences(action.rootNodes)
                }
                break
            case 'Fix Missing References':
                {
                    UI.projects.workspaces.nodeActionFunctions.workspaceFunctions.fixMissingReferences(action.rootNodes)
                }
                break
            default: {
                console.log("[WARN] Action sent to Workspaces Node Action Switch does not belong here. Verify at the App Schema file of the node that triggered this action that the actionProject is pointing to the right project. -> Action = " + action.name + " -> Action Node Name = " + action.node.name)
            }
        }
    }
}
