// @ts-ignore
import protoLib from './protocol.js'

namespace proto {
  export type PeerID = string
  export type ConID = BigInt

  export declare var relayErrors: any
  export declare var errors: any
  export declare var utfDecoder: TextDecoder
  export declare var utfEncoder: TextEncoder

  export declare function connect(
    peerID: string,
    protocol: string,
    frames: boolean
  ): void
  export declare function listen(protocol: string, frames: boolean): void
  export declare function close(conID: ConID, callback?: () => void): void
  export declare function stop(
    protocol: string,
    retainConnections: boolean
  ): void
  export declare function start(
    treeProtocol: string,
    treeName: string,
    port: number,
    peerKey: string
  ): void
  export declare function startProtocol(
    url: string,
    handler: P2pHandler
  ): WebSocket
  export declare function encode_ascii85(str: string): string
  export declare function decode_ascii85(str: string): string
  export declare function connectionError(
    conID: ConID,
    code: string,
    msg: string,
    isCatastrophic: boolean,
    extra?: any
  ): void
  export declare function sendObject(
    conID: ConID,
    object: any,
    callback?: () => void
  ): void

  export declare class ConnectionInfo {
    conID: ConID
    peerID: PeerID
    protocol: string
    incoming: boolean
    outgoing: boolean

    constructor(conID: ConID, peerID: PeerID, protocol: string)
  }
  export interface P2pHandler {
    hello(running: boolean, thisVersion: string, currentVersion: string): any
    ident(
      status: any,
      peerID: any,
      addresses: string[],
      peerKey: string,
      currentVersion: string,
      hasNat: boolean
    ): any
    listenerConnection(conID: ConID, peerID: PeerID, protocol: string): any
    connectionClosed(conID: any, msg: any): any
    data(conID: any, data: any, obj: any): any // obj is optionally a JSON obj
    listenRefused(protocol: any): any
    listenerClosed(protocol: any): any
    peerConnection(conID: any, peerID: any, prot: any): any
    peerConnectionRefused(peerID: any, prot: any, msg: any): any
    error(msg: any): any
    listening(protocol: any): any
    accessChange(access: string): any
  }
  export declare class DelegatingHandler<H extends P2pHandler>
    implements P2pHandler
  {
    delegate: H

    constructor(delegate: H)
    hello(running: boolean, thisVersion: string, currentVersion: string): any
    ident(
      status: any,
      peerID: any,
      addresses: any,
      peerKey: string,
      currentVersion: string,
      hasNat: boolean
    ): any
    listenerConnection(conID: ConID, peerID: PeerID, protocol: string): any
    connectionClosed(conID: any, msg: any): any
    data(conID: any, data: any, obj: any): any // obj is optionally a JSON obj
    listenRefused(protocol: any): any
    listenerClosed(protocol: any): any
    peerConnection(conID: any, peerID: any, prot: any): any
    peerConnectionRefused(peerID: any, prot: any, msg: any): any
    error(msg: any): any
    listening(protocol: any): any
    accessChange(access: string): any
  }
  export declare class TrackingHandler<
    H extends P2pHandler,
  > extends DelegatingHandler<H> {
    constructor(delegate: H, connections: any)
  }

  export declare class LoggingHandler<
    H extends P2pHandler,
  > extends DelegatingHandler<H> {
    constructor(delegate: H)
  }
  export declare class CommandHandler<
    H extends P2pHandler,
  > extends DelegatingHandler<H> {
    connections: any
    commandConnections: Set<ConID>
    protocols: Set<string>

    constructor(
      delegate: H,
      connections: any,
      commands: any,
      delegateData: boolean,
      protocols: string[]
    )
  }
  export declare class RelayService<
    H extends P2pHandler,
  > extends CommandHandler<H> {
    constructor(
      connections: any,
      delegate: H,
      relayReceiver: any,
      relayProtocol: string
    )
    enableRelay(peerID: PeerID, protocol: string): any
    startRelay(): any
    stopRelay(): any
    enableHost(peerID: PeerID, protocol: string): any
  }
  export declare class RelayClient {
    addConnection(peerID: PeerID, protocol: string, incoming: boolean): any
  }
  export declare class RelayHost extends RelayClient {
    constructor(
      connections: any,
      handler: any,
      delegate: any,
      protocol: string,
      mainProtocol: string
    )
  }
  export declare function getInfoForPeerAndProtocol(
    connections: any,
    peerID: PeerID,
    protocol: string
  ): ConnectionInfo
}

Object.assign(proto, protoLib) // patch library into typescript namespace, proto

export default proto
