import { describe, expect, beforeAll, it } from '@jest/globals'
import { loadStorage } from '../lib/storage'
import { generateCertificate, genForgeKeyPairPEM, generateRsaPemKeys, getSubjectKeyIdentifier, generateKeystorePKCS12, generateCaRootCertificate } from '../lib/pkiutils'
import { CertificateInput, certificateInputHandler, CertificateAttributes, CertificateSubject } from '../lib/commons'
import config  from 'config'

let pkiMapStorage, caCertReady, serverCertReady, clientCertReady

describe("generate RSA PEM keys",()=>{

    it("generate keys", () => {
        return generateRsaPemKeys().then( keys => {
            expect(keys.privateKey).toMatch('-----BEGIN PRIVATE KEY-----')
        })
    })

    it("generate 1024 keys",async () => {
        await expect(generateRsaPemKeys({bits: 1024 })).resolves.toBeInstanceOf(Object)
    })

    it("generate pkcs12 keystore",async ()=>{
        const keys = await generateRsaPemKeys({bits: 512 })
        const caCert = await generateCertificate(certificateInputHandler(
            new CertificateInput()
                .extensions([{ name: "basicConstraints", cA: true, critical: true },
                             { name: 'subjectKeyIdentifier', subjectKeyIdentifier: getSubjectKeyIdentifier(keys.publicKey) } ])
                .publicKey(keys.publicKey)
                .privateKey(keys.privateKey)
                .validityYears(10)
                .serialNumber("01")
                .subject(new CertificateAttributes(config.get('ca.subject')))
                .issuer(new CertificateAttributes(config.get('ca.subject'))))
        )
        expect(caCert).toMatch('-----BEGIN CERTIFICATE-----')

        const keyStore = generateKeystorePKCS12(keys.privateKey,caCert,"password")
    })

    it("generate ca root certificate",()=>{
        const caRootCert = generateCaRootCertificate(
            new CertificateSubject("/CN=Root CA/C=IT/ST=Italy/L=Bergamo/O=MyNET/OU=MyNET Root CA server/E=ca-root@mynet.it"),
            "01",
            { keySize: 512 }
        ).then((certData)=>{
            expect(certData.certificate).toContain("BEGIN CERTIFICATE")
        })

    })
})