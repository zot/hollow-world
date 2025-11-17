# Test Design: ProfileService

**Component:** ProfileService
**CRC Reference:** crc-ProfileService.md (needs creation)
**Spec Reference:** specs/storage.md, specs/ui.settings.md
**Implementation Test:** No dedicated test file yet (needs creation)

## Component Overview

ProfileService manages profile-aware localStorage access, allowing users to maintain separate data sets (characters, friends, settings) per profile. Provides getItem/setItem/removeItem methods that namespace keys by current profile.

## Test Categories

### Unit Tests

#### Profile Selection Tests

**Test Case: Get Current Profile**
- Purpose: Verify retrieving current profile name
- Setup: None
- Input: Call getCurrentProfile()
- Expected: Returns current profile name (default or set)
- Related CRC: crc-ProfileService.md (getCurrentProfile)

**Test Case: Set Profile**
- Purpose: Verify switching to different profile
- Setup: None
- Input: Call setCurrentProfile('Profile B')
- Expected: Current profile changes to 'Profile B'
- Related CRC: crc-ProfileService.md (setCurrentProfile)

**Test Case: List All Profiles**
- Purpose: Verify retrieving list of all profiles
- Setup: Create profiles 'A', 'B', 'C'
- Input: Call listProfiles()
- Expected: Returns array ['A', 'B', 'C']
- Related CRC: crc-ProfileService.md (listProfiles)

**Test Case: Default Profile**
- Purpose: Verify default profile exists
- Setup: Fresh localStorage
- Input: Call getCurrentProfile()
- Expected: Returns default profile name (e.g., 'Default')
- Related CRC: crc-ProfileService.md

**Test Case: Create New Profile**
- Purpose: Verify creating new profile
- Setup: None
- Input: Call createProfile('New Profile')
- Expected: Profile created and appears in listProfiles()
- Related CRC: crc-ProfileService.md (createProfile)

**Test Case: Delete Profile**
- Purpose: Verify deleting existing profile
- Setup: Create profile 'Temporary'
- Input: Call deleteProfile('Temporary')
- Expected: Profile removed, not in listProfiles()
- Related CRC: crc-ProfileService.md (deleteProfile)

**Test Case: Delete Current Profile**
- Purpose: Verify behavior when deleting active profile
- Setup: Switch to profile 'Active'
- Input: Call deleteProfile('Active')
- Expected: Switches to default profile or prevents deletion
- Related CRC: crc-ProfileService.md

#### Profile-Aware Storage Tests

**Test Case: Set Item in Current Profile**
- Purpose: Verify storing data in profile namespace
- Setup: Set profile to 'Profile A'
- Input: Call setItem('testKey', 'testValue')
- Expected: Data stored under 'Profile A' namespace
- Related CRC: crc-ProfileService.md (setItem)

**Test Case: Get Item from Current Profile**
- Purpose: Verify retrieving data from profile namespace
- Setup: Store 'testKey' in 'Profile A'
- Input: Call getItem('testKey')
- Expected: Returns 'testValue'
- Related CRC: crc-ProfileService.md (getItem)

**Test Case: Profile Isolation**
- Purpose: Verify data isolation between profiles
- Setup: Store 'key1'='valueA' in Profile A, switch to Profile B
- Input: Call getItem('key1') in Profile B
- Expected: Returns null or undefined (not 'valueA')
- Related CRC: crc-ProfileService.md

**Test Case: Same Key Different Profiles**
- Purpose: Verify same key can have different values per profile
- Setup: Store 'name'='Alice' in Profile A, 'name'='Bob' in Profile B
- Input: Switch profiles and get 'name'
- Expected: Returns 'Alice' in A, 'Bob' in B
- Related CRC: crc-ProfileService.md

**Test Case: Remove Item from Profile**
- Purpose: Verify removing data from profile
- Setup: Store 'testKey' in profile
- Input: Call removeItem('testKey')
- Expected: Key no longer exists in current profile
- Related CRC: crc-ProfileService.md (removeItem)

**Test Case: Remove Item Doesn't Affect Other Profiles**
- Purpose: Verify removal is profile-scoped
- Setup: Store 'key'='value' in Profile A and Profile B
- Input: Switch to A, removeItem('key'), switch to B, getItem('key')
- Expected: Profile B still has 'key'='value'
- Related CRC: crc-ProfileService.md

#### Persistence Tests

**Test Case: Profile Persists Across Page Reload**
- Purpose: Verify current profile persists
- Setup: Set current profile to 'Profile X'
- Input: Create new ProfileService instance
- Expected: getCurrentProfile() returns 'Profile X'
- Related CRC: crc-ProfileService.md

**Test Case: Profile Data Persists Across Reload**
- Purpose: Verify profile data persists
- Setup: Store data in profile, create new service instance
- Input: Get stored data
- Expected: Data available after reload
- Related CRC: crc-ProfileService.md

**Test Case: Profile List Persists**
- Purpose: Verify profile list persists
- Setup: Create profiles A, B, C
- Input: Create new service instance, listProfiles()
- Expected: Returns ['A', 'B', 'C']
- Related CRC: crc-ProfileService.md

#### Storage Key Namespacing Tests

**Test Case: Verify Key Namespacing Format**
- Purpose: Verify actual localStorage keys are namespaced
- Setup: Set profile to 'TestProfile', store 'key1'='value1'
- Input: Check localStorage directly
- Expected: Key stored as 'profile:TestProfile:key1' or similar
- Related CRC: crc-ProfileService.md

