# Sequence: Send/Receive P2P Message (Ping/Pong)

**Source Spec:** specs/p2p-messages.md, specs/p2p.md
**Existing Code:** src/p2p/HollowPeer.ts, src/p2p/P2PWebAppNetworkProvider.ts

## Participants

- **User**
- **FriendsView** (src/ui/FriendsView.ts)
- **HollowPeer** (src/p2p/HollowPeer.ts)
- **P2PWebAppNetworkProvider** (src/p2p/P2PWebAppNetworkProvider.ts)
- **P2PWebAppClient** (src/p2p/client/client.js)
- **Remote Peer**

## Sending Ping (Request-Response Pattern)

```
     ┌────┐                               ┌───────────┐                    ┌──────────┐                                                        ┌────────────────────────┐                   ┌───────────────┐              ┌───────────┐
     │User│                               │FriendsView│                    │HollowPeer│                                                        │P2PWebAppNetworkProvider│                   │P2PWebAppClient│              │Remote Peer│
     └──┬─┘                               └─────┬─────┘                    └─────┬────┘                                                        └────────────┬───────────┘                   └───────┬───────┘              └─────┬─────┘
        │Click "Test Connection" on friend card │                                │                                                                          │                                       │                            │      
        │──────────────────────────────────────>│                                │                                                                          │                                       │                            │      
        │                                       │                                │                                                                          │                                       │                            │      
        │                                       │       pingPeer(peerId)         │                                                                          │                                       │                            │      
        │                                       │───────────────────────────────>│                                                                          │                                       │                            │      
        │                                       │                                │                                                                          │                                       │                            │      
        │                                       │                                │────┐                                                                     │                                       │                            │      
        │                                       │                                │    │ Generate unique messageId                                           │                                       │                            │      
        │                                       │                                │<───┘                                                                     │                                       │                            │      
        │                                       │                                │                                                                          │                                       │                            │      
        │                                       │                                │────┐                                                                     │                                       │                            │      
        │                                       │                                │    │ messageId = `${messagePrefix}${messageCount++}`                     │                                       │                            │      
        │                                       │                                │<───┘                                                                     │                                       │                            │      
        │                                       │                                │                                                                          │                                       │                            │      
        │                                       │                                │ ╔════════════════════════════════════════════════════╗                   │                                       │                            │      
        │                                       │                                │ ║{method: 'ping', timestamp: Date.now(), messageId} ░║                   │                                       │                            │      
        │                                       │                                │ ╚════════════════════════════════════════════════════╝                   │                                       │                            │      
        │                                       │                                │────┐                                                                     │                                       │                            │      
        │                                       │                                │    │ Create IPingMessage                                                 │                                       │                            │      
        │                                       │                                │<───┘                                                                     │                                       │                            │      
        │                                       │                                │                                                                          │                                       │                            │      
        │                                       │                                │────┐                                                                     │                                       │                            │      
        │                                       │                                │    │ Store response callback                                             │                                       │                            │      
        │                                       │                                │<───┘                                                                     │                                       │                            │      
        │                                       │                                │                                                                          │                                       │                            │      
        │                                       │                                │────┐                                                                     │                                       │                            │      
        │                                       │                                │    │ pendingResponses.set(messageId, {onResponse, onTimeout, timeoutId}) │                                       │                            │      
        │                                       │                                │<───┘                                                                     │                                       │                            │      
        │                                       │                                │                                                                          │                                       │                            │      
        │                                       │                                │ ╔═════════════════════════════════════════════════════╗                  │                                       │                            │      
        │                                       │                                │ ║timeoutId = setTimeout(onTimeout, RESPONSE_TIMEOUT) ░║                  │                                       │                            │      
        │                                       │                                │ ╚═════════════════════════════════════════════════════╝                  │                                       │                            │      
        │                                       │                                │                    sendMessage(peerId, pingMessage)                      │                                       │                            │      
        │                                       │                                │─────────────────────────────────────────────────────────────────────────>│                                       │                            │      
        │                                       │                                │                                                                          │                                       │                            │      
        │                                       │                                │                                                                          │client.send(peerId, protocol, message) │                            │      
        │                                       │                                │                                                                          │──────────────────────────────────────>│                            │      
        │                                       │                                │                                                                          │                                       │                            │      
        │                                       │                                │                                                                          │                                       │Send ping via libp2p stream │      
        │                                       │                                │                                                                          │                                       │───────────────────────────>│      
        │                                       │                                │                                                                          │                                       │                            │      
        │                                       │                                │                                                                          │                                       │                            │      
        │                       ╔══════╤════════╪════════════════════════════════╪══════════════════════════════════════════════════════════════════════════╪═══════════════════════════════════════╪═════════════════╗          │      
        │                       ║ ALT  │  Peer reachable                         │                                                                          │                                       │                 ║          │      
        │                       ╟──────┘        │                                │                                                                          │                                       │                 ║          │      
        │                       ║               │                                │                                                                          │             Message sent              │                 ║          │      
        │                       ║               │                                │                                                                          │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                 ║          │      
        │                       ║               │                                │                                                                          │                                       │                 ║          │      
        │                       ║               │                                │                            Promise resolved                              │                                       │                 ║          │      
        │                       ║               │                                │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                                       │                 ║          │      
        │                       ║               │                                │                                                                          │                                       │                 ║          │      
        │                       ║               │                                │────┐                                                                     │                                       │                 ║          │      
        │                       ║               │                                │    │ Log "Ping sent, awaiting response..."                               │                                       │                 ║          │      
        │                       ║               │                                │<───┘                                                                     │                                       │                 ║          │      
        │                       ╠═══════════════╪════════════════════════════════╪══════════════════════════════════════════════════════════════════════════╪═══════════════════════════════════════╪═════════════════╣          │      
        │                       ║ [Peer unreachable]                             │                                                                          │                                       │                 ║          │      
        │                       ║               │                                │                                                                          │             throw Error               │                 ║          │      
        │                       ║               │                                │                                                                          │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                 ║          │      
        │                       ║               │                                │                                                                          │                                       │                 ║          │      
        │                       ║               │                                │                               throw Error                                │                                       │                 ║          │      
        │                       ║               │                                │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                                       │                 ║          │      
        │                       ║               │                                │                                                                          │                                       │                 ║          │      
        │                       ║               │                                │────┐                                                                     │                                       │                 ║          │      
        │                       ║               │                                │    │ Catch error, cleanup pendingResponse                                │                                       │                 ║          │      
        │                       ║               │                                │<───┘                                                                     │                                       │                 ║          │      
        │                       ║               │                                │                                                                          │                                       │                 ║          │      
        │                       ║               │                                │────┐                                                                     │                                       │                 ║          │      
        │                       ║               │                                │    │ pendingResponses.delete(messageId)                                  │                                       │                 ║          │      
        │                       ║               │                                │<───┘                                                                     │                                       │                 ║          │      
        │                       ║               │                                │                                                                          │                                       │                 ║          │      
        │                       ║               │                                │────┐                                                                     │                                       │                 ║          │      
        │                       ║               │                                │    │ clearTimeout(timeoutId)                                             │                                       │                 ║          │      
        │                       ║               │                                │<───┘                                                                     │                                       │                 ║          │      
        │                       ║               │                                │                                                                          │                                       │                 ║          │      
        │                       ║               │throw Error("Peer unreachable") │                                                                          │                                       │                 ║          │      
        │                       ║               │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                                                                          │                                       │                 ║          │      
        │                       ║               │                                │                                                                          │                                       │                 ║          │      
        │                       ║               │────┐                           │                                                                          │                                       │                 ║          │      
        │                       ║               │    │ Display error to user     │                                                                          │                                       │                 ║          │      
        │                       ║               │<───┘                           │                                                                          │                                       │                 ║          │      
        │                       ╚═══════════════╪════════════════════════════════╪══════════════════════════════════════════════════════════════════════════╪═══════════════════════════════════════╪═════════════════╝          │      
     ┌──┴─┐                               ┌─────┴─────┐                    ┌─────┴────┐                                                        ┌────────────┴───────────┐                   ┌───────┴───────┐              ┌─────┴─────┐
     │User│                               │FriendsView│                    │HollowPeer│                                                        │P2PWebAppNetworkProvider│                   │P2PWebAppClient│              │Remote Peer│
     └────┘                               └───────────┘                    └──────────┘                                                        └────────────────────────┘                   └───────────────┘              └───────────┘
```

