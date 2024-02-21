import { describe, expect, test, it, beforeAll } from '@jest/globals'
import { generateRsaPemKeys, generateCertificate } from '../lib/pkiutils.js'
import { certificateInputHandler, CertificateSubject } from '../lib/commons.js'

const initializeTls = () => new Promise(async (resolve,reject) => {
    const keys = await generateRsaPemKeys({bits: 512 })
    /*const caCert = await generateCertificate(certificateInputHandler(
        new CertificateInput()
            .extensions([{ 
              name: "basicConstraints", 
              cA: true, 
              critical: true 
            },{
              name: 'subjectKeyIdentifier',
              subjectKeyIdentifier: spki
            }])
            .publicKey(caKeys.publicKey)
            .privateKey(caKeys.privateKey)
            .validityYears(10)
            .serialNumber("01")
            .subject(new CertificateAttributes(config.get('ca.subject')))
            .issuer(new CertificateAttributes(config.get('ca.subject'))))
)
        new CertificateSubject("/commonName=Root CA/C=IT/ST=Italy/L=Bergamo/O=MyNET/OU=MyNET Root CA server/E=ca-root@mynet.it")
    ))
    console.log(caCert)*/

    resolve()
})

describe("test a tls server with PKI certificate",()=>{

    beforeAll(() => {
        return initializeTls()
    })

    it("exec client request",()=>{
        expect(true).toBeTruthy()
    })
})

