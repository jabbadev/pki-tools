
import { getKeyPair, genCaCert, genServerCSR, setupPkiFs, dumpPkiArtifact, genCertificate } from './lib/pkiutils.js'
import path from 'path';

import { Subject } from './lib/commons.js';
import { loadStorage } from './lib/storage.js';

const storage = await loadStorage("fs")
storage.init({basePath: "/home/development/toolbox/pki/pki"})
       .registerStorageLocation("ca")
       
const { privateKey, publicKey } = await getKeyPair()

await Promise.all(
    [storage.storePkiResource("ca",privateKey,"jabbadev","key","private"),
    storage.storePkiResource("ca",publicKey,"jabbadev","key","public")]
)

console.log('dumped')



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



