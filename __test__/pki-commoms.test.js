import { describe, expect, test, it } from '@jest/globals'
import { Subject } from "../lib/commons"

describe("test Subject type",()=>{
    it("Subject instatiation",()=>{
        const subject = new Subject()
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
})