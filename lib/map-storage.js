const StorageLocator = function(options){
    const locations = new Map()

    this.registerStorageLocation = (location) => locations.set(location,{})

    this.storageLocation = (location) => locations.get(location)
}

const Storage = function(storageLocator) {

    this.registerStorageLocation = (location) => {
        storageLocator.registerStorageLocation(location)
    }

    this.storePkiResource = async function( location,resourceName,data ) {
        console.log(`dump resource in the location [${location}] with key [${resourceName}] and value [${data.substring(0,25)} ... ${data.slice(-25)}]`)
        
        storageLocator.storageLocation(location)[resourceName] = data
        return Promise.resolve()
    }

    this.dumpPkiResource = async function( location,resourceName ) {
        console.log(`dump resource in the location [${location}] with key [${resourceName}]`)
        return Promise.resolve(storageLocator.storageLocation(location)[resourceName])
    }
}

export { Storage, StorageLocator }

