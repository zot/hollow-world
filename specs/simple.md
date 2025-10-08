# simple p2p POC

## peer-to-peer web app in the `simple` directory
- do not look into any other `src` or `spec` files
- connect to helia
  - examples:
    - https://medium.com/coinmonks/building-a-debate-app-part-15-71349e9b1083
    - https://github.com/ipfs-examples/helia-101/blob/main/401-providing.js
  - the app should not create a separate libp2p instance
    - use the one createHelia makes
    - send any libp2p configuration opts into createHelia with the `libp2p` property
- display peer connections on the page
  - update the number as connections change
