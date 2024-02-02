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

    this.storePkiResource = async function( location,pemData,resName,resType,resSubtype ){
        console.log('store resorce', storageLocator.storageLocation(location),pemData,resName,resType,resSubtype)

        let fileName = `${storageLocator.storageLocation(location)}/${resName}.${resType}.pem`
        if ( resSubtype ){
            fileName = `${storageLocator.storageLocation(location)}/${resName}.${resSubtype}.${resType}.pem`
        }
        return writeFile(fileName,pemData)
    }
}

export { Storage, StorageLocator }

