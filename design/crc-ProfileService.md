# ProfileService

**Source Spec:** storage.md
**Existing Code:** src/services/ProfileService.ts

## Responsibilities

### Knows
- currentProfile: IProfile - currently selected profile (tab-scoped, not persisted)
- profiles list (stored in LocalStorage under `__hollow_profiles__`)

### Does
- getCurrentProfile(): Get active profile
- setCurrentProfile(name): Switch to different profile (tab-scoped)
- getAllProfiles(): List all available profiles
- createProfile(name): Create new profile
- deleteProfile(name): Remove profile and its data
- getItem(key): Get value from storage with profile prefix
- setItem(key, value): Save value to storage with profile prefix
- removeItem(key): Remove value from storage with profile prefix
- migrateOldStorageIfNeeded(): Clear pre-profile storage on first run
- onProfileChange(callback): Register callback for profile switches

## Collaborators

- **LocalStorage**: Underlying browser storage API
- **SessionStorage**: Stores current profile selection (tab-scoped)

## Code Review Notes

✅ **Working well:**
- Profile isolation implemented correctly
- Tab-scoped profile selection (not persisted across sessions)
- Automatic migration from pre-profile storage
- Clean API for storage operations with automatic prefixing
- Default profile creation when storage is empty

✅ **Matches spec:**
- "Selecting a profile applies only to the current tab" - ✓ uses sessionStorage
- "If storage exists but does not use profiles, remove it" - ✓ migration logic
- "If storage is empty, create the Default profile" - ✓ initialization logic

📝 **Implementation details:**
- Profile prefix pattern: `{profileName}_{key}`
- Profiles list stored at: `__hollow_profiles__`
- Current profile stored in sessionStorage (not localStorage)
- Profile change callbacks for P2P reconnection

## Sequences

- seq-initialize-profiles.md
- seq-switch-profile.md
- seq-create-profile.md
- seq-delete-profile.md
- seq-profile-storage-access.md
