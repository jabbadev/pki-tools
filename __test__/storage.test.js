
import { loadStoragePlugin } from "../lib/storage"
import { describe, expect, test, it } from '@jest/globals'

describe("Load storage plugin", ()=>{
    it("load fs storage", async ()=>{
        const storageModule = await loadStoragePlugin('fs')
        expect(storageModule).toBe({})

    })
})