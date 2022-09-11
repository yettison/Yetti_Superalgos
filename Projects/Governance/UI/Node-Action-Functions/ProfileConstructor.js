function newGovernanceFunctionLibraryProfileConstructor() {
    let thisObject = {
        buildProfileWallet: buildProfile,
        buildProfileMnemonic: buildProfile,
        installSigningAccounts: installSigningAccounts,
        buildProfileWalletConnect: buildProfileWalletConnect
    }

    return thisObject

    function buildProfile(
        node,
        rootNodes,
        type
    ) {
        /*
        Some validations first...
        */
        let githubUsername = UI.projects.visualScripting.utilities.nodeConfig.loadConfigProperty(node.payload, 'githubUsername')
        let mnemonic = UI.projects.visualScripting.utilities.nodeConfig.loadConfigProperty(node.payload, 'mnemonic')

        if (githubUsername === undefined || githubUsername === "") {
            node.payload.uiObject.setErrorMessage(
                "githubUsername config property missing.",
                UI.projects.governance.globals.designer.SET_ERROR_COUNTER_FACTOR
            )
            return
        }

        if (type === 'mnemonic' && (mnemonic === undefined || mnemonic === "")) {
            node.payload.uiObject.setErrorMessage(
                "mnemonic config property missing.",
                UI.projects.governance.globals.designer.SET_ERROR_COUNTER_FACTOR
            )
            return
        }

        createWallet()

        function createWallet() {
            let params

            /*
            If the user provides a mnemonic then we will get the private key and address from it,
            otherwise, we will create a new private key and address.
            */
            if (mnemonic === undefined || mnemonic === "") {
                params = {
                    method: 'createWalletAccount',
                    entropy: node.id + (new Date()).valueOf()
                }
            } else {
                params = {
                    method: 'mnemonicToPrivateKey',
                    mnemonic: mnemonic
                }
            }

            let url = 'WEB3' // We will access the default Client WEB3 endpoint.

            httpRequest(JSON.stringify(params), url, onResponse)

            function onResponse(err, data) {
                /* Lets check the result of the call through the http interface */
                if (err.result !== GLOBAL.DEFAULT_OK_RESPONSE.result) {
                    node.payload.uiObject.setErrorMessage(
                        'Call via HTTP Interface failed.',
                        UI.projects.governance.globals.designer.SET_ERROR_COUNTER_FACTOR
                    )
                    return
                }

                let response = JSON.parse(data)

                /* Lets check the result of the method call */
                if (response.result !== GLOBAL.DEFAULT_OK_RESPONSE.result) {

                    if (mnemonic === undefined || mnemonic === "") {
                        node.payload.uiObject.setErrorMessage(
                            'Call to WEB3 Server failed. ' + response.error,
                            UI.projects.governance.globals.designer.SET_ERROR_COUNTER_FACTOR
                        )
                        console.log('Call to WEB3 Server failed. ' + response.error)
                        return
                    } else {
                        node.payload.uiObject.setErrorMessage(
                            'Call to WEB3 Server failed. Most likely the Mnemonic provided is not correct or you need to run node setup because a dependency is missing. ' + response.error,
                            UI.projects.governance.globals.designer.SET_ERROR_COUNTER_FACTOR
                        )
                        console.log('Call to WEB3 Server failed. Most likely the Mnemonic provided is not correct or you need to run node setup because a dependency is missing. ' + response.error)
                        return
                    }
                }

                signUserProfileData(response.address, response.privateKey)
            }
        }

        function signUserProfileData(address, privateKey) {

            let request = {
                url: 'WEB3',
                params: {
                    method: "signData",
                    privateKey: privateKey,
                    data: githubUsername
                }
            }

            httpRequest(JSON.stringify(request.params), request.url, onResponse)

            function onResponse(err, data) {
                /* Lets check the result of the call through the http interface */
                if (err.result !== GLOBAL.DEFAULT_OK_RESPONSE.result) {
                    node.payload.uiObject.setErrorMessage(
                        'Call via HTTP Interface failed.',
                        UI.projects.governance.globals.designer.SET_ERROR_COUNTER_FACTOR
                    )
                    return
                }

                let response = JSON.parse(data)

                /* Lets check the result of the method call */
                if (response.result !== GLOBAL.DEFAULT_OK_RESPONSE.result) {
                    node.payload.uiObject.setErrorMessage(
                        'Call to WEB3 Server failed. ' + response.error,
                        UI.projects.governance.globals.designer.SET_ERROR_COUNTER_FACTOR
                    )
                    console.log('Call to WEB3 Server failed. ' + response.error)
                    return
                }
                let userProfile = UI.projects.visualScripting.nodeActionFunctions.uiObjectsFromNodes.addUIObject(
                    node,
                    'User Profile',
                    UI.projects.workspaces.spaces.designSpace.workspace.workspaceNode.rootNodes
                )

                UI.projects.visualScripting.nodeActionFunctions.attachDetach.referenceAttachNode(node, userProfile)
                /*
                Set up a basic profile to start receiving benefits
                */
                let finServices = UI.projects.visualScripting.nodeActionFunctions.uiObjectsFromNodes.addUIObject(userProfile.tokenPowerSwitch, "Financial Programs", userProfile)
                finServices.payload.floatingObject.angleToParent = ANGLE_TO_PARENT.RANGE_180
                finServices.payload.uiObject.menu.internalClick("Add Financial Program")

                let stakeProg = UI.projects.visualScripting.nodeActionFunctions.uiObjectsFromNodes.addUIObject(finServices, "Staking Program", userProfile)
                stakeProg.payload.floatingObject.angleToParent = ANGLE_TO_PARENT.RANGE_180
                stakeProg.payload.uiObject.menu.internalClick("Add Tokens Awarded")

                let liquidProgs = UI.projects.visualScripting.nodeActionFunctions.uiObjectsFromNodes.addUIObject(userProfile.tokenPowerSwitch, "Liquidity Programs", userProfile)
                liquidProgs.payload.floatingObject.angleToParent = ANGLE_TO_PARENT.RANGE_180
                liquidProgs.payload.uiObject.menu.internalClick('Add Liquidity Program')

                let liquidProg = UI.projects.visualScripting.nodeActionFunctions.uiObjectsFromNodes.addUIObject(liquidProgs, "Liquidity Program", userProfile)
                liquidProg.payload.floatingObject.angleToParent = ANGLE_TO_PARENT.RANGE_180
                liquidProg.payload.uiObject.menu.internalClick('Add Tokens Awarded')
                /*
                We store at the User Profile the Signed githubUsername
                */
                UI.projects.visualScripting.utilities.nodeConfig.saveConfigProperty(userProfile.payload, 'signature', response.signature)
                UI.projects.visualScripting.utilities.nodeConfig.saveConfigProperty(node.payload, 'address', address)
                UI.projects.visualScripting.utilities.nodeConfig.saveConfigProperty(node.payload, 'privateKey', privateKey)
                /*
                We set the name of the User Profile as the githubUsername
                */
                userProfile.name = githubUsername
                /*
                We also Install the User Profile as a Plugin, which in turns saves it.
                */
                userProfile.payload.uiObject.menu.internalClick('Install as Plugin')
                userProfile.payload.uiObject.menu.internalClick('Install as Plugin')
                /*
                Show nice message.
                */
                if (mnemonic === undefined || mnemonic === "") {
                    // TODO link to some wallet and setup the token
                    node.payload.uiObject.setInfoMessage(
                        "Profile Private Key has been successfully created. User Profile installed as a plugin and saved. Use the Private Key at a crypto wallet and delete this node once done.",
                        UI.projects.governance.globals.designer.SET_INFO_COUNTER_FACTOR
                    )
                } else {
                    node.config = {}
                    node.payload.uiObject.setInfoMessage(
                        "Mnemonic successfully imported. User Profile installed as a plugin and saved. Your external wallet was sucessfully linked to your profile.",
                        UI.projects.governance.globals.designer.SET_INFO_COUNTER_FACTOR
                    )
                }
            }
        }
    }

    function installSigningAccounts(
        node,
        rootNodes
    ) {
        let secretsFile = {
            secrets: []
        }
        let userProfile = node.payload.referenceParent
        /*
        Get Message to Sign.
        */
        let userProfileHandle = UI.projects.visualScripting.utilities.nodeConfig.loadConfigProperty(userProfile.payload, 'codeName')

        if (userProfileHandle === undefined || userProfileHandle === "") {
            node.payload.uiObject.setErrorMessage(
                "User Profile codeName config property missing.",
                UI.projects.governance.globals.designer.SET_ERROR_COUNTER_FACTOR
            )
            return
        }
        /*
        Checking the reference to the User Profile...
        */
        if (node.payload.referenceParent === undefined) {
            node.payload.uiObject.setErrorMessage(
                "The Profile Contstructor needs to reference your User Profile.",
                UI.projects.governance.globals.designer.SET_ERROR_COUNTER_FACTOR
            )
            return
        }

        let algoTradersPlatformApp = UI.projects.visualScripting.utilities.branches.nodeBranchToArray(userProfile.userApps, 'Algo Traders Platform App')
        let socialTradingDesktopApp = UI.projects.visualScripting.utilities.branches.nodeBranchToArray(userProfile.userApps, 'Social Trading Desktop App')
        let socialTradingMobileApp = UI.projects.visualScripting.utilities.branches.nodeBranchToArray(userProfile.userApps, 'Social Trading Mobile App')
        let socialTradingServerApp = UI.projects.visualScripting.utilities.branches.nodeBranchToArray(userProfile.userApps, 'Social Trading Server App')
        let taskServerApp = UI.projects.visualScripting.utilities.branches.nodeBranchToArray(userProfile.userApps, 'Task Server App')
        let socialTradingBots = UI.projects.visualScripting.utilities.branches.nodeBranchToArray(userProfile.userBots, 'Social Trading Bot')
        let socialPersonas = UI.projects.visualScripting.utilities.branches.nodeBranchToArray(userProfile.socialPersonas, 'Social Persona')
        let p2pNetworkNodes = UI.projects.visualScripting.utilities.branches.nodeBranchToArray(userProfile.p2pNetworkNodes, 'P2P Network Node')

        addSigningAccounts(algoTradersPlatformApp, 'Algo Traders Platform')
        addSigningAccounts(socialTradingDesktopApp, 'Social Trading Desktop App')
        addSigningAccounts(socialTradingMobileApp, 'Social Trading Mobile App')
        addSigningAccounts(socialTradingServerApp, 'Social Trading Server App')
        addSigningAccounts(taskServerApp, 'Task Server App')
        addSigningAccounts(socialTradingBots, 'Social Trading Bot')
        addSigningAccounts(socialPersonas, 'Social Persona')
        addSigningAccounts(p2pNetworkNodes, 'P2P Network Node')

        function addSigningAccounts(nodeArray, targetNodeType) {
            if (nodeArray === undefined) return;
            for (let i = 0; i < nodeArray.length; i++) {
                let currentNode = nodeArray[i]
                addSigningAccount(currentNode, targetNodeType, i + 1)
            }
        }

        function addSigningAccount(
            targetNode,
            targetNodeType,
            targetNodeTypeCount
        ) {
            let params = {
                method: 'createWalletAccount',
                entropy: node.id + (new Date()).valueOf()
            }

            let url = 'WEB3' // We will access the default Client WEB3 endpoint.

            httpRequest(JSON.stringify(params), url, onResponse)

            function onResponse(err, data) {
                /* Lets check the result of the call through the http interface */
                if (err.result !== GLOBAL.DEFAULT_OK_RESPONSE.result) {
                    node.payload.uiObject.setErrorMessage(
                        'Call via HTTP Interface failed.',
                        UI.projects.governance.globals.designer.SET_ERROR_COUNTER_FACTOR
                    )
                    return
                }

                let response = JSON.parse(data)

                /* Lets check the result of the method call */
                if (response.result !== GLOBAL.DEFAULT_OK_RESPONSE.result) {
                    node.payload.uiObject.setErrorMessage(
                        'Call to WEB3 Server failed. ' + response.error,
                        UI.projects.governance.globals.designer.SET_ERROR_COUNTER_FACTOR
                    )
                    console.log('Call to WEB3 Server failed. ' + response.error)
                    return
                }
                signSigningAccountData(response.address, response.privateKey)
            }

            function signSigningAccountData(blockchainAccount, privateKey) {

                let request = {
                    url: 'WEB3',
                    params: {
                        method: "signData",
                        privateKey: privateKey,
                        data: userProfileHandle
                    }
                }

                httpRequest(JSON.stringify(request.params), request.url, onResponse)

                function onResponse(err, data) {
                    /* Lets check the result of the call through the http interface */
                    if (err.result !== GLOBAL.DEFAULT_OK_RESPONSE.result) {
                        node.payload.uiObject.setErrorMessage(
                            'Call via HTTP Interface failed.',
                            UI.projects.governance.globals.designer.SET_ERROR_COUNTER_FACTOR
                        )
                        return
                    }

                    let response = JSON.parse(data)

                    /* Lets check the result of the method call */
                    if (response.result !== GLOBAL.DEFAULT_OK_RESPONSE.result) {
                        node.payload.uiObject.setErrorMessage(
                            'Call to WEB3 Server failed. ' + response.error,
                            UI.projects.governance.globals.designer.SET_ERROR_COUNTER_FACTOR
                        )
                        console.log('Call to WEB3 Server failed. ' + response.error)
                        return
                    }

                    createSigningAccount(response.signature)
                }

                function createSigningAccount(signature) {

                    /*
                    Delete Signing Account if it already exists.
                    */
                    let rootNodes = UI.projects.workspaces.spaces.designSpace.workspace.workspaceNode.rootNodes
                    if (targetNode.signingAccount !== undefined) {
                        UI.projects.visualScripting.nodeActionFunctions.nodeDeleter.deleteUIObject(targetNode.signingAccount, rootNodes)
                    }

                    let signingAccount = UI.projects.visualScripting.nodeActionFunctions.uiObjectsFromNodes.addUIObject(
                        targetNode,
                        'Signing Account',
                        rootNodes,
                        'Governance'
                    )
                    /*
                    Let's get a cool name for this node. 
                    */
                    targetNode.name = targetNodeType + " #" + targetNodeTypeCount
                    let codeName = targetNodeType.replaceAll(' ', '-') + "-" + targetNodeTypeCount
                    let handle = userProfileHandle + '-' + codeName
                    /*
                    We store at the User Profile the Signed userProfileHandle
                    */
                    UI.projects.visualScripting.utilities.nodeConfig.saveConfigProperty(targetNode.payload, 'codeName', codeName)
                    UI.projects.visualScripting.utilities.nodeConfig.saveConfigProperty(signingAccount.payload, 'codeName', codeName)
                    UI.projects.visualScripting.utilities.nodeConfig.saveConfigProperty(signingAccount.payload, 'signature', signature)
                    /*
                    For Social Entities, we will automatically create a default handle
                    */
                    if (targetNode.type === "Social Persona" || targetNode.type === "Social Trading Bot") {
                        UI.projects.visualScripting.utilities.nodeConfig.saveConfigProperty(targetNode.payload, 'handle', handle)
                    }
                    /*
                    Save User Profile Plugin
                    */
                    UI.projects.communityPlugins.nodeActionFunctions.pluginsFunctions.savePluginHierarchy(userProfile)
                    /*
                    Deal with secrets
                    */
                    let secrets = secretsFile.secrets

                    let secret = {
                        nodeId: targetNode.id,
                        nodeName: targetNode.name,
                        nodeType: targetNodeType,
                        nodeCodeName: codeName,
                        signingAccountNodeId: signingAccount.id,
                        blockchainAccount: blockchainAccount,
                        privateKey: privateKey,
                        userProfileHandle: userProfileHandle,
                        userProfileId: userProfile.id
                    }

                    secrets.push(secret)
                    /*
                    Save Signing Accounts Secrets File
                    */
                    httpRequest(JSON.stringify(secretsFile, undefined, 4), 'Secrets/Save-Singing-Accounts-Secrets-File', onResponse)
                    function onResponse(err, data) {
                        /* Lets check the result of the call through the http interface */
                        data = JSON.parse(data)
                        if (err.result != GLOBAL.DEFAULT_OK_RESPONSE.result || data.result != GLOBAL.DEFAULT_OK_RESPONSE.result) {
                            node.payload.uiObject.setErrorMessage(
                                "Signing Accounts Secrets File could not be created.",
                                UI.projects.governance.globals.designer.SET_ERROR_COUNTER_FACTOR
                            )
                        } else {
                            userProfile.payload.uiObject.menu.internalClick('Save Plugin')
                            userProfile.payload.uiObject.menu.internalClick('Save Plugin')
                            /*
                            Show nice message.
                            */
                            node.payload.uiObject.setInfoMessage(
                                "Signing Accounts Secrets File have been sucessfully created.",
                                UI.projects.governance.globals.designer.SET_INFO_COUNTER_FACTOR
                            )
                        }
                    }
                }
            }
        }
    }

    async function buildProfileWalletConnect(
        node,
        rootNodes
    ) {
        let connector, signedMessage
        /*
        Some validations first...
        */
        let githubUsername = UI.projects.visualScripting.utilities.nodeConfig.loadConfigProperty(node.payload, 'githubUsername')

        if (githubUsername === undefined || githubUsername === "") {
            node.payload.uiObject.setErrorMessage(
                "githubUsername config property missing.",
                UI.projects.governance.globals.designer.SET_ERROR_COUNTER_FACTOR
            )
            return
        }

        configWallet()

        async function configWallet() {
            // Connect to a wallet
            // TODO
            // Check that we're in secure mode or MetaMask will behave randomly.
            // One day, when I feel suicidal, look into this buggy mess...
            // https://ethereum.stackexchange.com/a/62217/620

            connectWallet()
            async function connectWallet() {
                // Now we pass the information which providers are available
                const provider = {
                    bridge: "https://bridge.walletconnect.org",
                    qrcodeModal: WalletConnectQRCodeModal.default,
                    qrcodeModalOptions: {
                        desktopLinks: [""]
                    },
                    options: {
                        rpc: {
                            56: 'https://bsc-dataseed.binance.org'
                        },
                        chainId: 56,
                        network: 'binance'
                    }
                }

                connector = new window.WalletConnect.default(provider)
                if (!connector.connected) {
                    connector.createSession()
                }

                connector.on("connect", (error) => {
                    if (error) {
                        throw error
                    }
                    createAccount()
                })

                async function createAccount() {
                    const web3 = new window.Web3()
                    try {
                        const message = [
                            connector.accounts[0],
                            web3.utils.keccak256("\u0019Ethereum Signed Message:\n" + githubUsername.length + githubUsername)
                        ]
                        signedMessage = await connector.signMessage(message)
                        setupProfile(signedMessage, connector.accounts[0], githubUsername)
                    } catch (e) {
                        console.log(e)
                        node.payload.uiObject.setErrorMessage(
                            "Could not create user. Confirm wallet is correctly configured.",
                            UI.projects.governance.globals.designer.SET_ERROR_COUNTER_FACTOR
                        )
                    }
                }
            }
        }
        function setupProfile(signedMessage, account, githubUsername) {
            let request = {
                url: 'WEB3',
                params: {
                    method: "recoverWalletAddress",
                    signature: signedMessage,
                    account: account,
                    data: githubUsername
                }
            }

            httpRequest(JSON.stringify(request.params), request.url, onResponse)

            function onResponse(err, data) {
                /* Lets check the result of the call through the http interface */
                if (err.result !== GLOBAL.DEFAULT_OK_RESPONSE.result) {
                    node.payload.uiObject.setErrorMessage(
                        'Call via HTTP Interface failed.',
                        UI.projects.governance.globals.designer.SET_ERROR_COUNTER_FACTOR
                    )
                    return
                }

                let response = JSON.parse(data)

                /* Lets check the result of the method call */
                if (response.result !== GLOBAL.DEFAULT_OK_RESPONSE.result) {
                    node.payload.uiObject.setErrorMessage(
                        'Call to WEB3 Server failed. ' + response.error,
                        UI.projects.governance.globals.designer.SET_ERROR_COUNTER_FACTOR
                    )
                    console.log('Call to WEB3 Server failed. ' + response.error)
                    return
                }

                let userProfile = UI.projects.visualScripting.nodeActionFunctions.uiObjectsFromNodes.addUIObject(
                    node,
                    'User Profile',
                    UI.projects.workspaces.spaces.designSpace.workspace.workspaceNode.rootNodes
                )

                UI.projects.visualScripting.nodeActionFunctions.attachDetach.referenceAttachNode(node, userProfile)
                /*
                Set up a basic profile to start receiving benefits
                */
                let finServices = UI.projects.visualScripting.nodeActionFunctions.uiObjectsFromNodes.addUIObject(userProfile.tokenPowerSwitch, "Financial Programs", userProfile)
                finServices.payload.floatingObject.angleToParent = ANGLE_TO_PARENT.RANGE_180
                finServices.payload.uiObject.menu.internalClick("Add Financial Program")

                let stakeProg = UI.projects.visualScripting.nodeActionFunctions.uiObjectsFromNodes.addUIObject(finServices, "Staking Program", userProfile)
                stakeProg.payload.floatingObject.angleToParent = ANGLE_TO_PARENT.RANGE_180
                stakeProg.payload.uiObject.menu.internalClick("Add Tokens Awarded")

                let liquidProgs = UI.projects.visualScripting.nodeActionFunctions.uiObjectsFromNodes.addUIObject(userProfile.tokenPowerSwitch, "Liquidity Programs", userProfile)
                liquidProgs.payload.floatingObject.angleToParent = ANGLE_TO_PARENT.RANGE_180
                liquidProgs.payload.uiObject.menu.internalClick('Add Liquidity Program')

                let liquidProg = UI.projects.visualScripting.nodeActionFunctions.uiObjectsFromNodes.addUIObject(liquidProgs, "Liquidity Program", userProfile)
                liquidProg.payload.floatingObject.angleToParent = ANGLE_TO_PARENT.RANGE_180
                liquidProg.payload.uiObject.menu.internalClick('Add Tokens Awarded')
                /*
                We store at the User Profile the Signed githubUsername
                */
                UI.projects.visualScripting.utilities.nodeConfig.saveConfigProperty(userProfile.payload, 'signature', response.signature)
                UI.projects.visualScripting.utilities.nodeConfig.saveConfigProperty(userProfile.payload, 'codeName', response.codeName)
                /*
                We set the name of the User Profile as the githubUsername
                */
                userProfile.name = githubUsername
                /*
                We also Install the User Profile as a Plugin, which in turns saves it.
                */
                userProfile.payload.uiObject.menu.internalClick('Install as Plugin')
                userProfile.payload.uiObject.menu.internalClick('Install as Plugin')
                /*
                Show nice message.
                */
                node.payload.uiObject.setInfoMessage(
                    "Profile has been successfully created. User Profile installed as a plugin and saved. Your Private Key is stored in your wallet.",
                    UI.projects.governance.globals.designer.SET_INFO_COUNTER_FACTOR
                )
                /* Disconnect from wallet */
                disconnect()
                async function disconnect() {
                    await connector.killSession()
                    connector = null
                }
            }
        }
    }
}
