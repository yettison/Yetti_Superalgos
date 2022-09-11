exports.newNetworkModulesAppBootstrapingProcess = function newNetworkModulesAppBootstrapingProcess() {
    /*
    This module is useful for all Apps that needs to operate with the P2P Network. 
    
    This process will:
    
    1. Load App Schemas.
    2. Load User Profiles
    3. Identify all P2P Network Nodes.
    4. Identify the node representing the Identity of the current running App.
    5. Setting up Storage Containers.
    6. TODO: Calculate Profiles Rankings.    

    */
    let thisObject = {
        pullUserProfiles: undefined,
        userAppCodeName: undefined,
        p2pNetworkClientIdentity: undefined,
        initialize: initialize,
        run: run
    }
    return thisObject

    async function initialize(userAppCodeName, p2pNetworkClientIdentity, pullUserProfiles) {
        thisObject.pullUserProfiles = pullUserProfiles
        thisObject.userAppCodeName = userAppCodeName
        thisObject.p2pNetworkClientIdentity = p2pNetworkClientIdentity
        await run()
        if (thisObject.pullUserProfiles === true) {
            setInterval(run, 60000 * 5)
        }
    }

    async function run() {
        SA.projects.network.globals.memory.arrays.P2P_NETWORK_NODES = []
        if (thisObject.pullUserProfiles === true) {
            await pullProfiles()
        }
        await reloadAll()
    }

    async function pullProfiles() {
        const simpleGit = SA.nodeModules.simpleGit
        options = {
            baseDir: SA.nodeModules.path.join(global.env.PATH_TO_PLUGINS, 'Governance'),
            binary: 'git',
            maxConcurrentProcesses: 6,
        }
        git = simpleGit(options)
        await git.pull('upstream', 'develop')
    }

    async function reloadAll() {

        await loadUserP2PNetworksPlugins()
        await loadUserProfilesPlugins()

        setReferenceParentForNodeHierearchy(
            SA.projects.network.globals.memory.maps.P2P_NETWORKS_BY_ID
        )

        setReferenceParentForNodeHierearchy(
            SA.projects.network.globals.memory.maps.USER_PROFILES_BY_ID
        )

        extractInfoFromUserProfiles()

        if (thisObject.p2pNetworkClientIdentity.node === undefined) {
            throw ('The Network Client Identity does not match any node at User Profiles Plugins.')
        }

        setupPermissionedNetwork()

        async function loadUserP2PNetworksPlugins() {
            /*
            P2P Networks are plugins of the Network Project.        
            */
            let pluginFileNames = await SA.projects.communityPlugins.utilities.plugins.getPluginFileNames(
                'Network',
                'P2P-Networks'
            )

            for (let i = 0; i < pluginFileNames.length; i++) {
                let pluginFileName = pluginFileNames[i]

                let pluginFileContent = await SA.projects.communityPlugins.utilities.plugins.getPluginFileContent(
                    'Network',
                    'P2P-Networks',
                    pluginFileName
                )

                let p2pNetworkPlugin = JSON.parse(pluginFileContent)

                let p2pNetwork = SA.projects.communityPlugins.utilities.nodes.fromSavedPluginToInMemoryStructure(
                    p2pNetworkPlugin
                )

                if (p2pNetwork === undefined) {
                    console.log((new Date()).toISOString(), '[WARN] P2P Network Plugin could not be loadded into memory: ' + p2pNetworkPlugin.name)
                    continue
                }

                SA.projects.network.globals.memory.maps.P2P_NETWORKS_BY_ID.set(p2pNetwork.id, p2pNetwork)
            }
        }

        async function loadUserProfilesPlugins() {
            /*
            User Profiles are plugins of the Governance System. Besides the info they carry, we also 
            need to get the blockchain account for each one in order to later calculate their ranking.
            */
            let pluginFileNames = await SA.projects.communityPlugins.utilities.plugins.getPluginFileNames(
                'Governance',
                'User-Profiles'
            )

            for (let i = 0; i < pluginFileNames.length; i++) {
                let pluginFileName = pluginFileNames[i]

                let pluginFileContent = await SA.projects.communityPlugins.utilities.plugins.getPluginFileContent(
                    'Governance',
                    'User-Profiles',
                    pluginFileName
                )
                let userProfilePlugin = JSON.parse(pluginFileContent)
                /*
                Here we will turn the saved plugin into an in-memory node structure with parent nodes and reference parents.
                */
                let userProfile = SA.projects.communityPlugins.utilities.nodes.fromSavedPluginToInMemoryStructure(
                    userProfilePlugin
                )

                if (userProfile === undefined) {
                    console.log((new Date()).toISOString(), '[WARN] User Profile Plugin could not be loadded into memory: ' + userProfilePlugin.name)
                    continue
                }

                SA.projects.network.globals.memory.maps.USER_PROFILES_BY_ID.set(userProfile.id, userProfile)
            }
        }

        async function setReferenceParentForNodeHierearchy(nodeHierearchyMap) {
            let mapArray = Array.from(nodeHierearchyMap)
            for (let i = 0; i < mapArray.length; i++) {
                let mapArrayItem = mapArray[i][1]

                SA.projects.communityPlugins.utilities.nodes.fromInMemoryStructureToStructureWithReferenceParents(
                    mapArrayItem
                )
            }
        }

        function extractInfoFromUserProfiles() {

            let userProfiles = Array.from(SA.projects.network.globals.memory.maps.USER_PROFILES_BY_ID)

            for (let i = 0; i < userProfiles.length; i++) {
                let userProfile = userProfiles[i][1]
                let signatureObject = userProfile.config.signature
                let web3 = new SA.nodeModules.web3()
                userProfile.blockchainAccount = web3.eth.accounts.recover(signatureObject)

                let ranking = 0 // TODO: read the blockchain balance and transactions from the Treasury Account to calculate the profile ranking.

                loadSigningAccounts()
                loadStorageContainers()

                function loadSigningAccounts() {
                    /*
                    For each User Profile Plugin, we will check all the Signing Accounts
                    and load them in memory to easily find them when needed.

                    Some of these Signing Accounts will belong to P2P Network Nodes, so 
                    we will also load them to have them accesible.

                    One of these Signing Account will be our own identity as a Network Client.
                    */
                    let signingAccounts = SA.projects.visualScripting.utilities.nodeFunctions.nodeBranchToArray(userProfile, 'Signing Account')

                    for (let j = 0; j < signingAccounts.length; j++) {

                        let signingAccount = signingAccounts[j]
                        let networkClient = signingAccount.parentNode
                        let config = signingAccount.config
                        let signatureObject = config.signature
                        let web3 = new SA.nodeModules.web3()
                        let blockchainAccount = web3.eth.accounts.recover(signatureObject)
                        /*
                        We will build a map of user profiles by blockchain account that we will need when we receive messages signed
                        by different network clients.
                        */
                        SA.projects.network.globals.memory.maps.USER_PROFILES_BY_BLOKCHAIN_ACCOUNT.set(blockchainAccount, userProfile)

                        loadP2PNetworkNodes()
                        setupNetworkClientIdentity()

                        function loadP2PNetworkNodes() {
                            /*
                            If the Signing Account is for a P2P node, we will add the node to the array of available nodes at the p2p network.
                            */
                            if (
                                networkClient.type === "P2P Network Node" &&
                                networkClient.config !== undefined
                            ) {
                                if (networkClient.config.host === undefined) {
                                    return
                                }

                                try {
                                    let p2pNetworkNode = SA.projects.network.modules.p2pNetworkNode.newNetworkModulesP2PNetworkNode()
                                    p2pNetworkNode.initialize(
                                        networkClient,
                                        userProfile,
                                        blockchainAccount
                                    )
                                    SA.projects.network.globals.memory.arrays.P2P_NETWORK_NODES.push(p2pNetworkNode)
                                } catch (err) {
                                    console.log((new Date()).toISOString(), '[WARN] A configured Network Node was ignored becuase when analized, something was wrong with its configuration. -> err = ' + err)
                                }

                            }
                        }

                        function setupNetworkClientIdentity() {
                            /*
                            At the governance system, you might declare that you have for instance
                            3 P2P Network Nodes. They way to tell this particular instance which 
                            one of the 3 it is, is by configuring at the Environment.js which one
                            I want it to be by putting there the codeName of the P2P Network node 
                            I want this to be. With that codename we then get from the Secrets file
                            the NodeId of the P2P Network node defined at the User Profile, and once 
                            we match it with a node of the user profiles we are scanning, then we
                            store that node as our P2P Network Client Identity. 
                            */
                            if (SA.secrets.signingAccountSecrets.map.get(thisObject.userAppCodeName) === undefined) {
                                throw ('Bad Configuration. Could not find any signing account node based on the configured thisObject.userAppCodeName = ' + thisObject.userAppCodeName)
                            }
                            if (
                                networkClient.id === SA.secrets.signingAccountSecrets.map.get(thisObject.userAppCodeName).nodeId
                            ) {
                                thisObject.p2pNetworkClientIdentity.initialize(
                                    networkClient,
                                    userProfile,
                                    blockchainAccount
                                )
                            }
                        }
                    }
                }

                function loadStorageContainers() {
                    /*
                    Identify Storage Containers of each profiles and load them to memory.
                    */
                    let storageContainers

                    storageContainers = SA.projects.visualScripting.utilities.nodeFunctions.nodeBranchToArray(userProfile.userStorage, 'Github Storage Container')
                    addContainersToMemoryMap()
                    storageContainers = SA.projects.visualScripting.utilities.nodeFunctions.nodeBranchToArray(userProfile.userStorage, 'Superalgos Storage Container')
                    addContainersToMemoryMap()

                    function addContainersToMemoryMap() {
                        for (let j = 0; j < storageContainers.length; j++) {
                            let storageContainer = storageContainers[j]
                            SA.projects.network.globals.memory.maps.STORAGE_CONTAINERS_BY_ID.set(storageContainer.id, storageContainer)
                        }
                    }
                }
            }
        }

        function setupPermissionedNetwork() {
            /*
            If we are a P2P Network Node that is part of a Permissioned P2P Network,
            then we will need to build a Map with all User Profiles that have access
            to this network, in order to use it later to enforce these permissions
            at the Network Interfaces.
            */
            if (thisObject.p2pNetworkClientIdentity.node.type !== "P2P Network Node") { return }
            if (thisObject.p2pNetworkClientIdentity.node.p2pNetworkReference.referenceParent.type !== "Permissioned P2P Network") { return }

            let petmissionGrantedArray = SA.projects.visualScripting.utilities.nodeFunctions.nodeBranchToArray(
                thisObject.p2pNetworkClientIdentity.node.p2pNetworkReference.referenceParent,
                'Permission Granted'
            )

            for (let i = 0; i < petmissionGrantedArray.length; i++) {
                let permissionGranted = petmissionGrantedArray[i]
                if (permissionGranted.referenceParent === undefined) { continue }
                SA.projects.network.globals.memory.maps.PERMISSIONS_GRANTED_BY_USER_PRFILE_ID.set(permissionGranted.referenceParent.id, permissionGranted.referenceParent)
            }
        }
    }
}