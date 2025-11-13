/**
 * HollowIPeer - Adapter implementing Textcraft's IPeer interface using Hollow's P2P infrastructure
 * Adapter Pattern: Bridges TextCraft MUD engine to Hollow's P2P infrastructure
 *
 * CRC: crc-HollowIPeer.md
 * Spec: integrate-textcraft.md
 * Sequences: seq-textcraft-multiplayer-command.md
 */

import { IPeer, PeerID, UserInfo } from './peer.js'
import { Thing, MudStorage } from './model.js'
import { createConnection, type MudConnection } from './mudcontrol.js'
import type { INetworkProvider } from '../p2p/types.js'
import type { P2PMessage } from '../p2p/types.js'

/**
 * Message types for the /hollow-mud/1.0.0 protocol
 */
interface MudMessage {
  type: 'command' | 'output' | 'userUpdate' | 'login' | 'welcome'
  payload?: any
  text?: string
  peerID?: string
  name?: string
  properties?: any
}

/**
 * HollowIPeer implements the Textcraft IPeer interface using Hollow's INetworkProvider.
 *
 * Key responsibilities:
 * - Adapt P2P messages to Textcraft's command/output flow
 * - Manage MudConnection instances for each connected guest
 * - Route commands between guests and host
 * - Synchronize user Thing updates across the network
 */
export class HollowIPeer implements IPeer {
  currentVersionID: string = '1.0.0'
  versionID: string = '1.0.0'

  private networkProvider: INetworkProvider | null
  private mudConnections: Map<PeerID, MudConnection> = new Map()
  private isHost: boolean = false
  private hostPeerID: PeerID | null = null
  private currentWorld: any = null // Will be set during startHosting
  private storage: MudStorage | null = null
  private app: any = null

  /**
   * Solo mode connection - used when no network provider is available
   */
  private soloConnection: MudConnection | null = null

  /**
   * Map from Thing to PeerID for tracking which peer owns which character
   */
  private thingToPeerMap: Map<Thing, PeerID> = new Map()

  constructor(networkProvider?: INetworkProvider) {
    this.networkProvider = networkProvider || null
  }

  /**
   * Initialize peer with application context
   * CRC: crc-HollowIPeer.md → init()
   */
  init(app: any): void {
    console.log(
      '🎮 HollowIPeer initialized (solo mode:',
      !this.networkProvider,
      ')'
    )
    this.app = app
  }

  /**
   * Start peer with MUD storage and register message handlers
   * CRC: crc-HollowIPeer.md → start()
   */
  async start(storage: MudStorage): Promise<void> {
    console.log('🎮 HollowIPeer starting with MUD storage')
    this.storage = storage

    if (this.networkProvider) {
      // Register message handler for MUD messages (multiplayer mode)
      this.networkProvider.onMessage((peerId: string, message: P2PMessage) => {
        if (message.method === 'mud') {
          this.handleMudMessage(peerId, message.payload as MudMessage)
        }
      })
      console.log('✅ HollowIPeer started in multiplayer mode')
    } else {
      console.log('✅ HollowIPeer started in solo mode')
    }
  }

  /**
   * Reset peer state and close all connections
   * CRC: crc-HollowIPeer.md → reset()
   */
  reset(): void {
    console.log('🔄 Resetting HollowIPeer')

    // Close solo connection if exists
    if (this.soloConnection) {
      try {
        this.soloConnection.close()
      } catch (error) {
        console.error('❌ Error closing solo connection:', error)
      }
      this.soloConnection = null
    }

    // Close all MudConnections
    const connections = Array.from(this.mudConnections.values())
    for (const mudcon of connections) {
      try {
        mudcon.close()
      } catch (error) {
        console.error('❌ Error closing MudConnection:', error)
      }
    }

    this.mudConnections.clear()
    this.thingToPeerMap.clear()
    this.isHost = false
    this.hostPeerID = null
    this.currentWorld = null

    console.log('✅ HollowIPeer reset complete')
  }

  /**
   * Get connection string (peer ID) for joining
   * CRC: crc-HollowIPeer.md → connectString()
   */
  connectString(): string {
    if (!this.networkProvider) {
      return 'solo-mode'
    }

    // Return the peer ID as the connection string
    // In Hollow, peers connect via the friend system and peer discovery
    const peerId = this.networkProvider.getPeerId()
    return peerId
  }

  /**
   * Get relay connection string (same as connectString in Hollow)
   * CRC: crc-HollowIPeer.md → relayConnectString()
   */
  relayConnectString(): string {
    // Hollow uses circuit relay by default, so the connect string is the same
    return this.connectString()
  }

