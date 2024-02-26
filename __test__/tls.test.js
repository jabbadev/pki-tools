import { describe, expect, test, it, beforeAll, afterAll } from '@jest/globals'
import { generateCaRootCertificate, generatePkiCertificate, generateRsaPemKeys } from '../lib/pkiutils.js'
import { CertificateSubject } from '../lib/commons.js'
import tls from 'node:tls'
import { error } from 'node:console'

let smallRefusedKeys, minimumAcceptedKeys, caRoot, serverCert, clientCert, tlsServer, tlsPort 
beforeAll(()=>{

    return Promise.all([
        generateRsaPemKeys({ bits: 512 }).then( keys => {
            smallRefusedKeys = keys
        }),

        generateRsaPemKeys({ bits: 1024 }).then( keys => {
            minimumAcceptedKeys = keys
        }),

        generateCaRootCertificate(
            new CertificateSubject("/CN=Root CA/C=IT/ST=Italy/L=Bergamo/O=MyNET/OU=MyNET Root CA server/E=ca-root@mynet.it"),
            "01",
            { keySize: 1024 }).then( data => {
                caRoot = data
            }) ])
    .then(() => Promise.all([

            generatePkiCertificate(
                new CertificateSubject("/CN=server.mynet.it/C=IT/ST=Italy/L=Bergamo/O=MyNET/OU=MyNET Web Server/E=server@mynet.it"),
                "02",caRoot.certificate.data,caRoot.privateKey,{ keySize: 512 }
            ).then( data => {
                serverCert = data
            }),

            generatePkiCertificate(
                new CertificateSubject("/CN=client.mynet.it/C=IT/ST=Italy/L=Bergamo/O=MyNET/OU=MyNET TLS Client/E=client@mynet.it"),
                "03",caRoot.certificate.data,caRoot.privateKey,{ keySize: 512 }
            ).then( data => {
                clientCert = data
            })

    ]))
    .then(()=> TLSServer({ key: serverCert.privateKey,
                          cert: serverCert.certificate.data,
                          pemCaCert: caRoot.certificate.data,  })
    )
    .then((tlsServerInfo) => { tlsServer = tlsServerInfo.server, tlsPort = tlsServerInfo.port })
})

const getRandomPort = (min, max) => {
    const minCeiled = Math.ceil(min)
    const maxFloored = Math.floor(max)
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled)
}


const TLSServer = (tlsOptions) => new Promise((resolve,reject)=>{
    try {
        const defaultOptions = {
            minPort: 7000,
            maxPort: 9000,
            retry: 10
        }
        const options = { ...defaultOptions, ...tlsOptions }
        
        let tlsPort = getRandomPort(7000,9000),
            tlsServer

        const tlsconf = {
            ca: [ options.pemCaCert ]
        }

        if ( options.pfx ) {
            tlsconf.pfx = options.pfx
            if ( options.passphrase ) {
                tlsconf.passphrase = options.passphrase
            } else {
                throw new Error("pfx need passphrase")
            }
        }
        else {
            
            if ( options.key ){
                tlsconf.key = options.key
            }
            else {
                throw new Error("private key undefined")
            }

            if ( options.cert ){
                tlsconf.cert  = options.cert
            }
            else {
                throw new Error("certificate undefined")
            }
            
            if ( options.passphrase ) {
                tlsconf.passphrase = options.passphrase
            }

            tlsconf.requestCert = true
        }

        tlsServer = tls.createServer(tlsconf, (socket) => {
            expect(socket.authorized).toBeTruthy()
            socket.write('welcome!\n');
            socket.setEncoding('utf8');
            socket.pipe(socket);
        })
     
        tlsServer.listen(tlsPort, () => {
            tslStatus = "tls server ready"
            resolve({ server: tlsServer, port: tlsPort })
        })
    
        tlsServer.on('error',(error)=>{
            if ( error.code === 'EADDRINUSE'){
                retry -= 1
                if ( !retry ){
                    //tlsServer.close()
                    tslStatus = `${tslStatus} - max retry [${MAX_RETRY}] to find free listening port`
                    reject("all port in use")
                }
                else {
                    tlsPort = getRandomPort(7000,9000)
                    tlsServer.listen(tlsPort)
                }
            }
        })
    }
    catch(error) { reject(error) }
})

const MAX_RETRY = 10
let /*tlsServer, tlsPort = getRandomPort(7000,9000),*/ retry = MAX_RETRY, timer = null, tslStatus = "tls server unavailable"

const execTlsRequest = () => new Promise((resolve,reject)=>{

    const options = {
        key: clientCert.privateKey,
        cert: clientCert.certificate.data,
        ca: [ caRoot.certificate.data ],
        checkServerIdentity: () => { return null; },
      }
      
      const socket = tls.connect(tlsPort, options, () => {
        // Is autorized
        expect(socket.authorized).toBeTruthy()

        process.stdin.pipe(socket)
        process.stdin.resume()
      })

      socket.setEncoding('utf8');
      socket.on('data', (data) => {
        resolve(data)
        socket.end()
      })
      socket.on('end', () => {
        expect(true).toBeTruthy()
      })
})

describe("test a tls server with PKI certificate",()=>{

    /*
    beforeAll(() => {
        return initializeTls()
    })*/

    it("exec client request",async ()=>{
        await expect(execTlsRequest()).resolves.toEqual('welcome!\n')
    })

    afterAll(()=>{
        expect(tslStatus).toEqual("tls server ready")
        tlsServer.close()
    })
})

