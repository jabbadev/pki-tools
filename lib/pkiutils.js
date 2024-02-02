import forge from 'node-forge'
import { mkdir,writeFile,readFile,readdir } from 'node:fs/promises'
import { resolve } from 'node:path';
import path from 'path'
import { fileURLToPath } from 'url'
import config  from 'config'

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

export const getKeyPair = async ( password ) => new Promise((resolve,reject) => {
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

const generateCertificate = ( subject, issuer, validityYears, serialNumber, privateKey, publicKey, privateKeyPasswd ) => {
    const pki = forge.pki
    const prKey = pki.decryptRsaPrivateKey(privateKey,privateKeyPasswd)
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
    cert.setSubject(subject)
    cert.setIssuer(issuer)
    // the actual certificate signing
    cert.sign(prKey)

    // now convert the Forge certificate to PEM format
    
    return pki.certificateToPem(cert)
}

const generateCSR = ( subject, attributes, privateKey, publicKey ) => {
  const pki = forge.pki;

  const prKey = pki.privateKeyFromPem(privateKey);
  const pubKey = pki.publicKeyFromPem(publicKey);

  // generate a key pair
  // const keys = forge.pki.rsa.generateKeyPair(1024);

  // create a certification request (CSR)
  const csr = forge.pki.createCertificationRequest();
  csr.publicKey = pubKey;
  csr.setSubject(subject);
  // set (optional) attributes
  csr.setAttributes(attributes);

  // sign certification request
  csr.sign(prKey);

  // verify certification request
  const verified = csr.verify();

  // convert certification request to PEM-format
  const pem = forge.pki.certificationRequestToPem(csr);

  // convert a Forge certification request from PEM-format
  // const csr = forge.pki.certificationRequestFromPem(pem);

  // get an attribute
  // csr.getAttribute({ name: "challengePassword" });

  // get extensions array
  // csr.getAttribute({ name: "extensionRequest" }).extensions;
  
  return pem;
}

const csrToCertificate = ( csrPem, validityYears, serialNumber, caCertificatePem ,caPrivateKeyPem, caPrivateKeyPassword  ) => {
  const csr = forge.pki.certificationRequestFromPem(csrPem);
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

export const genCaCert = async () => new Promise( async (resolve,reject)=>{
  const { publicKey, privateKey} = await getKeyPair(config.get('ca.privateKeyPassword'))
  const caSubject = getSubjectFromConfig('ca.subject')
  const certificate = generateCertificate(caSubject,
                                          caSubject,
                                          config.get('ca.certificateValidity'),
                                          config.get('ca.serialNumber'),
                                          privateKey,
                                          publicKey,
                                          config.get('ca.privateKeyPassword')
  )

  let pkiArtifact = { privateKey, publicKey, certificate }
  pkiArtifact['type'] = "certificate"
  resolve(pkiArtifact)
})

export const genServerCSR = () => new Promise(async (resolve,reject)=>{
  const { privateKey, publicKey, } = await getKeyPair()
  const csr = generateCSR(
                getSubjectFromConfig('server.subject'),
                getAttributsFromConfig('server.attributes'),
                privateKey,
                publicKey
  )
  let pkiArtifact = { privateKey, publicKey, csr }
  pkiArtifact['type'] = "csr"
  resolve(pkiArtifact)
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