  /**
   * Start hosting a MUD world
   * CRC: crc-HollowIPeer.md → startHosting()
   * Seq: seq-textcraft-multiplayer-command.md
   */
  startHosting(): void {
    if (!this.networkProvider) {
      throw new Error(
        'Cannot start hosting in solo mode - network provider required'
      )
    }

    console.log('🏠 Starting MUD hosting...')
    this.isHost = true

    // Load or create world from storage
    if (this.storage) {
      // TODO: Load world from storage
      // For now, we'll need the caller to provide the world
      console.log('📚 World will be loaded by caller')
    }

    console.log(
      '✅ MUD hosting started. Connection string:',
      this.connectString()
    )
    console.log('📋 Share this peer ID with guests to allow them to join')
  }

  /**
   * Join a hosted MUD session as guest
   * CRC: crc-HollowIPeer.md → joinSession()
   * Seq: seq-textcraft-multiplayer-command.md
   */
  async joinSession(session: string): Promise<void> {
    if (!this.networkProvider) {
      throw new Error(
        'Cannot join session in solo mode - network provider required'
      )
    }

    console.log('🚪 Joining MUD session:', session)
    this.isHost = false
    this.hostPeerID = session // The session string is the host's peer ID

    // Send login message to host
    const loginMessage: MudMessage = {
      type: 'login',
      text: 'Guest joining session',
    }

    await this.sendToHost(loginMessage)
    console.log('✅ Login message sent to host')
  }

  /**
   * Start relay mode (not supported - circuit relay is built-in)
   * CRC: crc-HollowIPeer.md → startRelay()
   */
  startRelay(): void {
    throw new Error(
      'Relay mode not supported in Hollow (circuit relay is built-in)'
    )
  }

  /**
   * Host via relay mode (not needed - circuit relay is built-in)
   * CRC: crc-HollowIPeer.md → hostViaRelay()
   */
  hostViaRelay(sessionID: string): void {
    throw new Error(
      'Relay hosting not needed in Hollow (circuit relay is built-in)'
    )
  }

  /**
   * Broadcast user Thing changes to all peers
   * CRC: crc-HollowIPeer.md → userThingChanged()
   * Seq: seq-textcraft-character-sync.md
   */
  userThingChanged(thing: Thing): void {
    if (!this.isHost) return

    console.log('👤 User thing changed:', thing.name)

    // Find peer ID for this thing
    const peerID = this.findPeerIDForThing(thing)
    if (!peerID) {
      console.warn('⚠️  Could not find peer ID for thing:', thing.name)
      return
    }

    // Collect custom properties from the Thing
    // In Textcraft, custom properties are set directly on the Thing object
    const properties: any = {}
    for (const key in thing) {
      if (!key.startsWith('_') && typeof (thing as any)[key] !== 'function') {
        properties[key] = (thing as any)[key]
      }
    }

    // Broadcast user update to all other peers
    const message: MudMessage = {
      type: 'userUpdate',
      peerID,
      name: thing.name,
      properties,
    }

    this.broadcast(message, peerID)
    console.log('📢 User update broadcasted for:', thing.name)
  }

  /**
   * Execute MUD command (solo/host/guest modes)
   * CRC: crc-HollowIPeer.md → command()
   * Seq: seq-textcraft-solo-command.md, seq-textcraft-multiplayer-command.md
   */
  command(cmd: string): void {
    // Solo mode - handle locally
    if (!this.networkProvider) {
      console.log('🎮 Solo command:', cmd)
      if (this.soloConnection) {
        try {
          this.soloConnection.toplevelCommand(cmd)
        } catch (error) {
          console.error('❌ Error executing solo command:', error)
          if (this.app && this.app.displayOutput) {
            this.app.displayOutput(`Error: ${error}`)
          }
        }
      } else {
        console.error('❌ No solo connection available')
      }
      return
    }

    if (this.isHost) {
      // For hosts, commands go to their own MudConnection
      console.log('🎮 Host command:', cmd)
      // Find host's own connection (will be implemented with world loading)
      // For now, inform user that host command handling requires a world
      if (this.app && this.app.displayOutput) {
        this.app.displayOutput(
          'Host command processing requires world initialization (Phase 3)'
        )
      }
    } else if (this.hostPeerID) {
      // Guest mode - send command to host
      console.log('📤 Sending command to host:', cmd)
      const message: MudMessage = {
        type: 'command',
        text: cmd,
      }
      this.sendToHost(message)
    } else {
      // Network available but not in a session - handle basic commands locally
      console.log('🎮 Local command (not in session):', cmd)
      this.handleLocalCommand(cmd)
    }
  }

