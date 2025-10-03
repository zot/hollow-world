# 🌐 P2P Networking Specification

**Peer-to-peer API for the Hollow World game**

*Based on [`../CLAUDE.md`](../CLAUDE.md)*

## 🎯 Core Requirements
- Use **SOLID principles** in all implementations
- Create comprehensive **unit tests** for all components
- Use **HTML templates** instead of JavaScript template literals *(Separate your concerns like a good sheriff)*

## 🔧 Technology Stack
- **LibP2P** - Decentralized networking protocol
  - gossipsub - For Pubsub communication, info [here](https://libp2p.github.io/js-libp2p/modules/_libp2p_gossipsub.html)
  - js-libp2p's webrtc - for direct communication 
- **Helia** - IPFS implementation for data storage

### HollowPeer class holds the peer-to-peer code

### 💾 Persistent Session Tracking
- **Loaded on session start**, saved when edited

### 🔑 Data Fields
- **`privateKey`**: Stores the LibP2P peer ID's private key
- **`friends`**: Map of friend names → their peer IDs

### 🔄 Session Restoration
- **Startup process**: Reload HollowPeer object and restore peer ID from persisted private key
- **LibP2P initialization**: Use `createLibp2p` with `libp2pInit` object
- **Private key supply**: Include persisted private key as `privateKey` property

## Friends
### each friend has
- peer id
- player name
- notes: private notes on that friend (not sent in any messages)

### Invitations
- there is an `activeInvitations` Object (functions as a Map)
  - stores mapping of invite code -> [friendName,friendId]
  - friendId can be null

## Connections
- `pending` holds connections from unknown peers

## 🔧 API Methods

### Core Network Functions
- **`getPeerId()`**: Returns persistent peer ID
- **`addFriend(name, friendPeerId)`**: Adds friend's name and peer ID to persistent storage

### Implementation Details
- **Network provider interface**: [`src/p2p.ts`](../src/p2p.ts)
- **Storage integration**: Uses LocalStorageProvider for persistence
- **Error handling**: Graceful degradation when network fails

## P2P App protocol

### How it works
- Peers connect to each other with a `WebRTC Direct` connection or, failing that, a `WebRTC` connection
- Upon connection, each peer sends an `identify` message (see below)

### Structure of app messages
#### `specs/p2p-messages.md` has the JSON specifiation for messages.

#### VERY IMPORTANT: DO NOT CHANGE protocol message structures unless specifically directed to by the `specs/p2p.md` file.

#### P2P messages are JSON objects, each one containing
- `method` -- indicates the method to execute, defined below
- other properties are method-specific

#### P2P Communication Procedure
Listen for well-formatted incoming p2p messages on peer connections and execute them.

Each p2p message will have a corresponding p2p method implementation in the HollowPeer class

##### When a peer connects, the first message received must be `identify`
- check if the first message is `identify`
  - if not, close the connection
  - if so, check if the peer is in the 

#### Receiving P2P Messages
- identify(date, nonce, signature)
  - message properties
    - date is the current UTC date
    - nonce is a random string
    - signature is the digital signature of nonce
      - signed by the private key of the peer that creates the message
  - behavior on receiving peer: validate that
    - the date is within 10 seconds
    - the signature is valid
      - check that it is indeed produced by the peer that is sending the message
      - otherwise close the connection and log the 
- requestFriend(inviteCode)
  - message properties
  - behavior on receiving peer: if valid, present the user with the request
    - check activeInvitations Object for inviteCode entry (see Invitations, above)
    - if entry has a friendId, verfy that it matches the 
- approveFriendRequest
