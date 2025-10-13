/**
 * IP Address Detection Utilities
 * Detects external and internal IP addresses using WebRTC and public infrastructure
 */

export class IPAddressDetector {
    /**
     * Detect external and internal IP addresses using WebRTC ICE candidates
     * @returns Promise with external and internal IP addresses
     */
    static async detectIPAddresses(): Promise<{ external: string[], internal: string[] }> {
        const external: string[] = [];
        const internal: string[] = [];

        try {
            // Create RTCPeerConnection (no STUN servers needed with universal-connectivity)
            // However, for IP detection specifically, we use public STUN temporarily
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' }
                ]
            });

            // Create a dummy data channel to trigger ICE gathering
            pc.createDataChannel('');

            // Create offer to start ICE gathering
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // Wait for ICE candidates with timeout
            await new Promise<void>((resolve) => {
                const timeout = setTimeout(() => {
                    resolve();
                }, 5000); // 5 second timeout

                pc.onicecandidate = (event) => {
                    if (!event.candidate) {
                        // ICE gathering complete
                        clearTimeout(timeout);
                        resolve();
                        return;
                    }

                    const candidate = event.candidate.candidate;
                    if (!candidate) return;

                    // Parse ICE candidate to extract IP
                    const parts = candidate.split(' ');
                    if (parts.length < 5) return;

                    const ip = parts[4];
                    const type = event.candidate.type;

                    // Filter out localhost addresses only
                    if (ip.startsWith('127.') || ip === '::1' || ip === 'localhost') {
                        return;
                    }

                    // Allow .local mDNS hostnames - they may be useful for local network discovery
                    // Only filter out non-IP, non-.local hostnames
                    // Valid: IPv4 (contains .), IPv6 (contains :), or .local hostnames
                    if (!ip.includes('.') && !ip.includes(':')) {
                        return;
                    }

                    // Categorize by candidate type
                    if (type === 'host') {
                        // Local network IP
                        if (!internal.includes(ip)) {
                            internal.push(ip);
                        }
                    } else if (type === 'srflx' || type === 'prflx') {
                        // Server reflexive (external) IP from STUN
                        if (!external.includes(ip)) {
                            external.push(ip);
                        }
                    }
                };
            });

            // Clean up
            pc.close();

            console.log('🌐 Detected IPs - External:', external, 'Internal:', internal);
        } catch (error) {
            console.warn('⚠️  IP address detection failed:', error);
        }

        return { external, internal };
    }

    /**
     * Convert IP addresses to libp2p multiaddrs
     * @param ips IP addresses to convert
     * @param port Port number (optional)
     * @returns Array of multiaddr strings
     */
    static ipsToMultiaddrs(ips: string[], port?: number): string[] {
        const multiaddrs: string[] = [];

        for (const ip of ips) {
            // Detect IPv4 vs IPv6
            const isIPv6 = ip.includes(':');
            const protocol = isIPv6 ? 'ip6' : 'ip4';

            // Create multiaddr with or without port
            if (port) {
                multiaddrs.push(`/${protocol}/${ip}/tcp/${port}`);
            } else {
                multiaddrs.push(`/${protocol}/${ip}`);
            }
        }

        return multiaddrs;
    }
}
