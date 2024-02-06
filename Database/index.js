/**
 * TO DO
 * Gönderi oluşturma,
 * Gönderi görüntüleme,
 * Gönderi Kabul etme(?),
 * Requestleri eklenmeli
 */

import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { createOrbitDB } from '@orbitdb/core'

import { Libp2pOptions } from './config/libp2p.js'

//Server yaratılır
import express from "express"
const app = express();
const server = app.listen(8000, func);

const libp2p = await createLibp2p(Libp2pOptions)
const ipfs = await createHelia({ libp2p })

const orbitdb = await createOrbitDB({ ipfs, directory: `./db/orbitdb` ,id:"server"})

let db = await orbitdb.open(process.argv[2])

db.all()

app.get('/addcargo', async function (req, res) {

  //Get request parametreleri sabitlere atanır. Daha fazla çeşit de eklenebilir ihtiyaca göre.
  const id = req.query.id
  const name = req.query.name
  const lot = req.query.lot

  //Verilerin JSON formatında paketlenmesi
  const entry = {
    _id : id,
    _name : name,
    _lot : lot
  }

  //db'ye erişim sağlanır. Server scripti çalıştırılırken DB adresi parametre olarak verilmeli.
  db = await orbitdb.open(process.argv[2])
  //Kayıt eklenir. pin:true ile data ipfs'e pinlenir ve GC'den etkilenmez.
  await db.put(entry,{pin:true})

  //Request sonladırılır.
  res.end()

  console.log("Kayit olusturuldu.")
});

//id'si verilen kaydın döndürülmesi
app.get('/get', async function (req, res) {

  const key = req.query.key;

  const address = db.address

  const record = await db.get(key.toString())

  res.end()

  console.log("Kayit döndürüldü. "+record)
  
});

app.get('/getall', async function (req, res) {

  //Tüm kayıtları döndüren req.
  const address = db.address

  for await (const record of db.iterator()) {
    console.log(record)
  }

  res.end()

  console.log("Tüm Kayitlar döndürüldü. ")
  
});

if(db)
{
  db.events.on('update', async (entry) => {
    console.log('entry', entry)
    
    // Replikasyonu tamamlanmasını sağlar. Eğer DB'de bir update var ise replikasyon gerçekleştirilir.
    await db.all()
  })
}


function func()
{
	console.log("Sunucu 8000 portu uzerine calisiyor...");
}

// Eğer ctrl+c ile process terminate edilmek istenirse ipfs ve orbitdb durdurlur.
process.on('SIGINT', async () => {
  
  await db.close()
  await orbitdb.stop()
  await ipfs.stop()

  process.exit()
})

/**
  await orbitdb.stop()
  await ipfs.stop()
 */


