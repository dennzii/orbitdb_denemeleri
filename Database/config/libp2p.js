import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { webSockets } from '@libp2p/websockets'
import { all } from '@libp2p/websockets/filters'
import { webRTC} from '@libp2p/webrtc'
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2'
import { noise } from '@chainsafe/libp2p-noise'
import { identify } from '@libp2p/identify'
import { yamux } from '@chainsafe/libp2p-yamux'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'


export const Libp2pOptions = {
  addresses: {
    listen: ['/ip4/0.0.0.0/tcp/0/ws']
  },
  transports: [
    webSockets({
      filter: all
    }),
    webRTC(),
    circuitRelayTransport({
      discoverRelays: 1
    })
  ],
  connectionEncryption: [noise()],
  streamMuxers: [yamux()],
  connectionGater: {
    denyDialMultiaddr: () => false
  },
  services: {
    identify: identify(),
    pubsub: gossipsub({ allowPublishToZeroPeers: true })
  }
}