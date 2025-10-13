// Type definitions for window extensions used in testing
import type { ProfileService } from '../services/ProfileService';
import type { HollowPeer } from '../p2p/index';
import type { AudioManager } from '../audio/AudioManager';
import type { EventService } from '../services/EventService';

declare global {
  interface Window {
    /**
     * Test API - only available in dev/test environments
     * Provides access to application singletons for testing
     */
    __HOLLOW_WORLD_TEST__?: {
      profileService: ProfileService;
      hollowPeer?: HollowPeer;
      audioManager?: AudioManager;
      eventService?: EventService;
    };
  }
}

export {};