## Receiving Ping and Responding with Pong

```
     ┌───────────┐          ┌───────────────┐                  ┌────────────────────────┐               ┌──────────┐                                                                                    
     │Remote Peer│          │P2PWebAppClient│                  │P2PWebAppNetworkProvider│               │HollowPeer│                                                                                    
     └─────┬─────┘          └───────┬───────┘                  └────────────┬───────────┘               └─────┬────┘                                                                                    
           │   Send ping message    │                                       │                                 │                                                                                         
           │───────────────────────>│                                       │                                 │                                                                                         
           │                        │                                       │                                 │                                                                                         
           │                        │     messageHandler(peerId, data)      │                                 │                                                                                         
           │                        │──────────────────────────────────────>│                                 │                                                                                         
           │                        │                                       │                                 │                                                                                         
           │                        │                                       │    messageHandler callback      │                                                                                         
           │                        │                                       │────────────────────────────────>│                                                                                         
           │                        │                                       │                                 │                                                                                         
           │                        │                                       │                                 │────┐                                                                                    
           │                        │                                       │                                 │    │ handleMessage(peerId, pingMessage)                                                 
           │                        │                                       │                                 │<───┘                                                                                    
           │                        │                                       │                                 │                                                                                         
           │                        │                                       │                                 │────┐                                                                                    
           │                        │                                       │                                 │    │ Parse and validate message                                                         
           │                        │                                       │                                 │<───┘                                                                                    
           │                        │                                       │                                 │                                                                                         
           │                        │                                       │                                 │────┐                                                                                    
           │                        │                                       │                                 │    │ Check message.method === 'ping'                                                    
           │                        │                                       │                                 │<───┘                                                                                    
           │                        │                                       │                                 │                                                                                         
           │                        │                                       │                                 │ ╔══════════════════════════════════════════════════════════════════════════════════════╗
           │                        │                                       │                                 │ ║{method: 'pong', timestamp: pingMessage.timestamp, messageId: pingMessage.messageId} ░║
           │                        │                                       │                                 │ ║Echo back timestamp and messageId for correlation                                     ║
           │                        │                                       │                                 │ ╚══════════════════════════════════════════════════════════════════════════════════════╝
           │                        │                                       │                                 │────┐                                                                                    
           │                        │                                       │                                 │    │ Create IPongMessage                                                                
           │                        │                                       │                                 │<───┘                                                                                    
           │                        │                                       │                                 │                                                                                         
           │                        │                                       │sendMessage(peerId, pongMessage) │                                                                                         
           │                        │                                       │<────────────────────────────────│                                                                                         
           │                        │                                       │                                 │                                                                                         
           │                        │client.send(peerId, protocol, message) │                                 │                                                                                         
           │                        │<──────────────────────────────────────│                                 │                                                                                         
           │                        │                                       │                                 │                                                                                         
           │  Send pong response    │                                       │                                 │                                                                                         
           │<───────────────────────│                                       │                                 │                                                                                         
           │                        │                                       │                                 │                                                                                         
           │                        │                                       │                                 │────┐                                                                                    
           │                        │                                       │                                 │    │ Log "Responded to ping from peer"                                                  
           │                        │                                       │                                 │<───┘                                                                                    
     ┌─────┴─────┐          ┌───────┴───────┐                  ┌────────────┴───────────┐               ┌─────┴────┐                                                                                    
     │Remote Peer│          │P2PWebAppClient│                  │P2PWebAppNetworkProvider│               │HollowPeer│                                                                                    
     └───────────┘          └───────────────┘                  └────────────────────────┘               └──────────┘                                                                                    
```

