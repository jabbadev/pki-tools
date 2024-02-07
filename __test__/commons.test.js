import { describe, expect, test, it } from '@jest/globals'
import { CertificateAttributes, CertificateInput, CsrAttributes, certificateInputHandler } from "../lib/commons"

describe("test CertificateAttributes type",()=>{
    it("CertificateAttributes void instatiation",()=>{
        const subject = new CertificateAttributes()
        expect(subject.commonName()).toBeUndefined()
        expect(subject.commonName("ca.mynet.homepc.it")).toBe(subject)
        expect(subject.commonName()).toBe("ca.mynet.homepc.it")
        expect(subject.countryName()).toBeUndefined()

        subject
            .countryName("IT")
            .stateOrProvinceName("Italy")

        expect(subject.stateOrProvinceName()).toBe("Italy")

        expect(subject.asFogeInput()).toHaveLength(3)
        expect(subject.asFogeInput()[0]).toEqual({name: "commonName", value: "ca.mynet.homepc.it"})
    })
    it("CertificateAttributes instatiation by object with get method",()=>{
        const map = new Map()
        map.set("commonName","ca.mynet.homepc.it")
        map.set("C","IT")

        const subject = new CertificateAttributes(map)
        expect(subject.asFogeInput()[0]).toEqual({name: "commonName", value: "ca.mynet.homepc.it"})

        const issuer = new CertificateAttributes({
            commonName: "ca.mynet.homepc.it",
            C: "IT"
        })
        expect(issuer.countryName()).toEqual("IT")

    })

    describe("test CsrAttributes type",()=>{
        it("CsrAttributes void instatiation",()=>{
            const csrAttr = new CsrAttributes()
            expect(csrAttr.challengePassword()).toBeUndefined()
            csrAttr.challengePassword("12345")
            expect(csrAttr.challengePassword()).toEqual("12345")

        })
        it("CertificateAttributes instatiation by object with get method",()=>{
            const map = new Map()
            map.set("challengePassword","12345")
            map.set("unstructuredName","Muzio Scevola")

            const csrAttr = new CsrAttributes(map)
            expect(csrAttr.asFogeInput()[0]).toEqual({ name: "challengePassword", value: "12345"})

        })
    })

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

})