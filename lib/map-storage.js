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
        let key = `${resName}.${resType}.pem`
        if ( resSubtype ){
            key = `${resName}.${resSubtype}.${resType}.pem`
        }
        console.log(`dump resource in the location [${location}] with key [${key}] and value [${pemData.substring(0,25)} ... ${pemData.slice(-25)}]`)
        
        storageLocator.storageLocation(location)[key] = pemData
        return Promise.resolve()
    }

    this.dumpPkiResource = async function( location,resName,resType,resSubtype ) {
        let key = `${resName}.${resType}.pem`
        if ( resSubtype ){
            key = `${resName}.${resSubtype}.${resType}.pem`
        }
        console.log(`dump resource in the location [${location}] with key [${key}]`)
        return Promise.resolve(storageLocator.storageLocation(location)[key])
    }
}

export { Storage, StorageLocator }