  /**
   * Handle basic commands locally when network is available but not in a session
   * CRC: crc-HollowIPeer.md → handleLocalCommand()
   */
  private handleLocalCommand(cmd: string): void {
    const lower = cmd.toLowerCase().trim()

    if (!this.app || !this.app.displayOutput) {
      console.error('❌ No app display output available')
      return
    }

    if (lower === 'help') {
      this.app.displayOutput(
        `
<strong>Available Commands (Idle Mode):</strong>
• help - Show this help message
• status - Show current session status
• clear - Clear the output (if supported by UI)

<strong>To Play:</strong>
• Click "Host Session" to start hosting a multiplayer session
• Click "Join Session" to join someone else's session

<strong>Note:</strong> Full solo play and MUD world features coming in Phase 3!
            `.trim()
      )
    } else if (lower === 'status') {
      const peerId = this.networkProvider?.getPeerId() || 'unknown'
      this.app.displayOutput(
        `
<strong>Session Status:</strong>
Mode: Idle (network available, not in session)
Your Peer ID: ${peerId}
Network: Connected
            `.trim()
      )
    } else if (lower === 'clear') {
      // Let the UI handle this if it has a clear method
      this.app.displayOutput('Use the UI clear function if available')
    } else {
      this.app.displayOutput(
        `Unknown command: "${cmd}". Type "help" for available commands.`
      )
    }
  }

  // ========== Private Helper Methods ==========

  /**
   * Handle incoming MUD message from a peer
   * CRC: crc-HollowIPeer.md → handleMudMessage()
   * Seq: seq-textcraft-multiplayer-command.md
   */
  private handleMudMessage(peerId: string, message: MudMessage): void {
    console.log('📨 Received MUD message from', peerId, ':', message.type)

    if (this.isHost) {
      this.handleHostMessage(peerId, message)
    } else {
      this.handleGuestMessage(peerId, message)
    }
  }

  /**
   * Handle messages received by the host
   * CRC: crc-HollowIPeer.md → handleHostMessage()
   * Seq: seq-textcraft-multiplayer-command.md
   */
  private handleHostMessage(peerId: string, message: MudMessage): void {
    switch (message.type) {
      case 'login':
        this.handleGuestLogin(peerId)
        break

      case 'command':
        this.handleGuestCommand(peerId, message.text || '')
        break

      default:
        console.warn('⚠️  Unknown message type from guest:', message.type)
    }
  }

  /**
   * Handle messages received by a guest
   * CRC: crc-HollowIPeer.md → handleGuestMessage()
   * Seq: seq-textcraft-multiplayer-command.md
   */
  private handleGuestMessage(peerId: string, message: MudMessage): void {
    switch (message.type) {
      case 'output':
        this.handleHostOutput(message.text || '')
        break

      case 'userUpdate':
        this.handleUserUpdate(message)
        break

      case 'welcome':
        console.log('👋 Received welcome from host')
        break

      default:
        console.warn('⚠️  Unknown message type from host:', message.type)
    }
  }

  /**
   * Handle a guest logging in (host side)
   * CRC: crc-HollowIPeer.md → handleGuestLogin()
   * Seq: seq-textcraft-multiplayer-command.md
   */
  private handleGuestLogin(peerId: string): void {
    console.log('👤 Guest logging in:', peerId)

    if (!this.currentWorld) {
      console.error('❌ Cannot handle guest login: No world loaded')
      return
    }

    // Create MudConnection for this guest
    const mudcon = createConnection(
      this.currentWorld,
      (text: string) => {
        // Output callback - send text back to guest
        this.sendOutputToGuest(peerId, text)
      },
      true // remote = true
    )

    this.mudConnections.set(peerId, mudcon)

    // Track the thing for this peer
    if (mudcon.thing) {
      this.thingToPeerMap.set(mudcon.thing, peerId)
    }

    // Send welcome message
    const welcomeMessage: MudMessage = {
      type: 'welcome',
      text: 'Connected to MUD',
    }

    this.sendMessageToPeer(peerId, welcomeMessage)
    console.log('✅ Guest MudConnection created for:', peerId)
  }

