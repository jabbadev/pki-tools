
export const loadStoragePlugin = async (storageType) => {
    let storageModule
    if ( storageType  === "fs" ){
        storageModule =  await import('./fs-storage.js');
    }
    return storageModule
}

const GenericStorage = function(Storage,StorageLocator) {
    let storage
    this.init = function(options){
        storage = new Storage(new StorageLocator(options))
        return this
    }

    this.registerStorageLocation = function(location){
        storage.registerStorageLocation(location)
        return this
    }
    
    this.storePkiResource = async function( location,pemData,resName,resType,resSubtype ){
        storage.storePkiResource( location,pemData,resName,resType,resSubtype )
    }

    this.dumpPkiResource = async function( location,pemData,resName,resType,resSubtype ){
        return storage.dumpPkiResource( location,pemData,resName,resType,resSubtype )
    }
}

const loadStorage = async function(storageType){
    const { Storage, StorageLocator } = await loadStoragePlugin(storageType)
    return new GenericStorage(Storage,StorageLocator)
}

export { loadStorage }