
export const loadStoragePlugin = async (storagePlugin) => {
    const pluginModule = await import(storagePlugin)
    return pluginModule
}

const GenericStorage = function(Storage,StorageLocator) {
    let storage, storageLocator
    this.init = function(options){
        storageLocator = new StorageLocator(options)
        storage = new Storage(storageLocator)
        return this
    }

    this.registerStorageLocation = function(location){
        storage.registerStorageLocation(location)
        return this
    }

    this.getResourceName = ( location, resName, resType, options ) => {
        const defopt = { dataType: resType == "keystore" && "pfx" || "pem" } 
        options = { ...defopt, ...options }
        let resourceName 
        if ( typeof storage.getResourceName == "function" ){
            storageLocator.getResourceName( location, resName, resType, options )
        }
        else {
            if ( resType == "key" ){        
                if ( options.resSubtype ){
                    resourceName = `${resName}.${options.resSubtype}.${resType}.${options.dataType}`
                }
                else {
                    throw new Error("you must specify the key resSubtype [public|private]")
                }
            }
            else {
                resourceName = `${resName}.${resType}.${options.dataType}`
            }
        }
        return resourceName
    }
    
    this.storePkiResource = async function( location,resName,resType,data,options ) {
        const resourceName = this.getResourceName(location,resName,resType,options )
        storage.storePkiResource( location,resourceName,data )
    }

    this.dumpPkiResource = async function( location,resName,resType,data,options ) {
        const resourceName = this.getResourceName(location,resName,resType,options )
        return storage.dumpPkiResource( location, resourceName )
    }
}

const loadStorage = async function(storagePlugin){
    const { Storage, StorageLocator } = await loadStoragePlugin(storagePlugin)
    return new GenericStorage(Storage,StorageLocator)
}

export { loadStorage }