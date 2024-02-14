import { describe, expect, beforeAll, it } from '@jest/globals'
import { loadStorage } from '../lib/storage'
import { generateKeyPair, generateCertificate, genForgeKeyPairPEM } from '../lib/pkiutils'
import { CertificateInput, certificateInputHandler, CertificateAttributes } from '../lib/commons'
import config  from 'config'

let pkiMapStorage, caCertReady, serverCertReady, clientCertReady

const setupPki = async () => {
    //const {  privateKey, publicKey } = await genForgeKeyPairPEM()
    const caKeys = await generateKeyPair()
    const caCert = await generateCertificate(certificateInputHandler(
        new CertificateInput()
            .publicKey(caKeys.publicKey)
            .privateKey(caKeys.privateKey)
            .validityYears(10)
            .serialNumber("01")
            .subject(new CertificateAttributes(config.get('ca.subject')))
            .issuer(new CertificateAttributes(config.get('ca.subject'))))
    )

    expect(caCert.split("\r\n")[0]).toEqual('-----BEGIN CERTIFICATE-----')

    const serverKeys = await generateKeyPair()
    const serverCsr = await generateCSR({ subject: new CertificateAttributes(config.get('server.subject')) ,
                                          attributes: config.get("server.attributes"),
                                          privateKey: serverKeys.privateKey, publicKey: serverKeys.publicKey })

    expect(serverCsr.split("\r\n")[0]).toEqual('-----BEGIN CERTIFICATE-----')
    

    return Promise.resolve(serverCsr.split("\r\n")[0])
}

beforeAll(async () => {
    pkiMapStorage = await loadStorage("map")
    pkiMapStorage.init()
        .registerStorageLocation("ca")
        .registerStorageLocation("servers")
        .registerStorageLocation("clients")
})

describe("generate pki certificates",()=>{
    it("generate ca scertificate", async ()=>{
        await expect(setupPki()).resolves.toEqual('-----BEGIN CERTIFICATE-----')
    })
})