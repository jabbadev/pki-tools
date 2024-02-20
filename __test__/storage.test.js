import { loadStoragePlugin, loadStorage} from "../lib/storage"
import { describe, expect, test, it } from '@jest/globals'

describe("Load storage plugin",()=>{
    it("workflow to store a pki resource", async ()=>{
        const storage = await loadStorage('storage-plugins/map-storage')
        storage.init()
               .registerStorageLocation("ca-location")
               .registerStorageLocation("server-location")
               .storePkiResource("ca-location","ca-server","key","-----BEGIN PUBLIC KEY-----\r\nMIIFtzCCA5\r\n-----END PUBLIC KEY-----",{ resSubtype: "public"})
               .then(()=>expect(true).toBeTruthy())
    })

    it("workflow to dump a pki resource", async ()=>{
        const storage = await loadStorage('storage-plugins/map-storage')
        storage.init()
               .registerStorageLocation("ca-location")
               .registerStorageLocation("server-location")
               .storePkiResource("ca-location","ca-server","key","-----BEGIN PUBLIC KEY-----\r\nMIIFtzCCA5\r\n-----END PUBLIC KEY-----",{ resSubtype: "public"})
               .then(()=>{
                    storage.dumpPkiResource("ca-location","ca-server","key",{ resSubtype: "public"}).then((data)=>{
                        expect(data).toEqual("-----BEGIN PUBLIC KEY-----\r\nMIIFtzCCA5\r\n-----END PUBLIC KEY-----")
                    })
               })
    })

    it("error on unregistered location", async ()=>{
        const storage = await loadStorage('storage-plugins/map-storage')
        storage.init()
        
        storage.storePkiResource("ca-location","ca-server","key","-----BEGIN PUBLIC KEY-----\r\nMIIFtzCCA5\r\n-----END PUBLIC KEY-----",{ resSubtype: "public"})
        .catch(error=> {
            expect(error.message).toContain('Location not registered') 
        })
    })

    it("advanced storage plugin implementation",async ()=>{
        const externalStorage = {}
        const storage = await loadStorage('storage-plugins/external-storage')
        storage.init(externalStorage)
               .registerStorageLocation("pki")


        Promise.all([
            storage.storePkiResource("pki","server","key","-----BEGIN PUBLIC KEY-----\r\nMIIFtzCCA5\r\n-----END PUBLIC KEY-----",{resSubtype: "public"}),
            storage.storePkiResource("pki","server","key","-----BEGIN PRIVATE KEY-----\r\nMIIFtzCCA5\r\n-----END PRIVATE KEY-----",{resSubtype: "private"}),
            storage.storePkiResource("pki","server","cert","-----BEGIN CERTIFICATE-----\r\nMIIFtzCCA5+gAMMY2Eu\r\n-----END CERTIFICATE-----")
        ])
        .then(()=>{
                    expect(externalStorage.pki.server.key.public.data).toEqual("-----BEGIN PUBLIC KEY-----\r\nMIIFtzCCA5\r\n-----END PUBLIC KEY-----")
                    expect(externalStorage.pki.server.cert.data).toContain("CERTIFICATE")
        })

    })


})