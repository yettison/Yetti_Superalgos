function newFoundationsUtilitiesFolders() {
    let thisObject = {
        asymetricalFolderStructureCloning: asymetricalFolderStructureCloning
    }

    return thisObject

    function asymetricalFolderStructureCloning(
        originNode,
        finalDestinationNode,
        originObjectsArrayPropertyName,
        originFoldersArrayPropertyName,
        destinationFoldersArrayPropertyName,
        clonedObjectType,
        destinationFolderType,
        originObjectArrayPropertyName
    ) {
        let newUiObjects = []

        /*
        This function will scan one branch of the workspace, and recreate 
        a similar structure in some other place, based on the parameters
        sent to the function is what types of nodes are going to be mapped
        into which other types.
        */

        recurse(
            originNode,
            finalDestinationNode,
            originObjectsArrayPropertyName,
            originFoldersArrayPropertyName,
            destinationFoldersArrayPropertyName,
            clonedObjectType,
            destinationFolderType,
            originObjectArrayPropertyName
        )

        function recurse(
            originNode,
            destinationNode,
            originObjectsArrayPropertyName,
            originFoldersArrayPropertyName,
            destinationFoldersArrayPropertyName,
            clonedObjectType,
            destinationFolderType,
            originObjectArrayPropertyName
        ) {
            if (originNode === undefined) { return }
            if (destinationNode === undefined) { return }

            /* Now we go down through all the children  of the origin node, recreating at the destination node the same children structure*/
            let schemaDocument = getSchemaDocument(originNode)
            if (schemaDocument === undefined) { return }

            if (schemaDocument.childrenNodesProperties !== undefined) {
                for (let i = 0; i < schemaDocument.childrenNodesProperties.length; i++) {
                    let property = schemaDocument.childrenNodesProperties[i]

                    switch (property.name) {
                        case originObjectsArrayPropertyName: {
                            let originNodePropertyArray = originNode[property.name]
                            for (let m = 0; m < originNodePropertyArray.length; m++) {
                                let originObject = originNodePropertyArray[m]
                                if (originObjectArrayPropertyName === undefined) {
                                    /*
                                        In this first Use Case, we are going to connect each origin object clone
                                        to its origin object counter part.
                                    */
                                    let clonedObject = UI.projects.visualScripting.nodeActionFunctions.uiObjectsFromNodes.addUIObject(destinationNode, clonedObjectType)
                                    UI.projects.visualScripting.nodeActionFunctions.attachDetach.referenceAttachNode(clonedObject, originObject)
                                } else {
                                    /*
                                        In this second Use Case, we are going to connect an inner object that is
                                        inside the origin object at an array. We recognize we have to do this
                                        because we did receive this array property name.
                                    */
                                    let originObjectArray = originObject[originObjectArrayPropertyName]
                                    for (let n = 0; n < originObjectArray.length; n++) {
                                        let originObjectArrayItem = originObjectArray[n]
                                        let clonedObject = UI.projects.visualScripting.nodeActionFunctions.uiObjectsFromNodes.addUIObject(destinationNode, clonedObjectType)
                                        UI.projects.visualScripting.nodeActionFunctions.attachDetach.referenceAttachNode(clonedObject, originObjectArrayItem)
                                        if (clonedObject !== undefined && clonedObject.payload.parentNode === finalDestinationNode) {
                                            newUiObjects.push(clonedObject)
                                        }
                                    }
                                }
                            }
                            break
                        }
                        case originFoldersArrayPropertyName: {
                            let originNodePropertyArray = originNode[property.name]
                            let destinationNodePropertyArray = destinationNode[destinationFoldersArrayPropertyName]
                            for (let m = 0; m < originNodePropertyArray.length; m++) {
                                let originFolder = originNodePropertyArray[m]
                                let found = false
                                let destinationFolder
                                for (let n = 0; n < destinationNodePropertyArray.length; n++) {
                                    destinationFolder = destinationNodePropertyArray[n]
                                    if (originFolder.name === destinationFolder.name) {
                                        found = true
                                    }
                                }
                                if (found === false) {
                                    destinationFolder = UI.projects.visualScripting.nodeActionFunctions.uiObjectsFromNodes.addUIObject(destinationNode, destinationFolderType)
                                    destinationFolder.name = originFolder.name
                                    if (destinationFolder !== undefined && destinationFolder.payload.parentNode === finalDestinationNode) {
                                        newUiObjects.push(destinationFolder)
                                    }
                                }
                                recurse(
                                    originFolder,
                                    destinationFolder,
                                    originObjectsArrayPropertyName,
                                    originFoldersArrayPropertyName,
                                    destinationFoldersArrayPropertyName,
                                    clonedObjectType,
                                    destinationFolderType,
                                    originObjectArrayPropertyName
                                )
                            }
                            break
                        }
                    }
                }
            }
        }

        return newUiObjects
    }
}