**Test Case: Non-Profile Keys Not Affected**
- Purpose: Verify global keys work without namespacing
- Setup: None
- Input: Store non-profiled key directly in localStorage
- Expected: Key accessible without profile namespace
- Related CRC: crc-ProfileService.md

### Integration Tests

**Test Case: Character Storage with Profiles**
- Purpose: Verify CharacterStorageService uses ProfileService
- Setup: Create character in Profile A
- Input: Switch to Profile B, list characters
- Expected: Profile B doesn't see Profile A's characters
- Related CRC: crc-CharacterStorageService.md, crc-ProfileService.md
- Related Sequence: seq-save-character.md

**Test Case: Friends Isolation Between Profiles**
- Purpose: Verify friends are profile-scoped
- Setup: Add friends in Profile A
- Input: Switch to Profile B
- Expected: Profile B has separate friends list
- Related CRC: crc-FriendsManager.md, crc-ProfileService.md

**Test Case: Settings Isolation**
- Purpose: Verify settings are profile-scoped
- Setup: Set peer ID in Profile A
- Input: Switch to Profile B
- Expected: Profile B has different peer ID
- Related CRC: crc-SettingsView.md, crc-ProfileService.md

**Test Case: Log Isolation**
- Purpose: Verify logs are profile-scoped
- Setup: Add log entries in Profile A
- Input: Switch to Profile B
- Expected: Profile B has separate log
- Related CRC: crc-LogService.md, crc-ProfileService.md

**Test Case: Complete Profile Switch Workflow**
- Purpose: Verify switching profiles updates all components
- Setup: Create data in Profile A, switch to Profile B
- Input: Access characters, friends, settings, log
- Expected: All data is profile-scoped correctly
- Related CRC: Multiple
- Related Sequence: seq-switch-profile.md (needs creation)

### Edge Cases

**Test Case: Empty Profile Name**
- Purpose: Verify handling of empty profile name
- Setup: None
- Input: Call createProfile('')
- Expected: Error or rejects empty name
- Related CRC: crc-ProfileService.md

**Test Case: Duplicate Profile Name**
- Purpose: Verify handling of duplicate profile creation
- Setup: Create profile 'Existing'
- Input: Call createProfile('Existing')
- Expected: Error or rejects duplicate
- Related CRC: crc-ProfileService.md

**Test Case: Special Characters in Profile Name**
- Purpose: Verify handling of special characters
- Setup: None
- Input: Create profile with name 'Test:Profile/Name'
- Expected: Sanitizes or rejects invalid characters
- Related CRC: crc-ProfileService.md

**Test Case: Very Long Profile Name**
- Purpose: Verify handling of long profile names
- Setup: None
- Input: Create profile with 1000 character name
- Expected: Truncates or rejects overly long name
- Related CRC: crc-ProfileService.md

**Test Case: Delete Last Profile**
- Purpose: Verify handling when deleting last profile
- Setup: Only one profile exists
- Input: Call deleteProfile(lastProfile)
- Expected: Prevents deletion or creates default profile
- Related CRC: crc-ProfileService.md

**Test Case: Switch to Nonexistent Profile**
- Purpose: Verify handling of invalid profile switch
- Setup: None
- Input: Call setCurrentProfile('NonexistentProfile')
- Expected: Error or creates profile automatically
- Related CRC: crc-ProfileService.md

**Test Case: Storage Quota Exceeded**
- Purpose: Verify handling when profile storage is full
- Setup: Fill localStorage to quota
- Input: Call setItem('key', 'value')
- Expected: Throws quota exceeded error, handles gracefully
- Related CRC: crc-ProfileService.md

**Test Case: Unicode in Profile Name**
- Purpose: Verify handling of unicode profile names
- Setup: None
- Input: Create profile '프로필' (Korean) or 'プロファイル' (Japanese)
- Expected: Accepts unicode characters
- Related CRC: crc-ProfileService.md

**Test Case: Null Storage Key**
- Purpose: Verify handling of null key
- Setup: None
- Input: Call getItem(null)
- Expected: Error or returns null
- Related CRC: crc-ProfileService.md

**Test Case: Undefined Storage Key**
- Purpose: Verify handling of undefined key
- Setup: None
- Input: Call getItem(undefined)
- Expected: Error or returns null
- Related CRC: crc-ProfileService.md

**Test Case: Concurrent Profile Switches**
- Purpose: Verify rapid profile switching
- Setup: Create profiles A, B, C
- Input: Switch between profiles rapidly (A→B→C→A)
- Expected: Data isolation maintained, no corruption
- Related CRC: crc-ProfileService.md

## Coverage Goals

- Test all profile management methods (create, delete, list, get, set current)
- Test all storage methods (getItem, setItem, removeItem)
- Verify profile isolation (data doesn't leak between profiles)
- Test persistence across service instances
- Test integration with all components that use storage
- Test key namespacing format
- Test edge cases (empty names, duplicates, special characters)
- Test storage quota handling
- Verify thread safety (concurrent operations)

## Notes

- ProfileService is fundamental to data isolation
- All storage operations should go through ProfileService
- Default profile must always exist
- Profile switching should be fast (cached data may need invalidation)
- Consider migration path for users with pre-profile data
- Storage keys should be consistent and predictable
- May need profile export/import feature in future
- Consider profile metadata (created date, description, etc.)
