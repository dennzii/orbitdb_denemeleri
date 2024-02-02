import { tcp } from '@libp2p/tcp'
import { identify } from '@libp2p/identify'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { mdns } from '@libp2p/mdns'

export const Libp2pOptions = {
  peerDiscovery: [
    /**
     * mDNS local olarak peer discovery'i sağlar fakat ileride dış internet üzerinde çalışılacağı için 
     * farklı bir yöntem seçilmeli. Libp2p docs kısmında ayrıntılı bir şekilde anlatılıyor. (dennzii)
     */
    mdns()
  ],
  addresses: {
    listen: ['/ip4/0.0.0.0/tcp/0']
  },
  transports: [
    tcp()
  ],
  connectionEncryption: [noise()],
  streamMuxers: [yamux()],
  services: {
    identify: identify(),
    pubsub: gossipsub({ allowPublishToZeroPeers: true })
  }
}
