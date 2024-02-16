import { mkdir,writeFile,readFile,readdir } from 'node:fs/promises'

const StorageLocator = function(options){
    const basePath = options.basePath,
    locations = {}

    this.registerStorageLocation = (location) => locations[location] = `${basePath}/${location}`

    this.storageLocation = (location) => locations[location]
}

const Storage = function(storageLocator) {

    this.registerStorageLocation = (location) => {
        storageLocator.registerStorageLocation(location)
    }

    this.storePkiResource = async function( location,resourceName,data ){
        console.log('store resource', storageLocator.storageLocation(location),resourceName)
        const fileName = `${storageLocator.storageLocation(location)}/${resourceName}`
        return writeFile(fileName,data)
    }
}

export { Storage, StorageLocator }

