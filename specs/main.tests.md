# Integration Testing Requirements

*Cross-view testing specifications for Hollow World application*

**🗺️ Routes Reference**: See [`routes.md`](routes.md) for complete list of application routes

See also:
- [`CLAUDE.md`](../CLAUDE.md#testing) for testing principles
- [`routes.md`](routes.md) for application routes
- [`ui.splash.tests.md`](ui.splash.tests.md) for splash screen tests
- [`ui.characters.tests.md`](ui.characters.tests.md) for character management tests
- [`ui.settings.tests.md`](ui.settings.tests.md) for settings view tests

## SPA Routing Integration Tests

### Complete Route Test Suite
Test ALL routes work with both direct navigation and page refresh.

**Note:** Route paths below should match [`routes.md`](routes.md). If routes change, update both files.

- [ ] **Splash Screen**
  - Direct: `browser_navigate('http://localhost:3000' + SPLASH_SCREEN_ROUTE)`
  - Refresh: F5 or `location.reload()`
  - Verify: Splash screen renders, buttons visible

- [ ] **Character Manager view**
  - Direct: `browser_navigate('http://localhost:3000' + CHARACTER_MANAGER_ROUTE)`
  - Refresh: F5 on Character Manager view
  - Verify: Character list renders, Add Character button visible

- [ ] **Character Editor view** (`/character/:id` with UUID parameter)
  - Direct: `browser_navigate('http://localhost:3000' + CHARACTER_EDITOR_ROUTE + '/{uuid}')`
  - Refresh: F5 on Character Editor view
  - Verify: Editor renders, character data loads correctly

- [ ] **Settings view**
  - Direct: `browser_navigate('http://localhost:3000' + SETTINGS_VIEW_ROUTE)`
  - Refresh: F5 on Settings view
  - Verify: Settings view renders, peer ID displays

- [ ] **Log view**
  - Direct: `browser_navigate('http://localhost:3000' + LOG_VIEW_ROUTE)`
  - Refresh: F5 on Log view
  - Verify: Log table renders, filter field present

- [ ] **Friends view**
  - Direct: `browser_navigate('http://localhost:3000' + FRIENDS_VIEW_ROUTE)`
  - Refresh: F5 on Friends view
  - Verify: Friends view renders, Add Friend button visible

- [ ] **Game view**
  - Direct: `browser_navigate('http://localhost:3000' + GAME_VIEW_ROUTE)`
  - Refresh: F5 on Game view
  - Verify: Game view renders (or fallback)

### Vite Dev Server Configuration Test
- [ ] **SPA fallback middleware present**
  - Check `vite.config.ts` has `spa-fallback` plugin
  - Verify middleware serves `index.html` for non-file requests
  - Verify excludes file requests (contains `.`)
  - Verify excludes Vite internal requests (starts with `/@`)

## Cross-View Navigation Tests

### Navigation Flow Testing
- [ ] **Splash → Characters → Editor → Characters → Splash**
  - Start at Splash Screen
  - Navigate to Character Manager view
  - Click character → `{Character Editor Route}/{uuid}`
  - Back to Character Manager view
  - Back to Splash Screen
  - Verify each transition works
  - Verify browser URL updates correctly

- [ ] **Splash → Settings → Log → Settings → Splash**
  - Start at Splash Screen
  - Navigate to Settings view
  - Click Log button → Log view
  - Back to Settings view
  - Back to Splash Screen
  - Verify each transition works

### Browser History Integration
- [ ] **Back button works at each level**
  - Navigate through multiple views
  - Click back repeatedly
  - Verify each back navigates to previous view
  - Verify URL updates correctly

- [ ] **Forward button works**
  - Navigate forward, then back
  - Click forward
  - Verify returns to next view
  - Verify URL updates correctly

- [ ] **History state preserved**
  - Navigate to editor with character
  - Go back, go forward
  - Verify character data intact
  - Verify editor state restored

## Asset Loading Integration Tests

### Base URL Verification Across All Routes
Critical: Assets must load from origin on ALL routes

- [ ] **Audio assets from root `/`**
  - Navigate to Splash Screen
  - Check console for audio 404s
  - Verify loads from: `http://localhost:3000/assets/audio/...`

- [ ] **Audio assets from Character Manager view**
  - Navigate to Character Manager view
  - Verify loads from: `http://localhost:3000/assets/audio/...`
  - NOT from: `http://localhost:3000{Character Manager Route}/assets/...`

- [ ] **Audio assets from Character Editor view**
  - Navigate to Character Editor view (`{Character Editor Route}/{uuid}`)
  - Verify loads from: `http://localhost:3000/assets/audio/...`
  - NOT from: `http://localhost:3000{Character Editor Route}/{uuid}/assets/...`

- [ ] **Audio assets from Settings view**
  - Navigate to Settings view
  - Verify loads from: `http://localhost:3000/assets/audio/...`

- [ ] **Audio assets from Log view** ⚠️ CRITICAL
  - Navigate to Log view
  - Verify loads from: `http://localhost:3000/assets/audio/...`
  - NOT from: `http://localhost:3000{Log View Route}/assets/...`
  - This was the bug that required Base URL fix

### Template Loading Across All Routes

- [ ] **Templates from Splash Screen**
  - Navigate to Splash Screen
  - Verify template loads from: `http://localhost:3000/templates/...`

- [ ] **Templates from Log view** ⚠️ CRITICAL
  - Navigate to Log view
  - Verify template loads from: `http://localhost:3000/templates/...`
  - NOT from: `http://localhost:3000{Log View Route}/templates/...`
  - This was the bug that required TemplateEngine.ts fix

- [ ] **Templates from all other nested routes**
  - Test Character Manager, Character Editor (`{Character Editor Route}/{uuid}`), Settings, Game views
  - Verify all templates load from origin

### Console Error Monitoring
- [ ] **No 404 errors across all routes**
  - Navigate to each route
  - Check `browser_console_messages({ onlyErrors: true })`
  - Verify no asset or template 404s

## Audio System Integration Tests

### Music Persistence Across Views
- [ ] **Music continues playing across navigation**
  - Start music on Splash Screen
  - Navigate to Character Manager view → verify still playing
  - Navigate to Character Editor view (`{Character Editor Route}/{uuid}`) → verify still playing
  - Navigate to Settings view → verify still playing
  - Navigate to Log view → verify still playing
  - Return to Splash Screen → verify still playing

- [ ] **Music state persists across refresh**
  - Start music on Splash Screen
  - Navigate to Log view
  - Refresh page
  - Verify music state maintained (playing/paused)

### Music Cycling Across Views
- [ ] **Track cycling works across views**
  - Start music on Splash Screen
  - Wait for track to end or skip to next
  - Navigate to different view
  - Verify track cycling continues
  - Verify smooth fade-out on transitions

### Audio Control Visibility
- [ ] **Audio control appears on all views**
  - Verify music button visible at bottom-right on:
    - Splash Screen
    - Character Manager view
    - Character Editor view (`{Character Editor Route}/{uuid}`)
    - Friends view
    - Settings view
    - Log view
    - Game view

## Data Persistence Integration Tests

### LocalStorage Across Sessions
- [ ] **Characters persist**
  - Create characters
  - Close browser/tab
  - Reopen application
  - Navigate to Character Manager view
  - Verify characters still present

- [ ] **Log entries persist**
  - Add log entries
  - Close browser/tab
  - Reopen application
  - Navigate to Log view
  - Verify log entries present

- [ ] **Settings persist**
  - Modify settings
  - Close browser/tab
  - Reopen application
  - Navigate to Settings view
  - Verify settings unchanged

## Error Handling Integration Tests

### Invalid Routes
- [ ] **Non-existent route**
  - Navigate to `/nonexistent`
  - Verify fallback behavior
  - Verify no crash

### Network Errors
- [ ] **Asset load failure**
  - Simulate audio file unavailable
  - Verify graceful degradation
  - Verify music button hidden
  - Verify app continues functioning

### LocalStorage Errors
- [ ] **Storage quota exceeded**
  - Simulate storage full
  - Verify error handling
  - Verify user notification

## Performance Integration Tests

### Route Transition Speed
- [ ] **Navigation is fast**
  - Time navigation between views
  - Should be < 100ms for same-view navigation
  - Should be < 500ms for cross-view navigation

### Asset Caching
- [ ] **Assets cached after first load**
  - Navigate to view
  - Navigate away and back
  - Verify assets served from cache (304 Not Modified)

## P2P Integration Tests

**IMPORTANT: Testing with Multiple Peers**
- Regular browser tabs share localStorage, resulting in the same peer ID
- To test with different peer IDs, use **Different Profiles in Different Tabs**
  - Each profile has completely isolated storage (different peer ID, friends, settings, etc.)
  - **CRITICAL**: Both tabs MUST remain open simultaneously for P2P communication to work
  - **DO NOT** switch profiles in the same tab - P2P requires both peers to be running at the same time
  - Setup:
    1. Open Tab A, select "Profile A" (or create it)
    2. Open Tab B (new tab in same browser), select "Profile B" (or create it)
    3. Keep BOTH tabs open for all P2P testing
  - Both tabs now have different peer IDs and can communicate
  - Easiest method for testing P2P features
- Tests marked "Tab A" and "Tab B" require separate tabs with different profiles, kept open simultaneously
- **Profile-based testing in separate tabs** is the recommended approach (doesn't require multiple browsers/windows)

### Profile Isolation Tests
**Note**: These tests verify profile isolation in a single tab (no P2P communication needed)

- [ ] **Different profiles have different peer IDs**
  - In single tab: Navigate to Settings view
  - Note current peer ID (Profile "Default")
  - Click Profiles button, create "Test Profile"
  - Select "Test Profile"
  - Verify peer ID is different from "Default" profile
  - Switch back to "Default" profile
  - Verify original peer ID restored

- [ ] **Profile data is completely isolated**
  - In single tab, Profile A: Add friend "Alice", set player name to "Bob"
  - Profile A: Create character "Cowboy Joe"
  - Switch to Profile B (same tab)
  - Verify friends list is empty
  - Verify player name is empty
  - Verify character list shows only default characters
  - Switch back to Profile A (same tab)
  - Verify "Alice" still in friends, player name is "Bob", character "Cowboy Joe" exists

- [ ] **Profile selection is session-based (not persisted)**
  - Select "Test Profile"
  - Close tab, reopen application
  - Navigate to Settings view
  - Verify profile is "Default" (or first profile)
  - Profile selection does NOT persist across browser sessions

### Peer Identity Tests
- [ ] **Two instances have different peer IDs**
  - Use Profiles feature
    - Tab A: Navigate to Settings view, click Profiles button, create/select "Profile A"
    - Tab B: Navigate to Settings view, click Profiles button, create/select "Profile B"
    - Extract peer IDs from both tabs
  - Verify peer IDs are different and non-empty
  - Verify peer ID format is valid libp2p peer ID (starts with `12D3Koo`)

- [ ] **Peer ID persists across sessions within same profile**
  - Navigate to Settings view, note peer ID
  - Close tab and reopen application
  - Navigate to Settings view
  - Verify peer ID is identical to previous session
  - Verify private key data exists in localStorage

### Friend Invitation Flow Tests

**FRIEND REQUEST SYSTEM**: Friends are added directly by Peer ID using the "Add Friend by Peer ID" modal. When you add a friend:
1. Friend is added to friends list immediately with `pending: 'unsent'` status
2. System attempts to send `requestFriend` message immediately
3. If successful, status changes to `pending: 'pending'`
4. If peer is offline/unreachable, stays `pending: 'unsent'` and auto-retries when peer comes online
5. Recipient receives event notification and can Ignore or Accept

- [ ] **Add friend by peer ID - UI and storage only (single tab)**
  - Navigate to Friends view
  - Click "Add Friend by Peer ID" button
  - Verify modal appears with fields: Friend Name, Peer ID, Notes
  - Enter friend name "Alice"
  - Enter a made-up peer ID (e.g., `12D3KooTestInvalid123...`)
  - Enter notes "Test friend"
  - Click Submit
  - Verify modal closes
  - Verify confirmation message appears: "Friend added! Will send friend request when peer is discovered."
  - Verify "Alice" appears in friends list immediately with "📤 Unsent" badge
  - Use test API: `profileService.getItem('hollowPeerFriends')` - verify Alice stored with correct peer ID, notes, and `pending: 'unsent'`
  - **Note**: Stop here - made-up peer ID won't result in actual message delivery

- [ ] **Add multiple friends - different profiles (multiple tabs)**
  - **Setup**: Open two separate browser tabs
  - Tab A: Navigate to Settings view, click Profiles button, create/select "Profile A"
  - Tab A: Wait for P2P initialization, note peer ID (Peer A)
  - Tab B: Navigate to Settings view, click Profiles button, create/select "Profile B"
  - Tab B: Wait for P2P initialization, note peer ID (Peer B)
  - **CRITICAL**: Verify Peer A ≠ Peer B (different profiles = different peer IDs)
  - Tab A: Navigate to Friends view, use "Add Friend by Peer ID" modal to add "Bob" with Peer B's ID
  - Tab B: Navigate to Friends view, use "Add Friend by Peer ID" modal to add "Alice" with Peer A's ID
  - Tab A: Verify "Bob" appears in friends list with either "📤 Unsent" or "⏳ Pending" badge
  - Tab B: Verify "Alice" appears in friends list with either "📤 Unsent" or "⏳ Pending" badge
  - Both tabs: Use test API to verify friends stored in profile-specific localStorage with `pending` field
  - **Note**: Each profile has completely isolated storage

- [ ] **Stubborn friend request auto-retry (no UI)**
  - **Note**: Friend requests automatically retry when peer comes online
  - Navigate to Friends view
  - Add friend by peer ID (made-up ID so it stays offline)
  - Verify friend appears with "📤 Unsent" badge
  - Use test API: `hollowPeer.getFriend(peerId)` - verify `pending: 'unsent'`
  - System automatically attempts to send `requestFriend` when peer connects

### Peer Connectivity Tests
**Note**: These tests verify basic P2P connectivity infrastructure using ping/pong messages

See [`specs/coms.md`](coms.md#-testing-findings--limitations) for detailed explanation of browser P2P limitations on localhost.

- [ ] **Peer address resolution via DHT and relay**
  - **Setup**: Open Tab A with Profile A, open Tab B with Profile B (keep both open!)
  - Tab A: Navigate to Settings view, note peer ID (Peer A)
  - Tab B: Navigate to Settings view, note peer ID (Peer B)
  - Tab A: Use test API to send ping message to Peer B: `window.__HOLLOW_WORLD_TEST__.hollowPeer.sendMessage(peerBId, {method: 'ping', timestamp: Date.now()})`
  - Tab B: Wait for ping to arrive (check console logs)
  - Tab B: Verify pong automatically sent in response
  - Tab A: Wait for pong to arrive (check console logs)
  - Tab A: Verify round-trip time calculated and logged
  - **Success criteria**:
    - DHT successfully propagates peer addresses (via background discovery)
    - Circuit relay or WebTransport connection established
    - Ping message delivered to Tab B
    - Pong response delivered back to Tab A
    - Round-trip time < 5 seconds (DHT + relay latency)
    - When sending ping or pong, receiver's multiaddresses are logged to console
  - **Note**: May take up to 2 minutes for background peer discovery to resolve addresses

- [ ] **Bidirectional connectivity verification**
  - **Setup**: Keep Tab A and Tab B open with different profiles
  - Tab B: Send ping to Peer A
  - Tab A: Verify ping received, pong sent
  - Tab B: Verify pong received
  - Verify connectivity works in both directions
  - Verify similar round-trip times in both directions
  - Verify receiver's multiaddresses are logged when sending ping/pong in both directions

### Local TURN and Relay servers
- there are local TURN and Relay servers in the test directory
- do not use them unless requested by user

### Friend Request Send/Receive Tests
**Note**: These tests require TWO tabs open simultaneously with different profiles.

**Implementation Status:**
1. ✅ **LibP2P Node** - Initializes successfully with circuit relay v2 transport
2. ✅ **Bootstrap Nodes** - Connected to universal-connectivity bootstrap peer for relay discovery
3. ✅ **Circuit Relay v2** - Peers connect via public relay server (147.28.186.157:9095)
4. ✅ **Gossipsub Peer Discovery** - Peers discover each other via pubsub on topic `universal-connectivity-browser-peer-discovery`
5. ✅ **DirectMessage Protocol** - P2P messaging works via `/hollow-world/dm/1.0.0` over circuit relay
6. ⚠️ **WebRTC Direct Connections** - Attempts fail, but circuit relay provides working fallback

**How It Works:**
- **Peer Discovery**: Gossipsub broadcasts peer multiaddresses; peers must subscribe to receive them
- **Connection Method**: Circuit relay v2 (browser-to-relay-to-browser) via delegated routing
- **Message Delivery**: DirectMessage protocol over circuit relay connections
- **Performance**: ~2-3 second peer discovery latency, immediate message delivery after connection

**Critical Implementation Detail:**
The `LibP2PNetworkProvider` must call `pubsub.subscribe(PUBSUB_PEER_DISCOVERY_TOPIC)` after libp2p initialization. The `pubsubPeerDiscovery` module publishes to gossipsub but does NOT subscribe to receive messages. Without manual subscription, peers cannot discover each other's addresses.

- [ ] **Send friend request with peer ID - automatic delivery**
  - **Setup**: Open two separate browser tabs
  - Tab A: Navigate to Settings view, click Profiles button, create/select "Profile A"
  - Tab A: Wait for P2P initialization, set player name to "Alice", note peer ID (Peer A)
  - Tab B: Navigate to Settings view, click Profiles button, create/select "Profile B"
  - Tab B: Wait for P2P initialization, set player name to "Bob", note peer ID (Peer B)
  - **CRITICAL**: Verify Peer A ≠ Peer B (different profiles required)
  - Tab B: Navigate to Friends view
  - Tab B: Use "Add Friend by Peer ID" modal: name="Alice", peerID=(Peer A), notes="Test"
  - Tab B: Verify "Alice" added to friends list
  - Tab B: Verify Peer A added to pending new invitations
  - Tab B: Check console - should see background retry logic start for Peer A
  - **Wait ~30-120 seconds for peer discovery** (gossipsub + DHT + relay)
  - Tab B: Check console for "Sent requestFriend to {Peer A}" message
  - Tab A: Wait for message arrival (keep tab open!)
  - Tab A: Check console for "Received requestFriend from {Peer B}" message
  - Tab A: Verify event notification button appears with count "1"
  - Tab A: Click event button, verify modal opens
  - Tab A: Verify event card shows:
    - "Friend Request" type (not "New Friend Request")
    - "[Player Name] (Peer ID: ...) wants to add you as a friend"
    - Ignore/Accept buttons (in that order)
    - Skull button to remove
  - Use test API in Tab B: `hollowPeer.getPendingNewFriendRequests()` - verify empty (Tab B is sender)
  - Use test API in Tab A: `hollowPeer.getPendingNewFriendRequests()` - verify contains Peer B

- [ ] **Already-friend prevents duplicate request**
  - **Setup**: Keep Tab A and Tab B open with different profiles
  - Tab A & Tab B: Already friends (completed approval flow)
  - Tab B: Navigate to Friends view
  - Tab B: Try to add Peer A again via "Add Friend by Peer ID"
  - Tab B: System adds to pending invitations (allowed for retry logic)
  - Wait for peer discovery, system sends another requestFriend
  - Tab A: Check console for "Peer {Peer B} is already a friend" message
  - Tab A: Verify no new event created
  - Tab A: Verify existing friendship unchanged

### Friend Approval Tests
**Note**: These tests require TWO tabs open simultaneously with different profiles. Each round of tests must create a new profile for Tab B; the same profile can be used for the ignore/accept tests during the same round provided that accept is the last test.

- [ ] **Ignore friend request - adds to ignored peers**
  - **Setup**: Complete "Send friend request with peer ID" test above (both tabs open with different profiles)
  - Tab A: Has received friendRequest event from Tab B (Bob)
  - Tab A: Click event button to open modal
  - Tab A: Click "Ignore" button on event
  - Tab A: Verify event removed from event list
  - Tab A: Verify no friend added to friends list
  - Tab A: Use test API: `hollowPeer.getIgnoredPeers()` - verify contains Bob's peer ID and name
  - Tab A: Navigate to Friends view
  - Tab A: Scroll to "Ignored Peers" section - verify "Bob" appears in list
  - Tab B: Check console - verify NO response received (no message from Tab A, silent ignore)
  - Tab B: Verify Peer A still in pending new invitations (continues retrying)
  - Tab B: System will keep trying to send requests (will be silently ignored each time)

- [ ] **Ban friend request - adds to banned peers**
  - **Setup**: Complete "Send friend request with peer ID" test above (both tabs open with different profiles)
  - Tab A: Has received friendRequest event from Tab B (Bob)
  - Tab A: Click event button to open modal
  - Tab A: Click "Ban" button on event
  - Tab A: Verify event removed from event list
  - Tab A: Verify no friend added to friends list
  - Tab A: Use test API: `JSON.parse(profileService.getItem('hollow-banned-peers'))` - verify map structure with Bob's peer ID as key
  - Tab A: Verify banned entry contains: `friend` object (with peerId, playerName, notes, worlds) and `bannedAt` timestamp
  - Tab B: Check console - verify NO response received (no message from Tab A, silent ban)
  - Tab B: Verify Peer A still in pending new invitations (continues retrying)
  - **Critical**: Tab B's future friend requests to Tab A are silently ignored (no events created)
  - Tab B: Send another requestFriend to Tab A
  - Tab A: Check console for "Ignored request from banned peer" message
  - Tab A: Verify NO new friendRequest event created

- [ ] **Accept friend request - both peers become friends**
  - **Setup**: Open two separate browser tabs
  - Tab A: Navigate to Settings view, click Profiles button, create/select "Profile A"
  - Tab A: Wait for P2P initialization, set player name to "Alice"
  - Tab B: Navigate to Settings view, click Profiles button, create/select the profile for Tab B
  - Tab B: Wait for P2P initialization, set player name to "Bob"
  - Tab B: Add friend via "Add Friend by Peer ID": name="Alice", peerID=(Peer A)
  - Wait for peer discovery (~30-120 seconds)
  - Tab A: Receive friendRequest event, click event button
  - Tab A: Click "Accept" button on event
  - Tab A: Verify "Bob" added to friends list with "Pending..." badge
  - Tab A: **Bug Check**: Friend card must appear IMMEDIATELY in UI (without refresh)
  - Tab A: **Bug Check**: Use test API: `JSON.parse(profileService.getItem('hollowPeerFriends'))` - verify Bob entry exists with peerId=Peer B and pending=true
  - Tab A: Navigate to Friends view
  - Tab A: **CRITICAL Bug Check**: Verify Bob's friend card is visible in the friends list RIGHT NOW
  - Tab A: **Bug Check**: Friend card shows "Pending..." badge (or "⏳ Pending" badge)
  - Tab A: **Failure mode**: If localStorage has Bob but UI shows empty = `FriendsView.render()` not calling `HollowPeer.getAllFriends()`
  - Tab A: Verify event removed from event list
  - Tab B: Wait for acceptance message (tab must remain open!)
  - Tab B: Check console for "Received requestFriend from Alice" (mutual acceptance)
  - Tab B: Verify "Alice" already in friends list (was added when sending request)
  - Tab B: **Bug Check**: Use test API: `JSON.parse(profileService.getItem('hollowPeerFriends'))` - verify Alice has correct peerId=Peer A and pending flag cleared
  - Tab B: Verify Peer A removed from pending new invitations (request successful)
  - Tab A: Wait for mutual requestFriend message from Tab B
  - Tab A: Verify "Pending..." badge disappears from Bob's friend card
  - Tab A: **Bug Check**: Use test API - verify Bob's pending flag cleared (pending=false or undefined)
  - **Note**: When Tab B accepts, it sends requestFriend back to Tab A. Upon receiving this mutual requestFriend, Tab A clears the pending flag. Both peers now have accepted each other.

### Quarantine Tests
**Note**: These tests require TWO tabs open simultaneously with different profiles

- [ ] **Unknown peer added to quarantine on connect**
  - **Setup**: Open Tab A and Tab B with different profiles (keep both open!)
  - Simulate peer connection without friend request
  - Verify unknown peer added to quarantine set
  - Check console for quarantine message

- [ ] **Friend removed from quarantine on approval**
  - **Setup**: Keep Tab A and Tab B open with different profiles
  - Tab A & B: Follow friend request flow (both tabs open)
  - Tab A: Verify peer in quarantine before approval
  - Tab A: Accept friend request
  - Tab A: Verify peer removed from quarantine
  - Tab B: Verify peer removed from quarantine

### Ban Management Tests
**Note**: These tests verify banning existing friends and managing the ban list

- [ ] **Ban existing friend from Friends view**
  - **Setup**: Tab A and Tab B are already friends (completed approval flow, both tabs open)
  - Tab A: Navigate to Friends view
  - Tab A: Expand friend card for Tab B (Bob)
  - Tab A: Click "Ban" button on friend card
  - Tab A: Verify confirmation dialog appears: "Are you sure you want to ban Bob? This will remove them from your friends list and prevent future friend requests."
  - Tab A: Click "Cancel" on dialog
  - Tab A: Verify dialog closes, friend remains in friends list
  - Tab A: Click "Ban" button again
  - Tab A: Click "Confirm" on dialog
  - Tab A: Verify Bob removed from friends list
  - Tab A: Use test API: `JSON.parse(profileService.getItem('hollow-banned-peers'))` - verify map structure with Bob's peer ID as key
  - Tab A: Verify banned entry contains: `friend` object (with peerId, playerName, notes, worlds) and `bannedAt` timestamp
  - Tab A: **Critical**: Verify notes are preserved from friend data (if Bob had notes, they should be in ban list)
  - Tab A: Use test API: `JSON.parse(profileService.getItem('hollowPeerFriends'))` - verify Bob NOT in friends list
  - Tab B: Send another requestFriend to Tab A
  - Tab A: Check console for "Ignored request from banned peer" message
  - Tab A: Verify NO friendRequest event created

- [ ] **Banned peers preserve notes and allow editing**
  - **Setup**: Tab A has banned Bob (from previous test)
  - Tab A: Navigate to Friends view
  - Tab A: Expand "Banned Peers" section
  - Tab A: Verify Bob appears in banned peers list with preserved notes
  - Tab A: Edit Bob's player name
  - Tab A: Edit Bob's notes (add/modify text)
  - Tab A: Use test API: `JSON.parse(profileService.getItem('hollow-banned-peers'))` - verify changes saved to map
  - Tab A: Verify changes persist in UI

- [ ] **Banned peers persist across sessions**
  - **Setup**: Tab A has banned Bob (from previous test)
  - Tab A: Use test API: `JSON.parse(profileService.getItem('hollow-banned-peers'))` - note banned peers map
  - Tab A: Close and reopen application
  - Tab A: Navigate to Settings view, select same profile
  - Tab A: Wait for P2P initialization
  - Tab A: Use test API: `JSON.parse(profileService.getItem('hollow-banned-peers'))` - verify Bob still in ban list (map structure)
  - Tab A: Navigate to Friends view, expand "Banned Peers" section
  - Tab A: Verify Bob visible with preserved data (playerName, notes, bannedAt)
  - Tab B: Send requestFriend to Tab A
  - Tab A: Check console for "Ignored request from banned peer" message
  - Tab A: Verify NO friendRequest event created (ban persists)

- [ ] **Send friend request to banned peer preserves notes**
  - **Setup**: Tab A has banned Bob with notes "Was spamming" (from previous tests, both tabs open)
  - Tab A: Navigate to Friends view
  - Tab A: Expand "Banned Peers" section
  - Tab A: Verify Bob in banned peers list with notes
  - Tab A: Click "Send Friend Request" button (📨) on Bob's entry
  - Tab A: Verify Bob removed from banned peers list
  - Tab A: Verify Bob added to friends list with "⏳ Pending" badge
  - Tab A: Use test API: `JSON.parse(profileService.getItem('hollowPeerFriends'))` - verify Bob in friends list
  - Tab A: **Critical**: Verify Bob's notes are preserved ("Was spamming")
  - Tab A: Use test API: `JSON.parse(profileService.getItem('hollow-banned-peers'))` - verify Bob NOT in ban list
  - Tab A: Verify temporary notification: "Friend request sent to Bob"
  - Tab B: Wait for friend request message (tab must be open!)
  - Tab B: Verify friend request event received

### Persistence Tests
- [ ] **Friends persist across sessions**
  - **Setup**: Complete friend approval flow with Tab A and Tab B both open (using different profiles)
  - Tab A: Close and reopen (Tab B can close too)
  - Tab A: Navigate to Settings view, select same profile as before (Profile A)
  - Tab A: Wait for P2P initialization
  - Tab A: Verify friend still in friends list
  - Tab A: Verify friend data intact (name, peer ID, notes)
  - Tab A: Use test API: `JSON.parse(profileService.getItem('hollowPeerFriends'))` - verify friend data persisted

- [ ] **Friend data stored correctly in localStorage** ⚠️ BUG DETECTION
  - **Purpose**: Detect when friend names/data are stored incorrectly
  - **Setup**: Complete friend approval flow with Tab A and Tab B (both open with different profiles)
  - Tab A: Accepted request from Tab B (Bob), Bob added to friends with peer ID substring as initial name
  - Tab B: Already had "Alice" in friends list before acceptance
  - Tab A: Use test API: `JSON.parse(profileService.getItem('hollowPeerFriends'))`
  - Tab A: **Bug Check**: Bob's entry must exist with valid `playerName` (peer ID substring initially, NOT "undefined")
  - Tab A: **Bug Check**: Verify `peerId` matches Tab B's peer ID exactly
  - Tab A: **Bug Check**: Verify `notes` field exists (empty string is valid)
  - Tab B: Use test API: `JSON.parse(profileService.getItem('hollowPeerFriends'))`
  - Tab B: **Bug Check**: Alice's entry must have `playerName: "Alice"` (as entered via "Add Friend" modal)
  - Tab B: **Bug Check**: Verify `peerId` matches Tab A's peer ID exactly
  - Tab B: **Bug Check**: Verify `notes` field contains any notes entered during "Add Friend"
  - **Failure mode**: If data is missing or "undefined" = storage bug in FriendsManager or HollowPeer

- [ ] **Unsent friend requests persist and rebuild on startup**
  - **Setup**: Single tab with any profile
  - Add friend via "Add Friend by Peer ID" with made-up peer ID
  - Verify friend appears with "📤 Unsent" badge
  - Use test API: `hollowPeer.getFriend(peerId)` - verify `pending: 'unsent'`
  - Close and reopen application
  - Navigate to Settings view, select same profile
  - Wait for P2P initialization
  - Verify friend still shows "📤 Unsent" badge
  - Check console for "📤 Rebuilt unsentFriends set with N peer(s) pending delivery" message
  - **Purpose**: Verify unsent friend requests persist and ephemeral set is rebuilt on startup

- [ ] **Pending status cleared after mutual acceptance**
  - **Setup**: Complete friend approval flow (both tabs open with different profiles)
  - Tab B: Had added Tab A via "Add Friend by Peer ID" (shows "⏳ Pending" badge)
  - Tab A: Accepted the request (both send mutual requestFriend)
  - Tab B: Verify Peer A's badge cleared (no "Unsent" or "Pending" badge)
  - Tab B: Use test API: `hollowPeer.getFriend(peerA)` - verify `pending` field is undefined
  - Tab B: Close and reopen, select same profile
  - Tab B: Verify Peer A still has no pending badge after restart
  - **Purpose**: Verify mutual acceptance clears pending status permanently

### Event Service Integration Tests
**Note**: These tests require TWO tabs open simultaneously with different profiles

- [ ] **Friend request event displays correctly**
  - **Setup**: Open Tab A and Tab B with different profiles (keep both open!)
  - Tab A: Set player name to "Alice"
  - Tab B: Set player name to "Bob"
  - Complete friend request flow
  - Tab A: Verify event notification button appears with red count
  - Tab A: Click event button, verify modal opens
  - Tab A: Verify event card shows:
    - Event type (friend request)
    - Friend name from invitation
    - **Bug Check**: Event text must show "Bob wants to be friends" NOT "undefined wants to be friends"
    - Peer ID
    - Accept/Ignore buttons
    - Skull button to remove

- [ ] **Friend approved event displays correctly** ⚠️ BUG DETECTION
  - **Purpose**: Detect when player names are not transmitted in approval messages
  - **Setup**: Keep Tab A and Tab B open with different profiles
  - Tab A: Set player name to "Alice"
  - Tab B: Set player name to "Bob"
  - Complete friend approval flow (both tabs open)
  - Tab B: Verify event notification appears (tab must be open!)
  - Tab B: Click event button
  - Tab B: Verify event card shows:
    - Event type (friend approved)
    - **Bug Check**: Event text must show "Alice accepted your friend request!" NOT "undefined" or "Anonymous"
    - "View Friend" button
    - Skull button to remove
  - **Failure mode**: If event shows "undefined" or "Anonymous" = player name not transmitted in approveFriendRequest message

- [ ] **View Friend button navigates to friends view**
  - **Setup**: Keep Tab A and Tab B open with different profiles
  - Tab B: Get friend approved event (requires both tabs open for approval)
  - Tab B: Click "View Friend" button
  - Verify event removed from list
  - Verify navigates to Friends view
  - Verify friend visible in friends list

- [ ] **Event count badge updates correctly**
  - Start with 0 events, verify no badge
  - Add 1 event, verify badge shows "1"
  - Add 2 more events, verify badge shows "3"
  - Remove 1 event, verify badge shows "2"
  - Remove all events, verify badge disappears

### Settings View P2P Integration
- [ ] **Peer ID displays in settings**
  - Navigate to Settings view
  - Verify peer ID field shows valid peer ID
  - Verify peer ID is selectable/copyable

- [ ] **Friends list displays in friends view**
  - Add friends via P2P flow
  - Navigate to Friends view
  - Verify friends list shows all friends
  - Verify each friend shows: name, peer ID, notes field

- [ ] **Friends list UI renders from localStorage** ⚠️ BUG DETECTION
  - **Purpose**: Detect when friends are stored but UI doesn't render them
  - **Critical**: This test must verify BOTH immediate rendering (without refresh) AND after page refresh

  - **Part 1: Immediate Rendering Test (catches FriendsView not loading from HollowPeer)**
    - **Setup**: Complete friend approval flow between Tab A and Tab B (both tabs already on Friends view)
    - Tab A: Use test API to verify friend stored: `JSON.parse(profileService.getItem('hollowPeerFriends'))`
    - Tab A: **CRITICAL**: WITHOUT navigating away or refreshing, check friends list
    - Tab A: **Bug Check**: Verify friend card is visible in UI RIGHT NOW (NOT empty list)
    - Tab A: **Bug Check**: Friend card must show: playerName, peerId, notes
    - Tab A: **Failure mode**: If localStorage has friend but UI shows empty list = `FriendsView.render()` not loading from `HollowPeer.getAllFriends()`
    - Tab B: Use test API to verify friend stored: `JSON.parse(profileService.getItem('hollowPeerFriends'))`
    - Tab B: **CRITICAL**: WITHOUT navigating away or refreshing, check friends list
    - Tab B: **Bug Check**: Verify friend card is visible in UI RIGHT NOW (NOT empty list)
    - Tab B: **Bug Check**: Friend card must show: playerName, peerId, notes
    - Tab B: **Failure mode**: If localStorage has friend but UI shows empty list = `FriendsView.render()` not loading from `HollowPeer.getAllFriends()`

  - **Part 2: After Page Refresh Test (catches persistence/loading bugs)**
    - Tab A: Refresh page (F5 or navigate to Friends view)
    - Tab A: Wait for friends view to render
    - Tab A: **Bug Check**: Verify friend card is visible in UI after refresh
    - Tab A: **Bug Check**: Friend data must be correct after refresh
    - Tab B: Refresh page (F5 or navigate to Friends view)
    - Tab B: Wait for friends view to render
    - Tab B: **Bug Check**: Verify friend card is visible in UI after refresh
    - Tab B: **Bug Check**: Friend data must be correct after refresh

- [ ] **Add friend by Peer ID UI works**
  - Navigate to Friends view
  - Click "Add Friend by Peer ID" button
  - Enter friend name "Alice"
  - Enter peer ID
  - Enter notes (optional)
  - Click "Add Friend"
  - Verify confirmation message
  - Verify friend added to list

### Error Handling Tests
- [ ] **Invalid invitation format handled gracefully**
  - Try to send request with malformed invitation
  - Verify error message displayed
  - Verify no crash
  - Verify error logged

- [ ] **Network errors handled gracefully**
  - Simulate network disconnection
  - Try to send friend request
  - Verify error message
  - Verify request queued for retry

- [ ] **Duplicate friend requests prevented**
  - Send friend request to peer
  - Try to send another request to same peer
  - Verify second request rejected or merged
  - Verify only one entry in pendingFriendRequests

- [ ] **Already-friend approval ignored**
  - Tab A & B: Already friends
  - Tab A: Send another approveFriendRequest
  - Tab B: Verify ignored (console message)
  - Verify no duplicate friend entry
  - Verify no event created

### Resendable Message System Tests
**Note**: These tests verify the new resendable message system with UUID tracking and automatic retry

- [ ] **Resendable message retry logic**
  - **Setup**: Tab A and Tab B with different profiles
  - Tab A: Send requestFriend message to Tab B (Tab B not yet connected)
  - Tab A: Check console for resend timer start
  - Tab A: Use test API: `hollowPeer.resendableMessages` - verify message stored with messageId, retryCount, nextRetryTime
  - Wait 10 seconds (retry interval)
  - Tab A: Check console for "Resending message" log
  - Tab A: Verify retryCount incremented
  - Repeat up to max retries (12)
  - Tab A: After max retries, verify message removed from queue
  - Tab A: Check console for "Max retries exceeded" warning

- [ ] **Resendable message deduplication**
  - **Setup**: Tab A and Tab B connected with different profiles
  - Tab B: Send requestFriend with messageId "test-uuid-123"
  - Tab A: Receive message, verify processed
  - Tab A: Use test API: `hollowPeer.receivedMessageIds` - verify contains "test-uuid-123"
  - Tab B: Resend same message with same messageId
  - Tab A: Check console for duplicate message detection
  - Tab A: Verify message NOT processed again (no duplicate event)

- [ ] **Ack message stops retries**
  - **Setup**: Tab A and Tab B connected with different profiles
  - Tab B: Send requestFriend to Tab A
  - Tab B: Verify message in resend queue
  - Tab A: Receive message, process successfully
  - Tab A: Send ack back to Tab B
  - Tab B: Receive ack
  - Tab B: Use test API: `hollowPeer.resendableMessages` - verify message removed from queue
  - Tab B: Check console for ack handler execution
  - Tab B: Verify no further retries occur

- [ ] **Failed message processing prevents ack**
  - **Setup**: Tab A and Tab B connected with different profiles
  - Simulate processing error in Tab A's requestFriend handler
  - Tab B: Send requestFriend to Tab A
  - Tab A: Message processing throws error
  - Tab A: Verify NO ack sent to Tab B
  - Tab B: Verify message remains in resend queue
  - Tab B: Verify retries continue

### New Friend Request Flow Tests
**Note**: These tests verify the new requestFriend (mutual acceptance) message flow

- [ ] **requestFriend message with player name**
  - **Setup**: Tab A and Tab B connected with different profiles
  - Tab B: Set player name to "Bob"
  - Tab B: Call `hollowPeer.sendRequestFriend(peerAId, "Bob")`
  - Tab B: Verify message has: method="requestFriend", messageId (UUID), sender=peerBId, target=peerAId, playerName="Bob"
  - Tab B: Verify message added to resend queue
  - Tab A: Receive requestFriend message
  - Tab A: Check console for "Received requestFriend from Bob"
  - Tab A: Verify friendRequest event created with playerName="Bob"
  - Tab A: Verify ack sent back to Tab B
  - Tab B: Receive ack, verify message removed from resend queue

- [ ] **Mutual requestFriend creates friendship**
  - **Setup**: Tab A has received requestFriend from Tab B (Tab B has friend with pending=true)
  - Tab A: Set player name to "Alice"
  - Tab A: Accept friend request (sends requestFriend back)
  - Tab A: Verify message has: method="requestFriend", playerName="Alice"
  - Tab A: Verify message added to resend queue
  - Tab A: Verify friend added with pending=true
  - Tab B: Receive requestFriend message from Alice (mutual acceptance)
  - Tab B: Check console for "Received requestFriend from Alice"
  - Tab B: Verify friend's pending flag cleared (friend.pending = false)
  - Tab B: Use test API: `hollowPeer.getFriend(peerAId)` - verify pending=false
  - Tab B: Verify ack sent back to Tab A
  - Tab A: Receive ack, verify message removed from resend queue
  - Tab A: Pending flag cleared automatically upon receiving Tab B's original requestFriend

- [ ] **Ignoring a friend request**
  - **Setup**: Tab A has received requestFriend from Tab B
  - Tab A: Click "Ignore" button on friend request event
  - Tab A: Verify event removed from event list
  - Tab A: Verify NO message sent to Tab B
  - Tab A: Verify Tab B NOT added to friends list
  - Tab B: Verify friend entry for Tab A still has pending=true
  - Tab B: Can manually remove Tab A from friends list if desired

- [ ] **Pending friend status badge**
  - **Setup**: Tab A and Tab B connected with different profiles
  - Tab B: Send requestFriend to Tab A
  - Tab B: Verify friend added with pending=true
  - Tab B: Navigate to Friends view
  - Tab B: Verify friend card shows "⏳ Pending" badge
  - Tab B: Verify badge appears in both collapsed and expanded views
  - Tab A: Accept friend request (sends requestFriend back to Tab B)
  - Tab B: Receive mutual requestFriend, pending flag cleared
  - Tab B: Navigate to Friends view (or refresh)
  - Tab B: Verify "⏳ Pending" badge removed
  - Tab B: Verify friend card shows normal state

### Ignored Peers Tests
**Note**: These tests verify the new ignored peers functionality

- [ ] **Ignore button adds to ignored peers list**
  - **Setup**: Tab A has received friendRequest event from Tab B (Bob)
  - Tab A: Click event button to open modal
  - Tab A: Click "Ignore" button on friendRequest event
  - Tab A: Use test API: `hollowPeer.getIgnoredPeers()` - verify contains {peerId: peerBId, peerName: "Bob"}
  - Tab A: Verify event removed from event list
  - Tab A: Navigate to Settings view
  - Tab A: Scroll to "Ignored Peers" section
  - Tab A: Verify count badge shows "1"
  - Tab A: Verify "Bob" appears in ignored peers list with peer ID

- [ ] **Ignored peers list UI**
  - **Setup**: Tab A with ignored peer from previous test
  - Tab A: Navigate to Settings view
  - Tab A: Scroll to "Ignored Peers" section
  - Tab A: Verify section shows count badge
  - Tab A: Verify ignored peer item shows:
    - Peer name (bold)
    - Truncated peer ID
    - Remove button (❌)
  - Tab A: Add another ignored peer
  - Tab A: Refresh Settings view
  - Tab A: Verify count badge shows "2"
  - Tab A: Verify both ignored peers displayed

- [ ] **Remove ignored peer**
  - **Setup**: Tab A with ignored peer "Bob"
  - Tab A: Navigate to Settings view
  - Tab A: Scroll to "Ignored Peers" section
  - Tab A: Click remove button (❌) on "Bob"
  - Tab A: Verify "Bob" removed from ignored peers list
  - Tab A: Verify count badge decrements
  - Tab A: Use test API: `hollowPeer.getIgnoredPeers()` - verify Bob's peer ID not present
  - Tab A: Close and reopen, navigate to Settings view
  - Tab A: Verify Bob still not in ignored peers list (removal persisted)

- [ ] **Ignored peers prevent request processing**
  - **Setup**: Tab A and Tab B connected with different profiles
  - Tab A: Add Tab B (Bob) to ignored peers list
  - Tab B: Send requestFriend message to Tab A
  - Tab A: Check console for "Ignored request from ignored peer"
  - Tab A: Verify NO friendRequest event created
  - Tab A: Verify NO ack sent to Tab B
  - Tab B: Verify message remains in resend queue (continues retrying, but always ignored)

- [ ] **Ignored peers persist across sessions**
  - **Setup**: Tab A with ignored peer "Bob"
  - Tab A: Use test API: `hollowPeer.getIgnoredPeers()` - note Bob's peer ID
  - Tab A: Close and reopen application
  - Tab A: Navigate to Settings view, select same profile
  - Tab A: Wait for P2P initialization
  - Tab A: Use test API: `hollowPeer.getIgnoredPeers()` - verify contains Bob's peer ID
  - Tab A: Scroll to "Ignored Peers" section
  - Tab A: Verify "Bob" still in ignored peers list

### Event Modal Tests
**Note**: These tests verify the new event types render correctly

- [ ] **friendRequest event card rendering**
  - **Setup**: Tab A has received friendRequest from Tab B (Bob)
  - Tab A: Click event button to open modal
  - Tab A: Verify event card shows:
    - Title: "👥 Friend Request"
    - Content: "Bob (Peer ID: [truncated]) wants to add you as a friend"
    - Two buttons: Ignore, Accept
    - Skull button (💀) to remove
  - Tab A: Verify Accept button is rightmost (green styling)
  - Tab A: Verify Ignore button is leftmost (brown styling)
  - Tab A: Click Dismiss button (or skull)
  - Tab A: Verify event removed from list

- [ ] **Event modal actions**
  - **Setup**: Tab A has multiple events
  - Tab A: Click event button to open modal
  - Tab A: Verify modal shows all events
  - Tab A: Click skull button (💀) on one event
  - Tab A: Verify event removed from list
  - Tab A: Verify count badge decrements
  - Tab A: Click close button (✕)
  - Tab A: Verify modal closes
  - Tab A: Re-open modal
  - Tab A: Verify previously removed event still absent

## Playwright Test Patterns

### Route Test Template
```typescript
// Test pattern for any route
const route = '/settings/log';

// 1. Direct navigation
await browser_navigate(`http://localhost:3000${route}`);
const snapshot1 = await browser_snapshot();
// Verify view renders

// 2. Page refresh
await browser_navigate(`http://localhost:3000${route}`);
const snapshot2 = await browser_snapshot();
// Verify view still renders

// 3. Check for errors
const errors = await browser_console_messages({ onlyErrors: true });
// Verify no 404s or errors
```

### Asset Loading Test Template
```typescript
// Test pattern for asset loading on route
const route = '/settings/log';

await browser_navigate(`http://localhost:3000${route}`);

// Check network requests
const requests = await browser_network_requests();
const audioRequests = requests.filter(r => r.url.includes('/assets/audio/'));

// Verify all audio requests are to origin path
audioRequests.forEach(req => {
  expect(req.url).toMatch(/^http:\/\/localhost:3000\/assets\/audio\//);
  expect(req.url).not.toMatch(/settings\/log\/assets/);
});
```
