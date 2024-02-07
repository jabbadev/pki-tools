import { mkdir,writeFile,readFile,readdir } from 'node:fs/promises'

const StorageLocator = function(options){
    const locations = new Map()

    this.registerStorageLocation = (location) => locations.set(location,{})

    this.storageLocation = (location) => locations.get(location)
}

const Storage = function(storageLocator) {

    this.registerStorageLocation = (location) => {
        storageLocator.registerStorageLocation(location)
    }

    this.storePkiResource = async function( location,pemData,resName,resType,resSubtype ) {
        console.log('store resource', storageLocator.storageLocation(location),`${pemData.substring(0,25)} ... ${pemData.slice(-25)}`,resName,resType,resSubtype)

        let key = `${resName}.${resType}.pem`
        if ( resSubtype ){
            key = `${resName}.${resSubtype}.${resType}.pem`
        }
        storageLocator.storageLocation(location)[key] = pemData
        return Promise.resolve()
    }

    this.dumpPkiResource = async function( location,resName,resType,resSubtype ) {
        console.log('dump resource', storageLocator.storageLocation(location),resName,resType,resSubtype)

        let key = `${resName}.${resType}.pem`
        if ( resSubtype ){
            key = `${resName}.${resSubtype}.${resType}.pem`
        }
        return Promise.resolve(storageLocator.storageLocation(location)[key])
    }
}

export { Storage, StorageLocator }

