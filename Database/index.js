/**
 * TO DO
 * + Gönderi oluşturma, mobil uygulamada createCargo çağrılcak. Burdan da addcargo reuesti ile kargonun bilgileri oluşturulacak.
 * + Gönderi görüntüleme, Bu şu an çalışıyor.
 * + Acc register, Bu da çalışıyor. Bu sadece server admini tarafından yapılabilmeli. Kullanıcı sisteme register yaparken bunu da çağırmalı.
 * - Kargonun şu an kimde olduğuna dair anlamlı veri kullanıcıya sunulabilir.
 * - Libp2p dış internet üzerinden haberleşebilecek şekilde konfigüre edilmeli.
 * - Depolamanın kalıcı olması sağlandı fakat
 */

import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { createOrbitDB } from '@orbitdb/core'

import { Libp2pOptions } from './config/libp2p.js'

import express from "express"

import { ethers } from "ethers"
import { ALCHEMY_API_KEY, PRIVATE_KEY } from "./api_keys.js"
import { CONTRACT_ABI } from "./abi.js"

const app = express();
const server = app.listen(8000, func);

const libp2p = await createLibp2p(Libp2pOptions)
const ipfs = await createHelia({ libp2p })
const orbitdb = await createOrbitDB({ ipfs, directory: `./db/orbitdb` ,id:"server"})
let db = await orbitdb.open(process.argv[2])

//Kontratla etkileşim için gereken tanımlamalar.
const CONTRACT_ADDR = "0xc66dC72dbEbF537824cf47bc1c546099a5d42d5B"
const provider = new ethers.providers.JsonRpcProvider(ALCHEMY_API_KEY)
const wallet = new ethers.Wallet(PRIVATE_KEY, provider)
const contract = new ethers.Contract(CONTRACT_ADDR, CONTRACT_ABI, wallet);

console.log(orbitdb.identity.id)


//Sadece mobil uygulama tarafında çağrılabilir.
app.get('/addcargo', async function (req, res) {

  //Get request parametreleri sabitlere atanır. Daha fazla çeşit de eklenebilir ihtiyaca göre.
  const id = req.query.id
  const name = req.query.name
  const lot = req.query.lot

  //Verilerin JSON formatında paketlenmesi
  const entry = {
    _id : parseInt(id),
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

app.get('/getall', async function (req, res) {

  //Tüm kayıtları döndüren req.
  const address = db.address

  for await (const record of db.iterator()) {
    console.log(record)
  }

  res.end()

  console.log("Tüm Kayitlar döndürüldü. ")
  
});

app.get('/get', async function (req, res) {

  //Tüm kayıtları döndüren req.
  const address = db.address
  const id = req.query.id;

  //Bu kısım kontrattaki skargo verisini çeker.
  const cargo  = await getCargoDetails(id)
  const rec = await getCargoFromOrbitDB(parseInt(id))

  const json = {
   sender: cargo.sender,
   reciever : cargo.receiver ,
   current : cargo.current ,
   status : cargo.status ,
   cargoID : cargo.cargoID ,
    orbitdbRec : rec
  }
  
  //Burada ilgili kargonun bilgilerine orbitDB'den ulaşılır.
  
  console.log(json)

  res.json(json)

  console.log("Tüm Kayitlar döndürüldü.")
  
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

//Kargoya ait bilgilerin orbitDB'den çekilmesi.
async function getCargoFromOrbitDB(id)
{
  const record = await db.get(id)

  return record
}


//Bu mobil kullanıcılar register yaparken kullanılacak.
app.get('/rgstrAddr', async function (req, res) {
    const addr = req.query.addr
    const name = req.query.namen

    //İlk önce on-chain olarak işlem gerçekleştirilir.
    const result = registerAddress(addr)

    //Eğer tx başarılı olursa orbitdb'ye entry yapılır.
    if(result)
    {
      const entry = {
        _id : addr,
        _name : name
      }
      
      //kaydedilen kişinin on-chain adresi ve ismi cismi kaydedilir.
      await db.put(entry,{pin:true})

    }

    res.end()
    
});


//On-chain fonksiyonlar

//Kontrat üzerindeki sipariş verileri çekilir.
async function getCargoDetails(cargoID) {
	const cargo = {
		sender: '',
		receiver: '',
		current: '',
		status: 0,
		cargoID: 0,
	}

	const tx = await contract.getCargoDetails(cargoID);

	cargo.sender = tx[0];
	cargo.receiver = tx[1];
	cargo.current = tx[2];
	cargo.status = tx[3];
	cargo.cargoID = tx[4].toString();

	return cargo
}

//Kontrata parametre olarak verilen adres kayıt edilir.
async function registerAddress(addr) {
  try {
    const tx = await contract.registerAddress(addr);

    await tx.wait();
    
    console.log("Transaction basarili!");
    return true
  } catch (error) {
    console.error("Hata:", error);
    return false
  }
}

// Eğer ctrl+c ile process terminate edilmek istenirse ipfs ve orbitdb durdurlur.
process.on('SIGINT', async () => {
  
  await db.close()
  await orbitdb.stop()
  await ipfs.stop()

  await server.close()
  process.exit()
})


