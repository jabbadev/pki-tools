import { describe, expect, beforeAll, it } from '@jest/globals'
import { generateCertificate, generateRsaPemKeys, getSubjectKeyIdentifier, generateKeystorePKCS12, generateCaRootCertificate, generatePkiCertificate } from '../lib/pkiutils'
import { CertificateInput, certificateInputHandler, CertificateSubject } from '../lib/commons'
import config  from 'config'

let keys, secKeys, forgeKeys, forgeSecKeys
const generateKeys = () => {
    return Promise.all([
        generateRsaPemKeys({ bits: 512, useForge: true }).then( keys => {
            expect(keys.privateKey).toContain('-----BEGIN RSA PRIVATE KEY-----')
            forgeKeys = keys
        }),
        generateRsaPemKeys({ bits: 512, useForge: true, password: "test" }).then( keys => {
            expect(keys.privateKey).toContain('-----BEGIN ENCRYPTED PRIVATE KEY-----')
            forgeSecKeys = keys
        })
    ])
}

beforeAll(()=>{
    return generateKeys()
})

describe("generate RSA PEM keys",()=>{

    it("generate pkcs12 keystore",async ()=>{
        const caCert = await generateCertificate(certificateInputHandler(
            new CertificateInput()
                .extensions([{ name: "basicConstraints", cA: true, critical: true },
                             { name: 'subjectKeyIdentifier', subjectKeyIdentifier: getSubjectKeyIdentifier(forgeKeys.publicKey) } ])
                .publicKey(forgeKeys.publicKey)
                .privateKey(forgeKeys.privateKey)
                .validityYears(10)
                .serialNumber("01")
                .subject(new CertificateSubject(config.get('ca.subject')))
                .issuer(new CertificateInput(config.get('ca.subject'))))
        )
        expect(caCert).toMatch('-----BEGIN CERTIFICATE-----')

        const keyStore = generateKeystorePKCS12(forgeKeys.privateKey,caCert,"password")
    })

    it("generate ca root certificate",async ()=>{
        const caRoot = await generateCaRootCertificate(
            new CertificateSubject("/CN=Root CA/C=IT/ST=Italy/L=Bergamo/O=MyNET/OU=MyNET Root CA server/E=ca-root@mynet.it"),
            "01",
            { keys: forgeKeys }
        )
            
        expect(caRoot.certificate.data).toContain("BEGIN CERTIFICATE")
    })

    it("generate pki certificate", async()=>{
        const caRoot = await generateCaRootCertificate(
            new CertificateSubject("/CN=Root CA/C=IT/ST=Italy/L=Bergamo/O=MyNET/OU=MyNET Root CA server/E=ca-root@mynet.it"),
            "01",
            { keys: forgeKeys }
        )
    
        const serverCert = await generatePkiCertificate(
                new CertificateSubject("/CN=server.mynet.it/C=IT/ST=Italy/L=Bergamo/O=MyNET/OU=MyNET Web Server/E=server@mynet.it"),
                "02",caRoot.certificate.data,caRoot.privateKey,
                { keys: forgeKeys }
            )

        expect(serverCert.csr).toContain("BEGIN CERTIFICATE REQUEST")
        expect(serverCert.certificate.type).toEqual("pem")
        expect(serverCert.certificate.data).toContain("BEGIN CERTIFICATE")

        await expect( generatePkiCertificate(
            new CertificateSubject("/CN=server.mynet.it/C=IT/ST=Italy/L=Bergamo/O=MyNET/OU=MyNET Web Server/E=server@mynet.it"),
            "02",caRoot.certificate.data,caRoot.privateKey,{ certificateOutput: { keys: forgeKeys, type: "pkcs12" }}
        ) ).rejects.toThrow('certificate output [pfx|pkcs12] need a password')

        const pfxServerCert = await generatePkiCertificate(
            new CertificateSubject("/CN=server.mynet.it/C=IT/ST=Italy/L=Bergamo/O=MyNET/OU=MyNET Web Server/E=server@mynet.it"),
            "02",caRoot.certificate.data,caRoot.privateKey,{ certificateOutput: { keys: forgeKeys, type: "pkcs12", password: "test" }}
        )

        expect(pfxServerCert.certificate.type).toEqual("pkcs12")
        expect(pfxServerCert.certificate.data).toBeInstanceOf(Buffer)

    })
})