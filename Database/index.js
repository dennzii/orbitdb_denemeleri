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

let randDir = (Math.random() + 1).toString(36).substring(2)
const orbitdb = await createOrbitDB({ ipfs, directory: `./${randDir}/orbitdb` ,id:"server"})

app.get('/ekle', async function (req, res) {

  //Get request parametreleri sabitlere atanır.
  const key = req.query.key;
  const data = req.query.data

  //db'ye erişim sağlanır. Server scripti çalıştırılırken DB adresi parametre olarak verilmeli.
  const db = await orbitdb.open(process.argv[2])

  //Kayıt eklenir.
  await db.put(key.toString(),data.toString())

  //Kayıt oluşturulduktan sonra db instance'ı kapatılır
  await db.close()
  //Request sonladırılır.
  res.end()

  console.log("Kayit olusturuldu.")
});

//Bu kısım problemli.
app.get('/get', async function (req, res) {
  const key = req.query.key;

  const db = await orbitdb.open(process.argv[2])

  const address = db.address

  const record = await db.get(key.toString())

  await db.close()
  res.end()

  console.log("Kayit döndürüldü. "+record)
  
});

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


