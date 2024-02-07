import forge from 'node-forge'
import { mkdir,writeFile,readFile,readdir } from 'node:fs/promises'
import { resolve } from 'node:path';
import path from 'path'
import { fileURLToPath } from 'url'
import config  from 'config'
import { CertificateAttributes, CertificateInput, CsrAttributes, certificateInputHandler, respondTo } from './commons.js';
import { rejects } from 'node:assert';

let crypto;
try {
  crypto = await import('node:crypto');
} catch (err) {
  console.error('crypto support is disabled!');
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const getSubjectFromConfig = ( configProp ) =>  ['commonName', 'countryName', 'stateOrProvinceName', 
  'localityName', 'organizationName', 'organizationalUnitName', 
  'emailAddress'].map((attrName)=>{
    let attrInfo = null
    if( config.get(configProp).has(attrName) ){
      attrInfo = {
        name: attrName,
        value: config.get(configProp).get(attrName)
      }
    }
    return attrInfo
  }).filter(attrInfo => !!attrInfo)

const getAttributsFromConfig = ( configProp ) => ["unstructuredName "].map((attrName) => {
  let attrInfo = null
  if ( config.get(configProp).has(attrName) ){
    attrInfo = {
      name: attrName,
      value: config.get(configProp).get(attrName)
    }
  }
  return attrInfo
}).filter(attrInfo => !!attrInfo)

export const setupPkiFs = async () => {

    await mkdir(`${__dirname}/../pki`, { recursive: true })
    await mkdir(`${__dirname}/../pki/ca`, { recursive: true })
    await mkdir(`${__dirname}/../pki/servers`, { recursive: true })
    await mkdir(`${__dirname}/../pki/clients`, { recursive: true })

}

export const generateKeyPair = async ( password ) => new Promise((resolve,reject) => {
  const pubKeyEnc = {
    type: 'spki',
    format: 'pem',
  }
  
  let prvKeyEnc = {
    type: 'pkcs8',
    format: 'pem',
  }

  if ( password ){
    prvKeyEnc = { ...prvKeyEnc, cipher: 'aes-256-cbc', passphrase: password }
  }

  crypto.generateKeyPair('rsa',{
      modulusLength: 4096,
      publicKeyEncoding: pubKeyEnc,
      privateKeyEncoding: prvKeyEnc,
  },(err, publicKey, privateKey) => {
      if ( err ) reject(err)
      resolve({ privateKey, publicKey })
  })
})

export const generateCertificate = ({ subject, issuer, extensions,
                                      validityYears, serialNumber,
                                      privateKey, publicKey, privateKeyPasswd }) => new Promise((resolve,rejects)=> {

    const pki = forge.pki
    const prvKey = ( privateKeyPasswd ) && pki.decryptRsaPrivateKey(privateKey,privateKeyPasswd) || pki.privateKeyFromPem(privateKey)
    const pubKey = pki.publicKeyFromPem(publicKey)

    const cert = pki.createCertificate()
    cert.publicKey = pubKey
    cert.serialNumber = serialNumber
    cert.validity.notBefore = new Date()
    cert.validity.notAfter = new Date()
    cert.validity.notAfter.setFullYear(
      cert.validity.notBefore.getFullYear() + validityYears
    )

    // here we set subject and issuer as the same one
    subject = subject instanceof CertificateAttributes && subject.asFogeInput() || subject
    cert.setSubject(subject)

    issuer = issuer instanceof CertificateAttributes && issuer.asFogeInput() || issuer
    cert.setIssuer(issuer)
    
    if ( extensions ){
      cert.setExtensions(extensions)
    }

    cert.sign(prvKey)

    resolve(pki.certificateToPem(cert))
})

export const generateCSR = ({ subject, attributes, privateKey, publicKey }) => new Promise((resolve,reject)=>{
  const pki = forge.pki

  const prKey = pki.privateKeyFromPem(privateKey)
  const pubKey = pki.publicKeyFromPem(publicKey)

  const csr = pki.createCertificationRequest()
  csr.publicKey = pubKey

  subject = subject instanceof CertificateAttributes && subject.asFogeInput() || subject
  csr.setSubject(subject)
  
  attributes = attributes instanceof CsrAttributes && attributes.asFogeInput() || attributes
  csr.setAttributes(attributes)

  csr.sign(prKey)

  resolve(pki.certificationRequestToPem(csr))
})

export const generateCertificateFromCsr = ({ csrPem, extensions, validityYears, serialNumber, caCertificatePem, caPrivateKeyPem, caPrivateKeyPassword }) => {
  const pki = forge.pki,
        csr = pki.certificationRequestFromPem(csrPem),
        caCert = pki.certificateFromPem(caCertificatePem)

  if ( !csr.verify() ) {
    throw new Error("csr signature not verified.")
  } 

  let caPrivateKey
  if ( caPrivateKeyPassword ){
    caPrivateKey = pki.decryptRsaPrivateKey(caPrivateKeyPem,caPrivateKeyPassword)
  }
  else {
    caPrivateKey = pki.privateKeyFromPem(caPrivateKeyPem)
  }

  const certIn = new CertificateInput()
    .serialNumber(serialNumber)
    .validityYears(validityYears)
    .privateKey(caPrivateKeyPem)
    .publicKey(pki.publicKeyToPem(csr.publicKey))
    .issuer(caCert.issuer.attributes)
    .subject(csr.subject.attributes)
  
  if ( extensions ) certIn.extensions(extensions)

  return generateCertificate(certificateInputHandler(certIn))
}

const csrToCertificate = ( csrPem, validityYears, serialNumber, caCertificatePem ,caPrivateKeyPem, caPrivateKeyPassword  ) => {
  const pki = forge.pki
  
  const csr = pki.certificationRequestFromPem(csrPem);
  // Read CA cert and key
  const caCert = forge.pki.certificateFromPem(caCertificatePem);

  let caKey
  if ( caPrivateKeyPassword ){
    caKey = forge.pki.decryptRsaPrivateKey(caPrivateKeyPem,caPrivateKeyPassword)
  }
  else {
    caKey = forge.pki.privateKeyFromPem(caPrivateKeyPem)
  }

  if (csr.verify()) {
    console.log("Certification request (CSR) verified.");
  } else {
    throw new Error("Signature not verified.");
  }

  console.log("Creating certificate...")
  const cert = forge.pki.createCertificate()
  cert.serialNumber = serialNumber;

  cert.validity.notBefore = new Date()
  cert.validity.notAfter = new Date()
  cert.validity.notAfter.setFullYear(
    cert.validity.notBefore.getFullYear() + validityYears
  )

  cert.setSubject(csr.subject.attributes);
  // issuer from CA
  cert.setIssuer(caCert.subject.attributes);

  cert.setExtensions([
    {
      name: "basicConstraints",
      cA: true,
    },
    {
      name: "keyUsage",
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true,
    },
    {
      name: "subjectAltName",
      altNames: [
        {
          type: 6, // URI
          value: "http://example.org/webid#me",
        },
      ],
    },
  ]);

  cert.publicKey = csr.publicKey;

  cert.sign(caKey);
  console.log("Certificate created.");

  console.log("\nWriting Certificate");
  // fs.writeFileSync(
  //   "ssl/is-cert.pem",
  //   forge.pki.certificateToPem(cert)
  // );
  return forge.pki.certificateToPem(cert);
}

export const loadPkiArtifact = (location,name, ...acceptTypes ) => new Promise(async (resolve,reject)=>{
  const files = await readdir(`${__dirname}/${location}`)
  const pkiArtifact = files.reduce((pkiArtifact,file)=>{
    const [ artName, type ] = file.split('.')
    const [ artifactName,artifactType ] = artName.split("-")
    if ( artifactName == name && ( !!!acceptTypes.length || acceptTypes.includes(type) )){
      if ( type == "key" ){
        if ( artifactType == "pub"  ){
          pkiArtifact['publicKey'] = readFile(`${__dirname}/${location}/${file}`).then(data=>pkiArtifact.publicKey = data)
        }

        if ( artifactType == "prv" ){
          pkiArtifact['privateKey'] = readFile(`${__dirname}/${location}/${file}`).then(data=>pkiArtifact.privateKey = data)
        }
      }

      if ( type == "cer" ){
        pkiArtifact['certificate'] = readFile(`${__dirname}/${location}/${file}`).then(data=>pkiArtifact.certificate = data)
        pkiArtifact['type'] = "certificate"
      }

      if ( type == "csr" ){
        pkiArtifact['csr'] = readFile(`${__dirname}/${location}/${file}`).then(data=>pkiArtifact.csr = data)
        pkiArtifact['type'] = "csr"
      }
    }
    return pkiArtifact
  },{})

  Promise.all(["publicKey","privateKey","certificate","csr"].filter(key=>!!pkiArtifact[key]).map(key=>pkiArtifact[key])).then(()=>{
    resolve(pkiArtifact)
  })
})

export const genCertificate = (csrLocation,csrName,caLocation,caName, caPrivateKeyPassword ) => new Promise((resolve,reject)=>{

  Promise.all([
    loadPkiArtifact(csrLocation,csrName,"csr"),
    loadPkiArtifact(caLocation,caName)
  ]).then(([{csr},{privateKey,certificate}])=>{
    resolve( { certificate: csrToCertificate(csr,10,"02",certificate,privateKey,caPrivateKeyPassword), type: "certificate" } )
  })

}) 

export const dumpPkiArtifact =  (location,name) => pkiArtifact => {

  const dumpPromises = []

  pkiArtifact.publicKey && dumpPromises.push( writeFile(`${__dirname}/${location}/${name}-pub.key.pem`,pkiArtifact.publicKey ) )
  pkiArtifact.privateKey && dumpPromises.push(  writeFile(`${__dirname}/${location}/${name}-prv.key.pem`,pkiArtifact.privateKey) )
  pkiArtifact.type == "csr" && dumpPromises.push( writeFile(`${__dirname}/${location}/${name}.csr.pem`,pkiArtifact.csr ) )
  pkiArtifact.type == "certificate" && dumpPromises.push( writeFile(`${__dirname}/${location}/${name}.cer.pem`,pkiArtifact.certificate ) )
  
  Promise.all(dumpPromises)
}

export const genForgeKeyPairPEM = ( ) => new Promise((resolve,reject)=>{
    const rsa = forge.pki.rsa
    rsa.generateKeyPair({bits: 2048, workers: 2}, function(err, keypair) {
        resolve( forge.pki.privateKeyToPem((keypair.privateKey)) )
    })
})
