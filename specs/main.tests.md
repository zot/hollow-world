# Integration Testing Requirements

*Cross-view testing specifications for Hollow World application*

See also:
- [`CLAUDE.md`](../CLAUDE.md#testing) for testing principles
- [`ui.splash.tests.md`](ui.splash.tests.md) for splash screen tests
- [`ui.characters.tests.md`](ui.characters.tests.md) for character management tests
- [`ui.settings.tests.md`](ui.settings.tests.md) for settings view tests

## SPA Routing Integration Tests

### Complete Route Test Suite
Test ALL routes work with both direct navigation and page refresh:

- [ ] **`/` (splash screen)**
  - Direct: `browser_navigate('http://localhost:3000/')`
  - Refresh: F5 or `location.reload()`
  - Verify: Splash screen renders, buttons visible

- [ ] **`/characters` (character manager)**
  - Direct: `browser_navigate('http://localhost:3000/characters')`
  - Refresh: F5 on `/characters`
  - Verify: Character list renders, Add Character button visible

- [ ] **`/character/:id` (character editor with UUID)**
  - Direct: `browser_navigate('http://localhost:3000/character/{uuid}')`
  - Refresh: F5 on `/character/{uuid}`
  - Verify: Editor renders, character data loads correctly

- [ ] **`/settings` (settings view)**
  - Direct: `browser_navigate('http://localhost:3000/settings')`
  - Refresh: F5 on `/settings`
  - Verify: Settings view renders, peer ID displays

- [ ] **`/settings/log` (log view)**
  - Direct: `browser_navigate('http://localhost:3000/settings/log')`
  - Refresh: F5 on `/settings/log`
  - Verify: Log table renders, filter field present

- [ ] **`/game` (game view)**
  - Direct: `browser_navigate('http://localhost:3000/game')`
  - Refresh: F5 on `/game`
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
  - Start at `/`
  - Navigate to `/characters`
  - Click character → `/character/{uuid}`
  - Back to `/characters`
  - Back to `/`
  - Verify each transition works
  - Verify browser URL updates correctly

- [ ] **Splash → Settings → Log → Settings → Splash**
  - Start at `/`
  - Navigate to `/settings`
  - Click Log button → `/settings/log`
  - Back to `/settings`
  - Back to `/`
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
  - Navigate to `/`
  - Check console for audio 404s
  - Verify loads from: `http://localhost:3000/assets/audio/...`

- [ ] **Audio assets from `/characters`**
  - Navigate to `/characters`
  - Verify loads from: `http://localhost:3000/assets/audio/...`
  - NOT from: `http://localhost:3000/characters/assets/...`

- [ ] **Audio assets from `/character/{uuid}`**
  - Navigate to `/character/{uuid}`
  - Verify loads from: `http://localhost:3000/assets/audio/...`
  - NOT from: `http://localhost:3000/character/{uuid}/assets/...`

- [ ] **Audio assets from `/settings`**
  - Navigate to `/settings`
  - Verify loads from: `http://localhost:3000/assets/audio/...`

- [ ] **Audio assets from `/settings/log`** ⚠️ CRITICAL
  - Navigate to `/settings/log`
  - Verify loads from: `http://localhost:3000/assets/audio/...`
  - NOT from: `http://localhost:3000/settings/log/assets/...`
  - This was the bug that required Base URL fix

### Template Loading Across All Routes

- [ ] **Templates from root `/`**
  - Navigate to `/`
  - Verify template loads from: `http://localhost:3000/templates/...`

- [ ] **Templates from `/settings/log`** ⚠️ CRITICAL
  - Navigate to `/settings/log`
  - Verify template loads from: `http://localhost:3000/templates/...`
  - NOT from: `http://localhost:3000/settings/log/templates/...`
  - This was the bug that required TemplateEngine.ts fix

- [ ] **Templates from all other nested routes**
  - Test `/characters`, `/character/{uuid}`, `/settings`, `/game`
  - Verify all templates load from origin

### Console Error Monitoring
- [ ] **No 404 errors across all routes**
  - Navigate to each route
  - Check `browser_console_messages({ onlyErrors: true })`
  - Verify no asset or template 404s

## Audio System Integration Tests

### Music Persistence Across Views
- [ ] **Music continues playing across navigation**
  - Start music on splash screen
  - Navigate to `/characters` → verify still playing
  - Navigate to `/character/{uuid}` → verify still playing
  - Navigate to `/settings` → verify still playing
  - Navigate to `/settings/log` → verify still playing
  - Return to `/` → verify still playing

- [ ] **Music state persists across refresh**
  - Start music on splash
  - Navigate to `/settings/log`
  - Refresh page
  - Verify music state maintained (playing/paused)

### Music Cycling Across Views
- [ ] **Track cycling works across views**
  - Start music on splash
  - Wait for track to end or skip to next
  - Navigate to different view
  - Verify track cycling continues
  - Verify smooth fade-out on transitions

### Audio Control Visibility
- [ ] **Audio control appears on all views**
  - Verify music button visible at bottom-right on:
    - `/` (splash)
    - `/characters` (manager)
    - `/character/{uuid}` (editor)
    - `/settings` (settings)
    - `/settings/log` (log)
    - `/game` (game view)

## Data Persistence Integration Tests

### LocalStorage Across Sessions
- [ ] **Characters persist**
  - Create characters
  - Close browser/tab
  - Reopen application
  - Navigate to `/characters`
  - Verify characters still present

- [ ] **Log entries persist**
  - Add log entries
  - Close browser/tab
  - Reopen application
  - Navigate to `/settings/log`
  - Verify log entries present

- [ ] **Settings persist**
  - Modify settings
  - Close browser/tab
  - Reopen application
  - Navigate to `/settings`
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
  - In single tab: Navigate to `/settings`
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
  - Navigate to `/settings`
  - Verify profile is "Default" (or first profile)
  - Profile selection does NOT persist across browser sessions

### Peer Identity Tests
- [ ] **Two instances have different peer IDs**
  - Use Profiles feature
    - Tab A: Navigate to `/settings`, click Profiles button, create/select "Profile A"
    - Tab B: Navigate to `/settings`, click Profiles button, create/select "Profile B"
    - Extract peer IDs from both tabs
  - Verify peer IDs are different and non-empty
  - Verify peer ID format is valid libp2p peer ID (starts with `12D3Koo`)

- [ ] **Peer ID persists across sessions within same profile**
  - Navigate to `/settings`, note peer ID
  - Close tab and reopen application
  - Navigate to `/settings`
  - Verify peer ID is identical to previous session
  - Verify private key data exists in localStorage

### Friend Invitation Flow Tests
- [ ] **Create and parse invitation string**
  - Navigate to `/settings`
  - Create new invitation with friend name "Alice"
  - Verify invitation format: `{inviteCode}-{peerID}`
  - Verify invite code is 8 characters (A-Z, 0-9)
  - Verify invitation stored in activeInvitations

- [ ] **Multiple invitations work independently**
  - Create invitation for "Alice"
  - Create invitation for "Bob"
  - Verify both stored in activeInvitations
  - Verify different invite codes
  - Verify both contain correct peer ID

### Peer Connectivity Tests
**Note**: These tests verify basic P2P connectivity infrastructure using ping/pong messages

See [`specs/coms.md`](coms.md#-testing-findings--limitations) for detailed explanation of browser P2P limitations on localhost.

- [ ] **Peer address resolution via DHT and relay**
  - **Setup**: Open Tab A with Profile A, open Tab B with Profile B (keep both open!)
  - Tab A: Navigate to `/settings`, note peer ID (Peer A)
  - Tab B: Navigate to `/settings`, note peer ID (Peer B)
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
**Note**: These tests require TWO tabs open simultaneously with different profiles

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

- [ ] **Send friend request with valid invitation**
  - **Setup**: Open Tab A with Profile A, open Tab B with Profile B (keep both open!)
  - Tab A: Create invitation, copy invitation string
  - Tab B: Send friend request using invitation string
  - Tab B: Verify request added to pendingFriendRequests
  - Tab A: Verify friend request event appears in event list
  - Tab A: Verify event shows correct friend name
  - Tab A: Verify Accept and Ignore buttons present

- [ ] **Friend request with invalid invite code rejected**
  - **Setup**: Keep Tab A and Tab B open with different profiles
  - Tab A: Create invitation
  - Tab B: Send request with modified/invalid invite code
  - Tab A: Verify no event created
  - Tab A: Check console for "Invalid friend request" warning

- [ ] **Friend request with mismatched peer ID rejected**
  - **Setup**: Keep Tab A, Tab B, and Tab C open with different profiles
  - Tab A: Create invitation with specific peer ID (Tab C)
  - Tab B: Try to use that invitation (different peer ID)
  - Tab A: Verify request rejected
  - Tab A: Check console for peer ID mismatch warning

### Friend Approval Tests
**Note**: These tests require TWO tabs open simultaneously with different profiles

- [ ] **Ignore friend request - no friendship created**
  - **Setup**: Keep Tab A and Tab B open with different profiles
  - Tab A: Create invitation
  - Tab B: Send friend request
  - Tab A: Click "Ignore" button on event
  - Tab A: Verify event removed
  - Tab A: Verify no friend added
  - Tab B: Verify no response received
  - Tab B: Verify peer still in pendingFriendRequests

- [ ] **Decline friend request**
  - **Setup**: Keep Tab A and Tab B open with different profiles
  - Tab A: Create invitation
  - Tab B: Send friend request
  - Tab A: Decline request (if decline implemented)
  - Tab A: Verify event removed
  - Tab B: Verify peer removed from pendingFriendRequests
  - Tab B: Verify no friend added

- [ ] **Accept friend request - both peers become friends**
  - **Setup**: Open Tab A with Profile A, open Tab B with Profile B (keep both open!)
  - Tab A: Set player name to "Alice", create invitation
  - Tab B: Set player name to "Bob", send friend request using invitation
  - Tab A: Accept request from event
  - Tab A: Verify "Bob" added to friends list
  - Tab A: **Bug Check**: Verify friend name is "Bob" NOT "undefined" or "Anonymous"
  - Tab A: **Bug Check**: Use test API to verify localStorage: `profileService.getItem('hollowPeerFriends')` contains Bob with correct playerName
  - Tab A: **CRITICAL Bug Check**: Verify "Bob" appears in Friends List UI section IMMEDIATELY (without page refresh)
  - Tab A: **CRITICAL Bug Check**: Friend card in UI must display "Bob" as the name RIGHT NOW in the current view
  - Tab A: **CRITICAL Bug Check**: Scroll to Friends List section, verify Bob's friend card is visible with playerName textbox showing "Bob"
  - Tab A: **Failure mode**: If localStorage has Bob but UI shows empty Friends List = UI rendering bug (friends not loading from HollowPeer.getAllFriends())
  - Tab A: Verify event removed from event list
  - Tab B: Wait for approval message (tab must be open to receive it!)
  - Tab B: Verify friend approved event appears
  - Tab B: **Bug Check**: Event must show "Alice" NOT "undefined" or "Anonymous"
  - Tab B: Verify "Alice" added to friends list
  - Tab B: **Bug Check**: Use test API to verify localStorage: `profileService.getItem('hollowPeerFriends')` contains Alice with correct playerName
  - Tab B: **CRITICAL Bug Check**: Verify "Alice" appears in Friends List UI section IMMEDIATELY (without page refresh)
  - Tab B: **CRITICAL Bug Check**: Friend card in UI must display "Alice" as the name RIGHT NOW in the current view
  - Tab B: **CRITICAL Bug Check**: Scroll to Friends List section, verify Alice's friend card is visible with playerName textbox showing "Alice"
  - Tab B: **Failure mode**: If localStorage has Alice but UI shows empty Friends List = UI rendering bug (friends not loading from HollowPeer.getAllFriends())
  - Tab B: Verify peer removed from pendingFriendRequests
  - Tab B: Verify "View Friend" button in event

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

### Persistence Tests
- [ ] **Friends persist across sessions**
  - **Setup**: Complete friend request flow with Tab A and Tab B both open
  - Tab A: Close and reopen (Tab B can close too)
  - Tab A: Navigate to `/settings`
  - Tab A: Verify friend still in friends list
  - Verify friend data intact (name, peer ID, notes)

- [ ] **Friend player names stored correctly in localStorage** ⚠️ BUG DETECTION
  - **Purpose**: Detect when friend names are stored as "undefined" or "Anonymous" instead of actual player names
  - **Setup**: Complete friend approval flow with Tab A (Alice) and Tab B (Bob) both open
  - Tab A: Use test API: `JSON.parse(profileService.getItem('hollowPeerFriends'))`
  - Tab A: **Bug Check**: Bob's entry must have `playerName: "Bob"` NOT "undefined" or "Anonymous"
  - Tab A: **Bug Check**: Verify peerId matches Bob's peer ID
  - Tab B: Use test API: `JSON.parse(profileService.getItem('hollowPeerFriends'))`
  - Tab B: **Bug Check**: Alice's entry must have `playerName: "Alice"` NOT "undefined" or "Anonymous"
  - Tab B: **Bug Check**: Verify peerId matches Alice's peer ID
  - **Failure mode**: If playerName is "undefined" or "Anonymous" = player name not transmitted in P2P messages

- [ ] **Active invitations persist**
  - Single tab: Create invitations
  - Close and reopen application
  - Navigate to `/settings`
  - Verify invitations still in activeInvitations

- [ ] **Pending requests persist and resend on startup**
  - **Setup**: Open Tab A and Tab B with different profiles (keep both open initially)
  - Tab B: Send friend request to Tab A
  - Tab B: Close and reopen Tab B (keep Tab A open, before Tab A accepts)
  - Tab B: Check console for "resending pending friend request"
  - Tab A: Verify receives request again (or doesn't duplicate)

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

- [ ] **View Friend button navigates to settings**
  - **Setup**: Keep Tab A and Tab B open with different profiles
  - Tab B: Get friend approved event (requires both tabs open for approval)
  - Tab B: Click "View Friend" button
  - Verify event removed from list
  - Verify navigates to `/settings#friend={peerId}`
  - Verify friend selected in UI

- [ ] **Event count badge updates correctly**
  - Start with 0 events, verify no badge
  - Add 1 event, verify badge shows "1"
  - Add 2 more events, verify badge shows "3"
  - Remove 1 event, verify badge shows "2"
  - Remove all events, verify badge disappears

### Settings View P2P Integration
- [ ] **Peer ID displays in settings**
  - Navigate to `/settings`
  - Verify peer ID field shows valid peer ID
  - Verify peer ID is selectable/copyable

- [ ] **Friends list displays in settings**
  - Add friends via P2P flow
  - Navigate to `/settings`
  - Verify friends list shows all friends
  - Verify each friend shows: name, peer ID, notes field

- [ ] **Friends list UI renders from localStorage** ⚠️ BUG DETECTION
  - **Purpose**: Detect when friends are stored but UI doesn't render them
  - **Critical**: This test must verify BOTH immediate rendering (without refresh) AND after page refresh

  - **Part 1: Immediate Rendering Test (catches SettingsView not loading from HollowPeer)**
    - **Setup**: Complete friend approval flow between Tab A and Tab B (both tabs already on `/settings`)
    - Tab A: Use test API to verify friend stored: `JSON.parse(profileService.getItem('hollowPeerFriends'))`
    - Tab A: **CRITICAL**: WITHOUT navigating away or refreshing, scroll to "Friends List" section
    - Tab A: **Bug Check**: Verify friend card is visible in UI RIGHT NOW (NOT empty list)
    - Tab A: **Bug Check**: Friend card must show: playerName textbox, peerId text, notes textbox
    - Tab A: **Failure mode**: If localStorage has friend but UI shows empty list = `SettingsView.renderSettings()` not loading from `HollowPeer.getAllFriends()`
    - Tab B: Use test API to verify friend stored: `JSON.parse(profileService.getItem('hollowPeerFriends'))`
    - Tab B: **CRITICAL**: WITHOUT navigating away or refreshing, scroll to "Friends List" section
    - Tab B: **Bug Check**: Verify friend card is visible in UI RIGHT NOW (NOT empty list)
    - Tab B: **Bug Check**: Friend card must show: playerName textbox, peerId text, notes textbox
    - Tab B: **Failure mode**: If localStorage has friend but UI shows empty list = `SettingsView.renderSettings()` not loading from `HollowPeer.getAllFriends()`

  - **Part 2: After Page Refresh Test (catches persistence/loading bugs)**
    - Tab A: Refresh page (F5 or navigate to `/settings`)
    - Tab A: Wait for P2P initialization to complete (peer ID appears)
    - Tab A: Scroll to "Friends List" section
    - Tab A: **Bug Check**: Verify friend card is visible in UI after refresh
    - Tab A: **Bug Check**: Friend data must be correct after refresh
    - Tab B: Refresh page (F5 or navigate to `/settings`)
    - Tab B: Wait for P2P initialization to complete (peer ID appears)
    - Tab B: Scroll to "Friends List" section
    - Tab B: **Bug Check**: Verify friend card is visible in UI after refresh
    - Tab B: **Bug Check**: Friend data must be correct after refresh

- [ ] **Create invitation UI works**
  - Navigate to `/settings`
  - Enter friend name "Alice"
  - Click "Create Invitation"
  - Verify invitation string appears
  - Verify copyable/selectable
  - Verify format is correct

- [ ] **Send friend request UI works**
  - Navigate to `/settings`
  - Paste invitation string
  - Click "Send Request"
  - Verify confirmation message
  - Verify request added to pending list

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
