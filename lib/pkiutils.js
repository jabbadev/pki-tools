import forge from 'node-forge'
import { CertificateIn, CertificateInput, CertificateIssuer, CertificateSubject, certificateInputHandler, respondTo } from './commons.js'

let crypto = null

export const generateRsaPemKeys = async (options) => {
  try {
    const defaultOptions = { password: null, bits: 2048, useForge: false }
    const _options = { ...defaultOptions, ...options };

    if ( _options.useForge ){
      return _generateForgeRsaPemKeys(_options)
    }

    if ( !crypto ) {
      crypto = await import('node:crypto')
    }

    return _generateRsaPemKeys(crypto,_options)
  } catch (err) {
    return _generateForgeRsaPemKeys(_options)
  }
}

const encrypt = (input,password) => {
  // 3DES key and IV sizes
  var keySize = 24;
  var ivSize = 8;

  // get derived bytes
  // Notes:
  // 1. If using an alternative hash (eg: "-md sha1") pass
  //   "forge.md.sha1.create()" as the final parameter.
  // 2. If using "-nosalt", set salt to null.
  var salt = forge.random.getBytesSync(8);
  // var md = forge.md.sha1.create(); // "-md sha1"
  var derivedBytes = forge.pbe.opensslDeriveBytes(
    password, salt, keySize + ivSize/*, md*/);
  var buffer = forge.util.createBuffer(derivedBytes);
  var key = buffer.getBytes(keySize);
  var iv = buffer.getBytes(ivSize);

  var cipher = forge.cipher.createCipher('3DES-CBC', key);
  cipher.start({iv: iv});
  cipher.update(forge.util.createBuffer(input, 'binary'));
  cipher.finish();

  var output = forge.util.createBuffer();

  // if using a salt, prepend this to the output:
  if(salt !== null) {
    output.putBytes('Salted__') // (add to match openssl tool output)
    output.putBytes(salt)
  }
  output.putBuffer(cipher.output)

  return output.getBytes()
}

const _generateForgeRsaPemKeys = (options) => new Promise((resolve,reject)=>{
  const defaultOptions = { password: null, bits: 2048, workers: 2 }
  const _options = { ...defaultOptions, ...options }

  const rsa = forge.pki.rsa
  rsa.generateKeyPair( {bits: _options.bits, workers: _options.workers }, function(err, keypair) {
    if (err) reject(err)

    if ( _options.password ){
      keypair.privateKey = forge.pki.encryptRsaPrivateKey(keypair.privateKey,_options.password, {algorithm: '3des'})
      resolve({privateKey: keypair.privateKey, publicKey: forge.pki.publicKeyToPem(keypair.publicKey)})
    }
    else {
      resolve({ privateKey: forge.pki.privateKeyToPem(keypair.privateKey), 
              publicKey: forge.pki.publicKeyToPem(keypair.publicKey) })
    }
  })
})

const _generateRsaPemKeys = (crypto,{password,bits}) => new Promise((resolve,reject)=>{
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
      modulusLength: bits,
      publicKeyEncoding: pubKeyEnc,
      privateKeyEncoding: prvKeyEnc,
  },(err, publicKey, privateKey) => {
      if ( err ) reject(err)
      resolve({ privateKey, publicKey })
  })
})