## Receiving Pong (Completing Request-Response)

```
     ┌───────────┐          ┌───────────────┐          ┌────────────────────────┐           ┌──────────┐                                                         ┌───────────┐                 ┌────┐           
     │Remote Peer│          │P2PWebAppClient│          │P2PWebAppNetworkProvider│           │HollowPeer│                                                         │FriendsView│                 │User│           
     └─────┬─────┘          └───────┬───────┘          └────────────┬───────────┘           └─────┬────┘                                                         └─────┬─────┘                 └──┬─┘           
           │   Send pong message    │                               │                             │                                                                    │                          │             
           │───────────────────────>│                               │                             │                                                                    │                          │             
           │                        │                               │                             │                                                                    │                          │             
           │                        │ messageHandler(peerId, data)  │                             │                                                                    │                          │             
           │                        │──────────────────────────────>│                             │                                                                    │                          │             
           │                        │                               │                             │                                                                    │                          │             
           │                        │                               │  messageHandler callback    │                                                                    │                          │             
           │                        │                               │────────────────────────────>│                                                                    │                          │             
           │                        │                               │                             │                                                                    │                          │             
           │                        │                               │                             │────┐                                                               │                          │             
           │                        │                               │                             │    │ handleMessage(peerId, pongMessage)                            │                          │             
           │                        │                               │                             │<───┘                                                               │                          │             
           │                        │                               │                             │                                                                    │                          │             
           │                        │                               │                             │────┐                                                               │                          │             
           │                        │                               │                             │    │ Parse and validate message                                    │                          │             
           │                        │                               │                             │<───┘                                                               │                          │             
           │                        │                               │                             │                                                                    │                          │             
           │                        │                               │                             │────┐                                                               │                          │             
           │                        │                               │                             │    │ Check message.method === 'pong'                               │                          │             
           │                        │                               │                             │<───┘                                                               │                          │             
           │                        │                               │                             │                                                                    │                          │             
           │                        │                               │                             │────┐                                                               │                          │             
           │                        │                               │                             │    │ Look up response handler                                      │                          │             
           │                        │                               │                             │<───┘                                                               │                          │             
           │                        │                               │                             │                                                                    │                          │             
           │                        │                               │                             │────┐                                                               │                          │             
           │                        │                               │                             │    │ pendingResponse = pendingResponses.get(pongMessage.messageId) │                          │             
           │                        │                               │                             │<───┘                                                               │                          │             
           │                        │                               │                             │                                                                    │                          │             
           │                        │                               │                             │                                                                    │                          │             
           │                        │                               │             ╔══════╤════════╪════════════════════════════════════════════════════════════════════╪══════════════════════════╪════════════╗
           │                        │                               │             ║ ALT  │  Response handler found                                                     │                          │            ║
           │                        │                               │             ╟──────┘        │                                                                    │                          │            ║
           │                        │                               │             ║               │────┐                                                               │                          │            ║
           │                        │                               │             ║               │    │ Calculate round-trip time                                     │                          │            ║
           │                        │                               │             ║               │<───┘                                                               │                          │            ║
           │                        │                               │             ║               │                                                                    │                          │            ║
           │                        │                               │             ║               │────┐                                                               │                          │            ║
           │                        │                               │             ║               │    │ rtt = Date.now() - pongMessage.timestamp                      │                          │            ║
           │                        │                               │             ║               │<───┘                                                               │                          │            ║
           │                        │                               │             ║               │                                                                    │                          │            ║
           │                        │                               │             ║               │────┐                                                               │                          │            ║
           │                        │                               │             ║               │    │ Clear timeout                                                 │                          │            ║
           │                        │                               │             ║               │<───┘                                                               │                          │            ║
           │                        │                               │             ║               │                                                                    │                          │            ║
           │                        │                               │             ║               │────┐                                                               │                          │            ║
           │                        │                               │             ║               │    │ clearTimeout(pendingResponse.timeoutId)                       │                          │            ║
           │                        │                               │             ║               │<───┘                                                               │                          │            ║
           │                        │                               │             ║               │                                                                    │                          │            ║
           │                        │                               │             ║               │────┐                                                               │                          │            ║
           │                        │                               │             ║               │    │ Remove from pending map                                       │                          │            ║
           │                        │                               │             ║               │<───┘                                                               │                          │            ║
           │                        │                               │             ║               │                                                                    │                          │            ║
           │                        │                               │             ║               │────┐                                                               │                          │            ║
           │                        │                               │             ║               │    │ pendingResponses.delete(pongMessage.messageId)                │                          │            ║
           │                        │                               │             ║               │<───┘                                                               │                          │            ║
           │                        │                               │             ║               │                                                                    │                          │            ║
           │                        │                               │             ║               │────┐                                                               │                          │            ║
           │                        │                               │             ║               │    │ Execute response callback                                     │                          │            ║
           │                        │                               │             ║               │<───┘                                                               │                          │            ║
           │                        │                               │             ║               │                                                                    │                          │            ║
           │                        │                               │             ║               │────┐                                                               │                          │            ║
           │                        │                               │             ║               │    │ pendingResponse.onResponse(rtt)                               │                          │            ║
           │                        │                               │             ║               │<───┘                                                               │                          │            ║
           │                        │                               │             ║               │                                                                    │                          │            ║
           │                        │                               │             ║               │────┐                                                               │                          │            ║
           │                        │                               │             ║               │    │ Fire pingReceived event                                       │                          │            ║
           │                        │                               │             ║               │<───┘                                                               │                          │            ║
           │                        │                               │             ║               │                                                                    │                          │            ║
           │                        │                               │             ║               │────┐                                                               │                          │            ║
           │                        │                               │             ║               │    │ eventService.emit('pingReceived', {peerId, rtt})              │                          │            ║
           │                        │                               │             ║               │<───┘                                                               │                          │            ║
           │                        │                               │             ║               │                                                                    │                          │            ║
           │                        │                               │             ║               │                       Event listener fired                         │                          │            ║
           │                        │                               │             ║               │───────────────────────────────────────────────────────────────────>│                          │            ║
           │                        │                               │             ║               │                                                                    │                          │            ║
           │                        │                               │             ║               │                                                                    │────┐                     │            ║
           │                        │                               │             ║               │                                                                    │    │ Display RTT to user │            ║
           │                        │                               │             ║               │                                                                    │<───┘                     │            ║
           │                        │                               │             ║               │                                                                    │                          │            ║
           │                        │                               │             ║               │                                                                    │   "Latency: {rtt}ms"     │            ║
           │                        │                               │             ║               │                                                                    │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ >│            ║
           │                        │                               │             ╠═══════════════╪════════════════════════════════════════════════════════════════════╪══════════════════════════╪════════════╣
           │                        │                               │             ║ [Response handler not found]                                                       │                          │            ║
           │                        │                               │             ║               │────┐                                                               │                          │            ║
           │                        │                               │             ║               │    │ Log warning "Received pong for unknown messageId"             │                          │            ║
           │                        │                               │             ║               │<───┘                                                               │                          │            ║
           │                        │                               │             ║               │                                                                    │                          │            ║
           │                        │                               │             ║               │ ╔═════════════════════════════════════════════════════════════════╗│                          │            ║
           │                        │                               │             ║               │ ║Could be duplicate response or very late response after timeout ░║│                          │            ║
           │                        │                               │             ╚═══════════════╪═╚═════════════════════════════════════════════════════════════════╝╪══════════════════════════╪════════════╝
     ┌─────┴─────┐          ┌───────┴───────┐          ┌────────────┴───────────┐           ┌─────┴────┐                                                         ┌─────┴─────┐                 ┌──┴─┐           
     │Remote Peer│          │P2PWebAppClient│          │P2PWebAppNetworkProvider│           │HollowPeer│                                                         │FriendsView│                 │User│           
     └───────────┘          └───────────────┘          └────────────────────────┘           └──────────┘                                                         └───────────┘                 └────┘           
```

