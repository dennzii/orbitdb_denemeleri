/** 
 * TO DO
 * Grant Access mekanizması eklenecek
 * En mantıklı storage seçimi yapılmalı
 * 
 */

import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'

import { createOrbitDB, IPFSAccessController } from '@orbitdb/core'
import { Libp2pOptions } from './config/libp2p.js'

import { LevelBlockstore } from 'blockstore-level'

//CID'yi yaratmak için lazım.
import { base58btc } from 'multiformats/bases/base58'
import { CID } from 'multiformats/cid'


const main = async () => {  

  //ipfs blockstorage ile veri process terminate edilse bile veritabanında tutulur.
  const blockstore = new LevelBlockstore('./ipfs')
  const libp2p = await createLibp2p(Libp2pOptions)
  const ipfs = await createHelia({ libp2p, blockstore})
  
  const orbitdb = await createOrbitDB({ ipfs, directory: `./$db/orbitdb` ,id:"peer"})

  let db

  if (process.argv[2]) {
    db = await orbitdb.open(process.argv[2])
  } else {
    //Herkesin write işlemi yapabilecek şekilde konfigüre edildi.
    //Eğer istenirse 'write' attribute'u sadece belirli identitye sahip peer'ların işlem yapabileceği şekilde değiştirilebilir.
    //Default olarak veri memoryde tutuluyor. Bu da peer kapatıldığına verinin yok olması demek. Helia'nın faklı depolama çözümleri kullanılmalı.
    db = await orbitdb.open('my-db',{type:'documents', AccessController: IPFSAccessController({ 
      write: ['*']
      
    })})
  }

  //db adresi yazdırılır, adres diğer peer'a verilerek bağlantı sağlanır.
  console.log(orbitdb.identity.id)
  console.log('my-db address', db.address)

  /* CID yazdırmak için kod parçası ama nedense çalışmıyor.
  const addr = OrbitDBAddress(db.address)
  const cid = CID.parse(addr.path, base58btc)
  console.log('CID:'+cid)
   */

  //Eğer bir peer katılırsa body'deki komutlar çağırılır.
  db.events.on('join', async (peerId, heads) => {
    console.log("Join gerceklesti")
    
  })

  //Eğer db'ye bir entry eklenirse body'deki komutlar çağırılır.
  db.events.on('update', async (entry) => {
    console.log('entry', entry)
    
    // To complete full replication, fetch all the records from the other peer.
    await db.all()
  })

  // Eğer ctrl+c ile process terminate edilmek istenirse ipfs ve orbitdb durdurlur.
  process.on('SIGINT', async () => {
      // Close your db and stop OrbitDB and IPFS.
      await db.close()
      await orbitdb.stop()
      await ipfs.stop()

      process.exit()
  })
}

main()