export const generateCertificate = ({ subject, issuer, extensions,
                                      notBefore, notAfter, validityYears, serialNumber,
                                      privateKey, publicKey, privateKeyPasswd }) => new Promise((resolve,rejects)=> {

    const pki = forge.pki
    const prvKey = ( privateKeyPasswd ) && pki.decryptRsaPrivateKey(privateKey,privateKeyPasswd) || pki.privateKeyFromPem(privateKey)
    const pubKey = pki.publicKeyFromPem(publicKey)

    const cert = pki.createCertificate()
    cert.publicKey = pubKey
    cert.serialNumber = serialNumber
    
    if ( validityYears ) {
      cert.validity.notBefore = new Date()
      cert.validity.notAfter = new Date()
      cert.validity.notAfter.setFullYear(
        cert.validity.notBefore.getFullYear() + validityYears
      )
    }
    else {
      cert.validity.notBefore = notBefore
      cert.validity.notAfter = notAfter
    }
    
    subject = respondTo(subject,"asFogeInput") && subject.asFogeInput() || subject
    cert.setSubject(subject)

    issuer = respondTo(issuer,"asFogeInput") && issuer.asFogeInput() || issuer
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

  subject = respondTo(subject,"asFogeInput") && subject.asFogeInput() || subject
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

export const getSubjectKeyIdentifier = ( publicKeyPem ) => {
  const pki = forge.pki

  return pki.getPublicKeyFingerprint(pki.publicKeyFromPem( publicKeyPem ),{
    type: 'SubjectPublicKeyInfo',
    md: forge.md.sha256.create(),
    encoding: 'hex', delimiter: ":"}
  )
}

export const generateKeystorePKCS12 = ( privateKey,certificateChain,password,options ) => {
  options = options || {}

  privateKey = forge.pki.privateKeyFromPem(privateKey)
  const pkcs12Asn1 = forge.pkcs12.toPkcs12Asn1(privateKey, certificateChain, password, options)
  const pkcs12Der = forge.asn1.toDer(pkcs12Asn1).getBytes()
  return new Buffer.from(pkcs12Der, 'binary')
}

export const generateCaRootCertificate = (subject,serialNum,options) => new Promise( async (resolve,reject)=>{
  try {
    const defaultOptions = {
      keySize: 4096,
      notBefore: new Date(),
      validityDelta: { years: 1 },
      extensions: [{ 
        name: "basicConstraints", 
        cA: true, 
        critical: true 
      }]
    }
    options = { ...defaultOptions, ...options }

    let _keys
    if ( options.keys ){
      _keys = options.keys
    }
    else {
      _keys = await generateRsaPemKeys({ bits: options.keySize })
    }
    const keys = _keys

    options.extensions.push({
      name: 'subjectKeyIdentifier',
      subjectKeyIdentifier: getSubjectKeyIdentifier(keys.publicKey)
    })

    const caCert = await generateCertificate(
      certificateInputHandler(
        new CertificateIn()
              .setExtensions(options.extensions)
              .setPublicKey(keys.publicKey)
              .setPrivateKey(keys.privateKey)
              .setNotBefore(options.notBefore)
              .setValidityDelta(options.validityDelta)
              .setSerialNumber(serialNum)
              .setSubject(subject)
              .setIssuer(subject)
      )
    )

    resolve({ ...keys, certificate: { type: "pem", data: caCert } })
  }
  catch( error ){
    reject(error)
  }
})

export const generatePkiCertificate = (subject, serialNum, pemCaCert, pemCaPrivateKey, genOptions ) => new Promise(async (resolve,reject)=>{
  try{
  const defaultOptions = {
    keySize: 2048,
    notBefore: new Date(),
    validityDelta: { years: 1 },
    certificateOutput: { type: "pem", password: null },
    extensions: [{
      name: "basicConstraints",
      cA: false,
    },
    {
      name: "keyUsage",
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true,
    }],
    csrAttributes: [{
      name: "unstructuredName",
      value: "Mynet server",
  }],
  }

  if ( genOptions && genOptions.certificateOutput ){
    defaultOptions.certificateOutput = genOptions.certificateOutput
  }

  if ( genOptions && genOptions.extensions ){
    defaultOptions.extensions = genOptions.extensions
  }

  if ( genOptions && genOptions.validityDelta ){
    defaultOptions.validityDelta = genOptions.validityDelta
  }

  if (  genOptions && genOptions.csrAttributes ){
    defaultOptions.csrAttributes = genOptions.csrAttributes
  }

  const options = { ...defaultOptions, genOptions }

  let _keys
  if ( options.keys ){
    _keys = options.keys
  }
  else {
    _keys = await generateRsaPemKeys({ bits: options.keySize })
  }
  const keys = _keys
  
  const rootCaCert = forge.pki.certificateFromPem(pemCaCert);

  options.extensions.push({
    name: "authorityKeyIdentifier",
    keyIdentifier:  rootCaCert.generateSubjectKeyIdentifier().getBytes()
  })

  const csr = await generateCSR({ subject: subject,
    attributes: options.csrAttributes,
    privateKey: keys.privateKey,
    publicKey: keys.publicKey
  })

  let certificate = await generateCertificateFromCsr({
    csrPem: csr, extensions: options.extensions, validityYears: 10, serialNumber: serialNum, caCertificatePem: pemCaCert , caPrivateKeyPem: pemCaPrivateKey
  })

  if ( options.certificateOutput.type.match(/^pfx|pkcs12$/)){
    if ( !options.certificateOutput.password ){
      throw new Error("certificate output [pfx|pkcs12] need a password")
    }
    certificate = generateKeystorePKCS12(keys.privateKey,certificate,options.certificateOutput.password)
  }

  resolve({ ...keys, csr: csr, certificate: { type: options.certificateOutput.type, data: certificate } })
  }
  catch(error){
    reject(error)
  }
})