  /**
   * Handle a command from a guest (host side)
   * CRC: crc-HollowIPeer.md → handleGuestCommand()
   * Seq: seq-textcraft-multiplayer-command.md
   */
  private handleGuestCommand(peerId: string, cmd: string): void {
    console.log('⚙️  Processing guest command:', cmd, 'from', peerId)

    const mudcon = this.mudConnections.get(peerId)
    if (!mudcon) {
      console.error('❌ No MudConnection for peer:', peerId)
      return
    }

    try {
      mudcon.toplevelCommand(cmd)
    } catch (error) {
      console.error('❌ Error executing command:', error)
      this.sendOutputToGuest(peerId, `Error: ${error}`)
    }
  }

  /**
   * Handle output from host (guest side)
   * CRC: crc-HollowIPeer.md → handleHostOutput()
   * Seq: seq-textcraft-multiplayer-command.md
   */
  private handleHostOutput(text: string): void {
    console.log('📜 Received output from host:', text)

    // Display output in the adventure view
    // This will be handled by the adventure view component
    if (this.app && this.app.displayOutput) {
      this.app.displayOutput(text)
    }
  }

  /**
   * Handle user update from host (guest side)
   * CRC: crc-HollowIPeer.md → handleUserUpdate()
   * Seq: seq-textcraft-character-sync.md
   */
  private handleUserUpdate(message: MudMessage): void {
    console.log('👤 User update:', message.name)

    // Update the local representation of the user
    // This will be handled by the MudConnection on the guest side
    if (this.app && this.app.updateUser) {
      this.app.updateUser(message.peerID, message.name, message.properties)
    }
  }

  /**
   * Send output text to a specific guest
   * CRC: crc-HollowIPeer.md → sendOutputToGuest()
   * Seq: seq-textcraft-multiplayer-command.md
   */
  private sendOutputToGuest(peerId: string, text: string): void {
    const message: MudMessage = {
      type: 'output',
      text,
    }

    this.sendMessageToPeer(peerId, message)
  }

  /**
   * Send a MUD message to a specific peer
   * CRC: crc-HollowIPeer.md → sendMessageToPeer()
   * Seq: seq-textcraft-multiplayer-command.md
   */
  private sendMessageToPeer(peerId: string, message: MudMessage): void {
    if (!this.networkProvider) {
      console.error('❌ Cannot send message in solo mode')
      return
    }

    const p2pMessage: P2PMessage = {
      method: 'mud',
      payload: message,
    }

    this.networkProvider.sendMessage(peerId, p2pMessage).catch((error) => {
      console.error('❌ Failed to send message to peer:', peerId, error)
    })
  }

  /**
   * Send a message to the host (guest side)
   * CRC: crc-HollowIPeer.md → sendToHost()
   * Seq: seq-textcraft-multiplayer-command.md
   */
  private sendToHost(message: MudMessage): void {
    if (!this.hostPeerID) {
      console.error('❌ Cannot send to host: No host peer ID set')
      return
    }

    this.sendMessageToPeer(this.hostPeerID, message)
  }

  /**
   * Broadcast a message to all connected guests except one
   * CRC: crc-HollowIPeer.md → broadcast()
   * Seq: seq-textcraft-character-sync.md
   */
  private broadcast(message: MudMessage, excludePeerID?: PeerID): void {
    const peerIDs = Array.from(this.mudConnections.keys())
    for (const peerID of peerIDs) {
      if (peerID !== excludePeerID) {
        this.sendMessageToPeer(peerID, message)
      }
    }
  }

  /**
   * Find which peer owns a specific Thing
   * CRC: crc-HollowIPeer.md → findPeerIDForThing()
   */
  private findPeerIDForThing(thing: Thing): PeerID | null {
    return this.thingToPeerMap.get(thing) || null
  }

  /**
   * Set the current world (called by host when loading a world)
   * CRC: crc-HollowIPeer.md → setWorld()
   */
  setWorld(world: any): void {
    this.currentWorld = world
    console.log('🌍 World set for HollowIPeer')
  }

  /**
   * Get the current world
   * CRC: crc-HollowIPeer.md → getWorld()
   */
  getWorld(): any {
    return this.currentWorld
  }

  /**
   * Initialize solo mode - creates a local MudConnection without networking
   * CRC: crc-HollowIPeer.md → startSoloMode()
   * Seq: seq-textcraft-solo-command.md
   */
  startSoloMode(world: any): void {
    console.log('🎮 Starting solo mode...')

    this.currentWorld = world
    this.isHost = false // Solo mode is not hosting

    // Create a local MudConnection for solo play
    this.soloConnection = createConnection(
      world,
      (text: string) => {
        // Output callback - display directly in UI
        if (this.app && this.app.displayOutput) {
          this.app.displayOutput(text)
        }
      },
      false // remote = false for local play
    )

    console.log('✅ Solo mode started - ready to play!')
  }
}
