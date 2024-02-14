import forge from 'node-forge'
import { CertificateAttributes, CertificateInput, CsrAttributes, certificateInputHandler, respondTo } from './commons.js';

let crypto;
try {
  crypto = await import('node:crypto');
} catch (err) {
  console.error('crypto support is disabled!');
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

    subject = subject instanceof CertificateAttributes && subject.asFogeInput() || subject
    cert.setSubject(subject)

    issuer = issuer instanceof CertificateAttributes && issuer.asFogeInput() || issuer
    cert.setIssuer(issuer)
    
    if ( extensions ){
      cert.setExtensions(extensions)
    }

    cert.sign(prvKey,forge.md.sha256.create())

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
  
  csr.setAttributes(attributes)

  csr.sign(prKey,forge.md.sha256.create())

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

export const genForgeKeyPairPEM = ( ) => new Promise((resolve,reject)=>{
    const rsa = forge.pki.rsa
    rsa.generateKeyPair({bits: 4096, workers: 2}, function(err, keypair) {
      if (err) reject(err)  
      resolve({ privateKey: forge.pki.privateKeyToPem(keypair.privateKey), 
                publicKey: forge.pki.publicKeyToPem(keypair.publicKey) })
    })
})

export const getSubjectKeyIdentifier = ( publicKeyPem ) => {
  const pki = forge.pki

  return pki.getPublicKeyFingerprint(pki.publicKeyFromPem( publicKeyPem ),{
    type: 'SubjectPublicKeyInfo',
    md: forge.md.sha256.create(),
    encoding: 'hex', delimiter: ":"}
  )
}