## Response Timeout

```
     ┌──────────┐                              ┌───────────┐                   ┌────┐    
     │HollowPeer│                              │FriendsView│                   │User│    
     └─────┬────┘                              └─────┬─────┘                   └──┬─┘    
      ╔════╧═════════════════════════════════════════╧════════════════════════════╧═════╗
      ║If no pong received within RESPONSE_TIMEOUT (default: 10 seconds)               ░║
      ╚════╤═════════════════════════════════════════╤════════════════════════════╤═════╝
           │────┐                                    │                            │      
           │    │ Timeout handler fires              │                            │      
           │<───┘                                    │                            │      
           │                                         │                            │      
           │────┐                                    │                            │      
           │    │ pendingResponse.onTimeout()        │                            │      
           │<───┘                                    │                            │      
           │                                         │                            │      
           │────┐                                    │                            │      
           │    │ pendingResponses.delete(messageId) │                            │      
           │<───┘                                    │                            │      
           │                                         │                            │      
           │────┐                                    │                            │      
           │    │ Log "Ping timeout for peer"        │                            │      
           │<───┘                                    │                            │      
           │                                         │                            │      
           │        Error callback executed          │                            │      
           │────────────────────────────────────────>│                            │      
           │                                         │                            │      
           │                                         │────┐                       │      
           │                                         │    │ Display timeout error │      
           │                                         │<───┘                       │      
           │                                         │                            │      
           │                                         │"Connection test timed out" │      
           │                                         │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ >│      
     ┌─────┴────┐                              ┌─────┴─────┐                   ┌──┴─┐    
     │HollowPeer│                              │FriendsView│                   │User│    
     └──────────┘                              └───────────┘                   └────┘    
```

## Spec Intent

Matches spec requirements:
- **Request-Response Pattern**: Correlate requests and responses via messageId
- **Round-Trip Time**: Calculate latency from timestamp echo
- **Timeout Handling**: Clean up stale pending responses
- **Type Safety**: TypeScript discriminated unions (IPingMessage | IPongMessage)
- **Asynchronous**: Non-blocking with callback pattern
- **Error Handling**: Gracefully handle unreachable peers and timeouts

## Analysis

### Correctly Implemented ✅

1. **Message ID Correlation**: Unique IDs for each request, matched in response
2. **Timestamp Echo**: Original timestamp returned in pong for RTT calculation
3. **Pending Responses Map**: Store callbacks with timeout cleanup
4. **Timeout Handling**: Automatic cleanup after RESPONSE_TIMEOUT
5. **Event Emission**: pingReceived event for UI reactivity
6. **Error Handling**: Peer unreachable and timeout both handled gracefully
7. **Auto-Response**: Ping automatically triggers pong (no user intervention)
8. **Duplicate Protection**: Warn on unknown messageId (late/duplicate pong)

### No Issues Found

Implementation follows request-response pattern correctly with proper error handling and cleanup.
