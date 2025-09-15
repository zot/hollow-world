# this is the p2p API for the Hollow World game

# based on ../claude.md

# use SOLID principals

# make unit tests

# uses libp2p and helia

# uses a persistent HollowPeer object to track the session
## loaded on session start, saved when edited
## fields
- peerID: stores the libp2p peer ID
- friends: a map of friend's names -> their peer IDs

## methods
- getPeerId(): returns persistent peer ID
- addFriend(name, friendPeerId): adds a friend's name and peerid to persistent a name
