import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { createOrbitDB, IPFSAccessController } from '@orbitdb/core'

import { Libp2pOptions } from './config/libp2p.js'

//CID'yi yaratmak için lazım.
import { base58btc } from 'multiformats/bases/base58'
import { CID } from 'multiformats/cid'


const main = async () => {  
  
  const libp2p = await createLibp2p(Libp2pOptions)
  const ipfs = await createHelia({ libp2p })

  // create a random directory to avoid OrbitDB conflicts.
  let randDir = (Math.random() + 1).toString(36).substring(2)
  const orbitdb = await createOrbitDB({ ipfs, directory: `./${randDir}/orbitdb` ,id:"peer2"})

  let db

  if (process.argv[2]) {
    db = await orbitdb.open(process.argv[2])
  } else {
    // When we open a new database, write access is only available to the 
    // db creator. When replicating a database on a remote peer, the remote 
    // peer must also have write access. Here, we are simply allowing anyone 
    // to write to the database. A more robust solution would use the 
    // OrbitDBAccessController to provide "fine-grain" access using grant and 
    // revoke. 
    db = await orbitdb.open('my-db',{type:'keyvalue', AccessController: IPFSAccessController({ 
      write: ['*']

    })})
  }

  // Copy this output if you want to connect a peer to another.
  console.log(orbitdb.identity.id)
  console.log('my-db address', db.address)

  /* CID yazdırmak için kod parçası ama nedense çalışmıyor.
   const addr = OrbitDBAddress(db.address)
  const cid = CID.parse(addr.path, base58btc)
  console.log('CID:'+cid)
   */

  // Add some records to the db when another peers joins.
  db.events.on('join', async (peerId, heads) => {
    console.log("Join gerceklesti")
  })

  db.events.on('update', async (entry) => {
    console.log('entry', entry)
    
    // To complete full replication, fetch all the records from the other peer.
    await db.all()
  })

  // Clean up when stopping this app using ctrl+c
  process.on('SIGINT', async () => {
      // Close your db and stop OrbitDB and IPFS.
      await db.close()
      await orbitdb.stop()
      await ipfs.stop()

      process.exit()
  })

  

}

main()