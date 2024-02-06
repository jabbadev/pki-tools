
import { getKeyPair, generateCertificate, generateCSR, genServerCSR, setupPkiFs, dumpPkiArtifact, genCertificate } from './lib/pkiutils.js'
import path from 'path';
import config  from 'config'

import { CertificateAttributes, CsrAttributes } from './lib/commons.js';
import { loadStorage } from './lib/storage.js';

const storage = await loadStorage("fs")
storage.init({basePath: "/home/development/toolbox/pki/pki"})
       .registerStorageLocation("ca")
       .registerStorageLocation("servers")
       
const { privateKey, publicKey } = await getKeyPair()

await Promise.all(
    [storage.storePkiResource("ca",privateKey,"jabbadev-ca","key","private"),
    storage.storePkiResource("ca",publicKey,"jabbadev-ca","key","public")]
)

const subject = new CertificateAttributes(config.get('ca.subject'))
const issuer = subject
const caCert = generateCertificate(subject,issuer,10,"01",privateKey,publicKey)

await storage.storePkiResource("ca",caCert,"jabbadev-ca","cert")

console.log('dumped')

getKeyPair().then( async keys=>{
    const { privateKey, publicKey } = keys
    await Promise.all(
        [storage.storePkiResource("servers",privateKey,"home-domotic-server","key","private"),
        storage.storePkiResource("servers",publicKey,"home-domotic-server","key","public")]
    )

    const subject = new CertificateAttributes(config.get('server.subject'))
    const csrAttr = new CsrAttributes(config.get("server.attributes"))
    const csr = generateCSR(subject,csrAttr, privateKey, publicKey )
    await storage.storePkiResource("servers",csr,"home-domotic-server","csr")
    console.log(csr)
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



