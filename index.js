
import { genCaCert, setupPkiFs, dumpCaKeys } from './lib/pkiutils.js'
import path from 'path';

setupPkiFs()
genCaCert().then(dumpCaKeys)
