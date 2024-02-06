import { describe, expect, test, it } from '@jest/globals'
import { CertificateAttributes, CertificateInput, CsrAttributes } from "../lib/commons"

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

})