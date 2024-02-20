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
        storageLocator.storageLocation(location)[resourceName] = data
        return Promise.resolve()
    }

    this.dumpPkiResource = async function( location,resourceName ) {
        return Promise.resolve(storageLocator.storageLocation(location)[resourceName])
    }
}

export { Storage, StorageLocator }

