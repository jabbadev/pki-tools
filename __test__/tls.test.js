import { describe, expect, test, it, beforeAll, afterAll } from '@jest/globals'
import { generateCaRootCertificate, generatePkiCertificate } from '../lib/pkiutils.js'
import { CertificateSubject } from '../lib/commons.js'
import tls from 'node:tls'

const caRoot = await generateCaRootCertificate(
    new CertificateSubject("/CN=Root CA/C=IT/ST=Italy/L=Bergamo/O=MyNET/OU=MyNET Root CA server/E=ca-root@mynet.it"),
    "01",
    { keySize: 2048 }
)

const serverCert = await generatePkiCertificate(
    new CertificateSubject("/CN=server.mynet.it/C=IT/ST=Italy/L=Bergamo/O=MyNET/OU=MyNET Web Server/E=server@mynet.it"),
    "02",caRoot.certificate.data,caRoot.privateKey,{ keySize: 512 }
)

const clientCert = await generatePkiCertificate(
    new CertificateSubject("/CN=client.mynet.it/C=IT/ST=Italy/L=Bergamo/O=MyNET/OU=MyNET TLS Client/E=client@mynet.it"),
    "03",caRoot.certificate.data,caRoot.privateKey,{ keySize: 512 }
)

const getRandomPort = (min, max) => {
    const minCeiled = Math.ceil(min)
    const maxFloored = Math.floor(max)
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled)
}

const MAX_RETRY = 10
let tlsServer, tlsPort = getRandomPort(7000,9000), retry = MAX_RETRY, timer = null, tslStatus = "tls server unavailable"
const initializeTls = () => new Promise(async (resolve,reject) => {
    const options = {
        key: serverCert.privateKey,
        cert: serverCert.certificate.data ,
        requestCert: true,
        ca: [ caRoot.certificate.data ],
    };

    tlsServer = tls.createServer(options, (socket) => {
        expect(socket.authorized).toBeTruthy()
        socket.write('welcome!\n');
        socket.setEncoding('utf8');
        socket.pipe(socket);
    })
 
    tlsServer.listen(tlsPort, () => {
        tslStatus = "tls server ready"
        resolve()
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
})

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

    beforeAll(() => {
        return initializeTls()
    })

    it("exec client request",async ()=>{
        await expect(execTlsRequest()).resolves.toEqual('welcome!\n')
    })

    afterAll(()=>{
        expect(tslStatus).toEqual("tls server ready")
        tlsServer.close()
    })
})

