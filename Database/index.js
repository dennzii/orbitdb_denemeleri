import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { createOrbitDB } from '@orbitdb/core'
import { Libp2pOptions } from './config/libp2p.js'

// Create an IPFS instance.
const libp2p = await createLibp2p(Libp2pOptions)
const ipfs = await createHelia({ libp2p })

const orbitdb = await createOrbitDB({ ipfs })

const db = await orbitdb.open('my-db')

console.log('my-db address', db.address)

// Add some records to the db.
await db.add('hello world 1')
await db.add('hello world 2')

// Print out the above records.
console.log(await db.all())

// Close your db and stop OrbitDB and IPFS.
await db.close()
await orbitdb.stop()
await ipfs.stop()