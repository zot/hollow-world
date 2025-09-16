# this is the p2p API for the Hollow World game

# based on ../claude.md

# use SOLID principals

# make unit tests

# uses libp2p and helia

# uses a persistent HollowPeer object to track the session
## loaded on session start, saved when edited
## fields
- privateKey: stores the libp2p peer ID's private key
- friends: a map of friend's names -> their peer IDs

## the HollowPeer object should reload on startup and restory the peer ID from the persisted private key
- use a libp2pInit object with createLibp2p
- supply the persisted private key as the privateKey property of the libp2pInit object

## methods
- getPeerId(): returns persistent peer ID
- addFriend(name, friendPeerId): adds a friend's name and peerid to persistent a name
