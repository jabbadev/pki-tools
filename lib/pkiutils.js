import forge from 'node-forge'
import { mkdir, writeFile  } from 'node:fs/promises'
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
const CA_SUBJECT = ['commonName', 'countryName', 'stateOrProvinceName', 
                    'localityName', 'organizationName', 'organizationalUnitName', 
                    'emailAddress'].map((attrName)=>{
                      let attrInfo = null
                      if( config.get('ca.subject').has(attrName) ){
                        attrInfo = {
                          name: attrName,
                          value: config.get('ca.subject').get(attrName)
                        }
                      }
                      return attrInfo
                    }).filter((attrInfo)=>!!attrInfo)


export const setupPkiFs = async () => {

    await mkdir(`${__dirname}/../pki`, { recursive: true })
    await mkdir(`${__dirname}/../pki/ca`, { recursive: true })
    await mkdir(`${__dirname}/../pki/servers`, { recursive: true })
    await mkdir(`${__dirname}/../pki/clients`, { recursive: true })

}

export const setupCACerificate = () => {
}

export const getKeyPair = async ( password ) => new Promise((resolve,reject) => {
    crypto.generateKeyPair('rsa',{
        modulusLength: 4096,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
            cipher: 'aes-256-cbc',
            passphrase: password,
          },
    },(err, publicKey, privateKey) => {
        if ( err ) reject(err)
        resolve({ publicKey, privateKey })
    })
})

const generateCertificate = ( subject, issuer, validityYears, serialNumber, publicKey, privateKey, privateKeyPasswd ) => {
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
    //return pki.certificateToPem(cert)

    const certificate = pki.certificateToPem(cert)
    
    const c = pki.certificateFromPem(certificate)

    return certificate
}

export const genCaCert = async () => new Promise( async (resolve,reject)=>{
  const { publicKey, privateKey} = await getKeyPair(config.get('ca.privateKeyPassword'))
  const certificate = generateCertificate(CA_SUBJECT,
                                          CA_SUBJECT,
                                          config.get('ca.certificateValidity'),
                                          config.get('ca.serialNumber'),
                                          publicKey,
                                          privateKey,
                                          config.get('ca.privateKeyPassword')
  )

  

  resolve({ publicKey, privateKey, certificate })
})

export const dumpCaKeys = async (keys) => {
    console.log(keys)
    const pubKeyDump =  writeFile(`${__dirname}/../pki/ca/ca-pub.key.pem`,keys.publicKey )
    const priKeyDump =  writeFile(`${__dirname}/../pki/ca/ca-pri.key.pem`,keys.privateKey )
    const certDump =  writeFile(`${__dirname}/../pki/ca/ca-cert.pem`,keys.certificate )
    Promise.all([pubKeyDump,priKeyDump,certDump])
}

export const readCaCert = () => {
  `${__dirname}/../pki/ca/ca-cert.pem`
}

export const genForgeKeyPairPEM = ( ) => new Promise((resolve,reject)=>{
    const rsa = forge.pki.rsa
    rsa.generateKeyPair({bits: 2048, workers: 2}, function(err, keypair) {
        resolve( forge.pki.privateKeyToPem((keypair.privateKey)) )
    })
})
