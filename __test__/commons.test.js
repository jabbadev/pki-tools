import { describe, expect, test, it } from '@jest/globals'
import { CertificateInput, certificateInputHandler, CertificateSubject, CertificateIssuer, CertificateIn } from "../lib/commons"

describe("test CertificateAttributes type",()=>{

    describe("test CertificateInput type",()=>{
        it("CertificateInput void instatiation",()=>{
            const certIn = new CertificateInput()
            expect(certIn.subject()).toBeUndefined()
            expect(certIn.options()).toEqual({})
            certIn.subject(new CertificateInput({}))
            expect( certIn.options()['subject'] ).toBeInstanceOf(CertificateInput)
        })
    })

    describe("test certificate input wrapper",()=>{
        it("test certificateInputWrapper usage",()=>{
            const subject = new Map().set("commonName","client.mynet.homepc.it").set("C","IT")
            const issuer = new Map().set("commonName","issuer.mynet.homepc.it").set("C","IT")

            expect(certificateInputHandler(subject,issuer,null,10,"serial-10")).toEqual({subject: subject,issuer: issuer,
                                                                                         validityYears: 10, serialNumber: "serial-10"})
            const certIn = new CertificateInput({
                subject: subject,
                issuer: issuer,
                validityYears: 10,
                serialNumber: "serial-10"
            })

            expect(certificateInputHandler(certIn)).toEqual({subject: subject,issuer: issuer,validityYears: 10, serialNumber: "serial-10"})

            const certInputMap = new Map().set("subject",subject).set("issuer",issuer).set("validityYears",10).set("serialNumber","serial-10")
            expect(certificateInputHandler(certInputMap)).toEqual({subject: subject,issuer: issuer,validityYears: 10, serialNumber: "serial-10"})

            const certInputObj = {
                subject: subject,
                issuer: issuer,
                validityYears: 10,
                serialNumber: "serial-10"
            }

            expect(certificateInputHandler(certInputObj)).toEqual(expect.objectContaining({
                subject: subject,issuer:
                issuer,
                validityYears: 10,
                serialNumber: "serial-10"}))

            const certInput = {
                    subject: subject,
                    issuer: issuer,
                    validityYears: 10,
                    serialNumber: "serial-10",
                    publicKey: '-----BEGIN PUBLIC KEY-----\r\nMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAim+ZEFCPxIxuPAVT+y/d\r\n-----END PUBLIC KEY-----\r\n'
            }

            expect(certificateInputHandler(certInput).publicKey).toEqual('-----BEGIN PUBLIC KEY-----\r\nMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAim+ZEFCPxIxuPAVT+y/d\r\n-----END PUBLIC KEY-----\r\n')

        })

        it("verify Certificate input",()=>{
            expect(()=>
                certificateInputHandler(
                    new CertificateInput({subject: {},issuer: {}, serialNumber: "serial-10"})
                )
            ).toThrow("Certificate input must have a valid [validityYears] number")

            expect(()=>{
                certificateInputHandler({},{},null,"01","serial-10")
            }).toThrow("validityYears must be a number")

            expect(()=>{
                certificateInputHandler({},{},null,1,10)
            }).toThrow("serialNumber must be a string")
        })
    })

    describe("test certificate subject object",()=>{
        it("basic instanziation", () => {
            const subject = new CertificateSubject()

            subject.setCommonName("ca-root.mynet.it")
                .setCountryName("IT")
                .setStateOrProvinceName("Italy")
                .setLocalityName("Bergamo")
                .setOrganizationName("MyNET")
                .setOrganizationalUnitName("MyNET Root CA server")
                .setEmailAddress("ca-root@mynet.it")

            expect(subject.commonName()).toEqual("ca-root.mynet.it")
        })

        it("basic instanziation using alias",()=>{
            const subject = new CertificateSubject()
            subject.setCN("Root CA")
            .setC("IT")
            .setST("Italy")
            .setL("Bergamo")
            .setO("MyNET")
            .setOU("MyNET Root CA server")
            .setE("ca-root@mynet.it")

            expect(subject).toBeInstanceOf(CertificateSubject)
        })

        it("instanziation by string with alias like -subj openssl",()=>{
            const subject = new CertificateSubject("/CN=Root CA/C=IT/ST=Italy/L=Bergamo/O=MyNET/OU=MyNET Root CA server/E=ca-root@mynet.it")
            expect(subject.E()).toEqual("ca-root@mynet.it")
        })

        it("instanziation by string with alias and attribute like -subj openssl",()=>{
            const subject = new CertificateSubject("/commonName=Root CA/C=IT/ST=Italy/L=Bergamo/O=MyNET/OU=MyNET Root CA server/E=ca-root@mynet.it")
            expect(subject.CN()).toEqual("Root CA")
            expect(subject.commonName()).toEqual("Root CA")
            expect(subject.asFogeInput()).toHaveLength(7)
        })

        it("instanziation in error with unsupported attribute",()=>{
            expect( ()=> {
                new CertificateSubject("/common=Root CA/C=IT/ST=Italy/L=Bergamo/O=MyNET/OU=MyNET Root CA server/E=ca-root@mynet.it")
            }).toThrow(/unsupported attribute/)
        })

        it("instanziation by object ",()=>{
            const subject = new CertificateSubject({
                commonName: "Root CA",
                C: "IT",
                ST: "Italy",
                L: "Bergamo",
                O: "MyNET",
                OU: "MyNET Root CA server",
                E: "ca-root@mynet.it"}
            )
            expect(subject.CN()).toEqual("Root CA")
            expect(subject.commonName()).toEqual("Root CA")
            expect(subject.emailAddress()).toEqual("ca-root@mynet.it")
        })

    })

    describe("test certificate issuer object",()=>{
        it("basic instanziation of an issuer object", () => {
            const issuer = new CertificateIssuer()
            .setCN("Root CA")
            .setC("IT")
            .setST("Italy")
            .setL("Bergamo")
            .setO("MyNET")
            .setOU("MyNET Root CA server")
            .setE("ca-root@mynet.it")

            expect(issuer).toBeInstanceOf(CertificateIssuer)
            expect(issuer.CN()).toEqual("Root CA")

        })
    })

    describe("test Certificate Input class",() => {
        it("basic object instanziation", () => {
            const certIN = new CertificateIn()
            .setSubject(new CertificateSubject("/CN=Root CA/C=IT/ST=Italy/L=Bergamo/O=MyNET/OU=MyNET Root CA server/E=ca-root@mynet.it"))
            .setIssuer(new CertificateIssuer("/CN=Root CA/C=IT/ST=Italy/L=Bergamo/O=MyNET/OU=MyNET Root CA server/E=ca-root@mynet.it"))
            .setNotBefore(new Date(2014, 8, 1, 10, 19, 50)) // 01/09/2014 10:19:50
            .setValidityDelta({
                years: 2,
                months: 1,
            })

            expect(certIN.subject().CN()).toEqual("Root CA")
            expect(certIN.notAfter()).toBeInstanceOf(Date)
            expect(certIN.notAfter().getFullYear()).toEqual(2016)
            expect(certIN.notAfter().getMonth()).toEqual(9)
            expect(certIN.issuer().E()).toEqual("ca-root@mynet.it")
            expect(certIN instanceof CertificateIn ).toBeTruthy()
            const objIN = certIN.toObject()
            expect(objIN).toBeInstanceOf(Object)
            expect(objIN).toHaveProperty("notBefore",new Date(2014, 8, 1, 10, 19, 50))
            expect(objIN).toHaveProperty("notAfter",new Date(2016, 9, 1, 10, 19, 50))

        })
    })

})