import { loadStoragePlugin, loadStorage} from "../lib/storage"
import { describe, expect, test, it } from '@jest/globals'

describe("Load storage plugin", ()=>{
    it("load test plugin storage", async ()=>{
        const storage = loadStorage('test-storage')
    })
})