import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { createOrbitDB } from '@orbitdb/core'

import { Libp2pOptions } from './config/libp2p.js'

import express from "express"
const app = express();
const server = app.listen(8000, initServer);

const libp2p = await createLibp2p(Libp2pOptions)
const ipfs = await createHelia({ libp2p })

let randDir = (Math.random() + 1).toString(36).substring(2)
const orbitdb = await createOrbitDB({ ipfs, directory: `./${randDir}/orbitdb` ,id:"peer2"})

//data base login için conf

app.get('/ekle', async function (req, res) {

  const key = req.query.key;
  const data = req.query.data

  const db = await orbitdb.open(process.argv[2])

  const address = db.address
  console.log(address)

  await db.put(key.toString(),data.toString())

  await db.close()
  res.end()
  console.log("Kayit olusturuldu.")
  
});

app.get('/get', async function (req, res) {


  const key = req.query.key;

  const db = await orbitdb.open(process.argv[2])

  const address = db.address

  const record = await db.get(key.toString())

  await db.close()
  res.end()
  
  console.log("Kayit döndürüldü. "+record)
  
});


async function initServer()
{
	console.log("Sunucu 8000 portu uzerine calisiyor...");
}

/**
  await orbitdb.stop()
  await ipfs.stop()
 */


