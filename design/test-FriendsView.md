# Test Design: FriendsView

**Component:** FriendsView
**CRC Reference:** crc-FriendsView.md
**UI Spec Reference:** ui-friends-view.md
**Spec Reference:** specs/ui.friends.md, specs/friends.md, specs/p2p.md
**Implementation Test:** No dedicated test file yet (needs creation)

## Component Overview

FriendsView manages P2P friend connections and displays friend list with presence, worlds, and connection status. Uses event-driven updates for presence changes and world notifications.

## Test Categories

### Unit Tests

#### Rendering Tests

**Test Case: Render Friends List**
- Purpose: Verify friend list displays correctly
- Setup: Friends in storage
- Input: Render view
- Expected: Friend cards shown with peerId, playerName, notes
- Related CRC: crc-FriendsView.md (renderFriendsList)
- Related UI Spec: ui-friends-view.md (Friends List)

**Test Case: Render Empty Friends List**
- Purpose: Verify empty state
- Setup: No friends
- Input: Render view
- Expected: "No friends yet" message shown
- Related CRC: crc-FriendsView.md
- Related UI Spec: ui-friends-view.md (Empty State)

**Test Case: Render Friend with Presence**
- Purpose: Verify online/offline badges
- Setup: Friend with online status
- Input: Render friend card
- Expected: Online badge (🟢) shown
- Related CRC: crc-FriendsView.md
- Related UI Spec: ui-friends-view.md (Presence Badges)

**Test Case: Render Friend Worlds**
- Purpose: Verify friend's worlds displayed
- Setup: Friend hosting 2 worlds
- Input: Render friend card
- Expected: World list shown with join buttons
- Related CRC: crc-FriendsView.md
- Related UI Spec: ui-friends-view.md (Friend Worlds)

**Test Case: Render My Peer ID**
- Purpose: Verify own peer ID displayed
- Setup: Peer ID set
- Input: Render view
- Expected: Peer ID visible with copy button
- Related CRC: crc-FriendsView.md
- Related UI Spec: ui-friends-view.md (My Peer ID Section)

#### Friend Management Tests

**Test Case: Add Friend by Peer ID**
- Purpose: Verify adding friend
- Setup: Valid peer ID
- Input: Enter peer ID, click Add Friend
- Expected: Friend added to list
- Related CRC: crc-FriendsView.md (addFriend)
- Related Sequence: seq-add-friend-by-peerid.md

**Test Case: Delete Friend**
- Purpose: Verify friend removal
- Setup: Friend in list
- Input: Click delete button
- Expected: Confirmation shown, friend removed on confirm
- Related CRC: crc-FriendsView.md (deleteFriend)

**Test Case: Edit Friend Notes**
- Purpose: Verify editing friend metadata
- Setup: Friend in list
- Input: Edit notes field
- Expected: Notes updated and saved
- Related CRC: crc-FriendsView.md (updateFriendNotes)

**Test Case: Copy Peer ID**
- Purpose: Verify copy to clipboard
- Setup: Peer ID displayed
- Input: Click copy button
- Expected: Peer ID copied to clipboard
- Related CRC: crc-FriendsView.md

#### Presence Tests

**Test Case: Update Friend Presence (Online)**
- Purpose: Verify presence change to online
- Setup: Offline friend
- Input: Receive presence update event
- Expected: Friend card shows online badge
- Related CRC: crc-FriendsView.md (handlePresenceUpdate)
- Related Sequence: seq-friend-presence-update.md

**Test Case: Update Friend Presence (Offline)**
- Purpose: Verify presence change to offline
- Setup: Online friend
- Input: Receive presence update event
- Expected: Friend card shows offline badge
- Related CRC: crc-FriendsView.md

**Test Case: Presence Badge Never Shows Dialog**
- Purpose: Verify NO dialogs for P2P operations
- Setup: Friend presence changes
- Input: Presence update received
- Expected: Badge updates, NO dialog shown
- Related CRC: crc-FriendsView.md
- Related Spec: specs/ui.md (No dialogs for P2P)

#### World Notification Tests

**Test Case: Display World Notification Badge**
- Purpose: Verify world invitation badge
- Setup: Friend sends world invite
- Input: Receive world notification event
- Expected: Notification badge (🌍+1) shown on friend card
- Related CRC: crc-FriendsView.md (handleWorldNotification)
- Related Spec: specs/ui.friends.md (Event badges)

