
import { genCaCert, genServerCSR, setupPkiFs, dumpPkiArtifact, genCertificate } from './lib/pkiutils.js'
import path from 'path';

//setupPkiFs()
//genCaCert().then(
//    dumpPkiArtifact('../pki/ca','jabbadevCA')).then(genClientCert())
//genServerCSR()
//    .then(dumpPkiArtifact('../pki/servers','homeDomoticServer'))

genCertificate('../pki/servers','homeDomoticServer','../pki/ca','jabbadevCA',"cannonau").then(
    dumpPkiArtifact('../pki/servers','homeDomoticServer')
)

