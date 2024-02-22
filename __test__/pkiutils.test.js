import { describe, expect, beforeAll, it } from '@jest/globals'
import { generateCertificate, generateRsaPemKeys, getSubjectKeyIdentifier, generateKeystorePKCS12, generateCaRootCertificate, generatePkiCertificate } from '../lib/pkiutils'
import { CertificateInput, certificateInputHandler, CertificateAttributes, CertificateSubject } from '../lib/commons'
import config  from 'config'

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

    it("generate ca root certificate",async ()=>{
        const caRoot = await generateCaRootCertificate(
            new CertificateSubject("/CN=Root CA/C=IT/ST=Italy/L=Bergamo/O=MyNET/OU=MyNET Root CA server/E=ca-root@mynet.it"),
            "01",
            { keySize: 512 }
        )
            
        expect(caRoot.certificate.data).toContain("BEGIN CERTIFICATE")
    })

    it("generate pki certificate", async()=>{
        const caRoot = await generateCaRootCertificate(
            new CertificateSubject("/CN=Root CA/C=IT/ST=Italy/L=Bergamo/O=MyNET/OU=MyNET Root CA server/E=ca-root@mynet.it"),
            "01",
            { keySize: 512 }
        )
    
        const serverCert = await generatePkiCertificate(
                new CertificateSubject("/CN=server.mynet.it/C=IT/ST=Italy/L=Bergamo/O=MyNET/OU=MyNET Web Server/E=server@mynet.it"),
                "02",caRoot.certificate.data,caRoot.privateKey
            )

        expect(serverCert.csr).toContain("BEGIN CERTIFICATE REQUEST")
        expect(serverCert.certificate.type).toEqual("pem")
        expect(serverCert.certificate.data).toContain("BEGIN CERTIFICATE")

        await expect( generatePkiCertificate(
            new CertificateSubject("/CN=server.mynet.it/C=IT/ST=Italy/L=Bergamo/O=MyNET/OU=MyNET Web Server/E=server@mynet.it"),
            "02",caRoot.certificate.data,caRoot.privateKey,{ certificateOutput: { type: "pkcs12" }}
        ) ).rejects.toThrow('certificate output [pfx|pkcs12] need a password')

        const pfxServerCert = await generatePkiCertificate(
            new CertificateSubject("/CN=server.mynet.it/C=IT/ST=Italy/L=Bergamo/O=MyNET/OU=MyNET Web Server/E=server@mynet.it"),
            "02",caRoot.certificate.data,caRoot.privateKey,{ certificateOutput: { type: "pkcs12", password: "test" }}
        )

        expect(pfxServerCert.certificate.type).toEqual("pkcs12")
        expect(pfxServerCert.certificate.data).toBeInstanceOf(Buffer)

    })
})