**Test Case: Clear World Notification**
- Purpose: Verify badge clears when viewed
- Setup: Friend with world notification
- Input: View friend's worlds
- Expected: Notification badge removed
- Related CRC: crc-FriendsView.md

**Test Case: Multiple World Notifications**
- Purpose: Verify badge count increments
- Setup: Friend sends multiple world invites
- Input: Receive multiple events
- Expected: Badge shows correct count (🌍+3)
- Related CRC: crc-FriendsView.md

### Integration Tests

**Test Case: FriendsManager Integration**
- Purpose: Verify FriendsManager manages friend data
- Setup: Friends in storage
- Input: Load view
- Expected: Friends loaded via FriendsManager
- Related CRC: crc-FriendsView.md, crc-FriendsManager.md

**Test Case: P2P Network Integration**
- Purpose: Verify P2P connection status updates
- Setup: Friend connects
- Input: P2P connection established
- Expected: Friend presence updated
- Related CRC: crc-FriendsView.md, crc-HollowPeer.md

**Test Case: Event-Driven Updates**
- Purpose: Verify view updates on events
- Setup: View rendered
- Input: Presence/world events received
- Expected: View updates without manual refresh
- Related CRC: crc-FriendsView.md
- Related Spec: specs/p2p.md (Event-driven)

### E2E Tests

**Test Case: Add Friend Workflow**
- Purpose: Verify complete add friend flow
- Setup: Two browser tabs with different peers
- Input: Tab 1 adds Tab 2's peer ID
- Expected: Friend appears in Tab 1's list
- Test Type: Playwright E2E (multi-tab)

**Test Case: Friend Presence Update**
- Purpose: Verify presence updates in real-time
- Setup: Two connected peers
- Input: Tab 2 disconnects
- Expected: Tab 1 shows Tab 2 as offline
- Test Type: Playwright E2E (multi-tab)

**Test Case: Join Friend's World**
- Purpose: Verify joining friend's world
- Setup: Friend hosting world
- Input: Click Join button on friend's world
- Expected: Join session modal opens
- Test Type: Playwright E2E

### Edge Cases

**Test Case: Invalid Peer ID**
- Purpose: Verify handling of invalid peer ID
- Setup: None
- Input: Enter invalid peer ID format
- Expected: Error message shown, friend not added
- Related CRC: crc-FriendsView.md

**Test Case: Duplicate Friend**
- Purpose: Verify handling of duplicate peer ID
- Setup: Friend already in list
- Input: Add same peer ID again
- Expected: Error or warning shown
- Related CRC: crc-FriendsView.md

**Test Case: Add Self as Friend**
- Purpose: Verify cannot add own peer ID
- Setup: None
- Input: Enter own peer ID
- Expected: Error message shown
- Related CRC: crc-FriendsView.md

**Test Case: Long Peer ID**
- Purpose: Verify UI handles long peer IDs
- Setup: Very long peer ID string
- Input: Display friend
- Expected: Peer ID truncated or wrapped
- Related CRC: crc-FriendsView.md

**Test Case: Special Characters in Notes**
- Purpose: Verify handling of HTML/special chars in notes
- Setup: Friend in list
- Input: Enter notes with <script>, quotes
- Expected: Characters escaped, stored safely
- Related CRC: crc-FriendsView.md

**Test Case: P2P Connection Failure**
- Purpose: Verify handling of connection errors
- Setup: Network provider unavailable
- Input: Attempt to add friend
- Expected: Error message shown
- Related CRC: crc-FriendsView.md

**Test Case: Rapid Presence Changes**
- Purpose: Verify handling of rapid online/offline toggles
- Setup: Friend connects/disconnects rapidly
- Input: Multiple presence events
- Expected: Final state correct, no UI flickering
- Related CRC: crc-FriendsView.md

## Coverage Goals

- Test friend list rendering (cards, empty state, presence badges)
- Test friend management (add, delete, edit notes)
- Test presence updates (online/offline badges)
- Test world notifications (badges, counts)
- Test P2P integration (FriendsManager, network provider)
- Test event-driven updates
- Test NO dialogs for P2P operations (per spec)
- E2E tests for multi-peer scenarios
- Test edge cases (invalid peer IDs, duplicates, connection failures)

## Notes

- FriendsView is event-driven (updates on presence/world events)
- NO dialogs for P2P operations (use badges and event notifications)
- Multi-tab testing required for P2P features
- Presence badges: 🟢 online, 🔴 offline (or similar)
- World notification badges: 🌍+count
- Copy peer ID to clipboard for sharing
- Friend data isolated per profile
