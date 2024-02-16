
import { describe, expect, beforeAll, it } from '@jest/globals'
import { Storage, StorageLocator } from '../lib/map-storage'

let storageLocator, mapStorage 
beforeAll(() => {
    storageLocator = new StorageLocator()
    mapStorage = new Storage(storageLocator)
})

describe("test simple in memory sorage Map",()=>{
    it("Error data location unregistered",() => {
        return expect(mapStorage.storePkiResource("ca","ca-server.cert.pem",
                                                  "-----BEGIN CERTIFICATE-----\r\nMIIFtzCCA5+gAwIBAgIBAjANBgkqhkiG9w0BAQUFADCBlzEVMBMGA1UEAxMMY2Eu\r\n-----END CERTIFICATE-----"))
                                                  .rejects.toBeInstanceOf(TypeError)
        
    })
    it("store pki resource", async ()=>{
        mapStorage.registerStorageLocation("ca")
        await expect(mapStorage.storePkiResource("ca","ca-server.cert.pem",
                                "-----BEGIN CERTIFICATE-----\r\nMIIFtzCCA5+gAwIBAgIBAjANBgkqhkiG9w0BAQUFADCBlzEVMBMGA1UEAxMMY2Eu\r\n-----END CERTIFICATE-----",))
              .resolves.toBeUndefined()
        
        await expect(mapStorage.dumpPkiResource("ca","ca-server.cert.pem")).resolves.toEqual("-----BEGIN CERTIFICATE-----\r\nMIIFtzCCA5+gAwIBAgIBAjANBgkqhkiG9w0BAQUFADCBlzEVMBMGA1UEAxMMY2Eu\r\n-----END CERTIFICATE-----")
    })
})