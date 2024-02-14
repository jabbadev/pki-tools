
import { generateKeyPair, generateCertificate, generateCSR, generateCertificateFromCsr } from './lib/pkiutils.js'
import config  from 'config'

import { CertificateAttributes, CertificateInput, CsrAttributes, certificateInputHandler } from './lib/commons.js';
import { loadStorage } from './lib/storage.js';

const storage = await loadStorage("fs")
storage.init({basePath: "/home/development/toolbox/pki/pki"})
       .registerStorageLocation("ca")
       .registerStorageLocation("servers")
       
const { privateKey, publicKey } = await generateKeyPair()

await Promise.all(
    [storage.storePkiResource("ca",privateKey,"jabbadev-ca","key","private"),
    storage.storePkiResource("ca",publicKey,"jabbadev-ca","key","public")]
)

const subject = new CertificateAttributes(config.get('ca.subject'))
const issuer = subject

const certIn = new CertificateInput()
.publicKey(publicKey)
.privateKey(privateKey)
.validityYears(10)
.serialNumber("01")
.subject(subject)
.issuer(subject)

//const caCert = await generateCertificate(certIn.options())
const caCert = await generateCertificate(certificateInputHandler(certIn))

await storage.storePkiResource("ca",caCert,"jabbadev-ca","cert")

generateKeyPair().then( async keys=>{
    const { privateKey, publicKey } = keys
    await Promise.all(
        [storage.storePkiResource("servers",privateKey,"home-domotic-server","key","private"),
        storage.storePkiResource("servers",publicKey,"home-domotic-server","key","public")]
    )

    const subject = new CertificateAttributes(config.get('server.subject'))
    const attributes = new CsrAttributes(config.get("server.attributes"))


    const csr = await generateCSR({ subject, attributes, privateKey, publicKey })
    await storage.storePkiResource("servers",csr,"home-domotic-server","csr")

    const serverCert = await generateCertificateFromCsr({
        csrPem: csr, extensions: null, validityYears: 10, serialNumber: "02", caCertificatePem: caCert , caPrivateKeyPem: privateKey
    })

    await storage.storePkiResource("servers",serverCert,"home-domotic-server","cert")

})


//setupPkiFs()
//genCaCert().then(
//    dumpPkiArtifact('../pki/ca','jabbadevCA')).then(genClientCert())
//genServerCSR()
//    .then(dumpPkiArtifact('../pki/servers','homeDomoticServer'))

/*
genCertificate('../pki/servers','homeDomoticServer','../pki/ca','jabbadevCA',"cannonau").then(
    dumpPkiArtifact('../pki/servers','homeDomoticServer')
)
*/



