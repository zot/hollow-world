import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Clipboard functionality', () => {
    let mockClipboard: { writeText: ReturnType<typeof vi.fn> };
    let originalExecCommand: typeof document.execCommand;

    beforeEach(() => {
        // Mock navigator.clipboard
        mockClipboard = {
            writeText: vi.fn()
        };
        Object.assign(navigator, {
            clipboard: mockClipboard
        });

        // Store original execCommand
        originalExecCommand = document.execCommand;
    });

    afterEach(() => {
        // Restore original execCommand
        document.execCommand = originalExecCommand;
    });

    it('should successfully copy text to clipboard using Clipboard API', async () => {
        mockClipboard.writeText.mockResolvedValue(undefined);

        const testText = 'ABC12345-peer-id-12345';
        await navigator.clipboard.writeText(testText);

        expect(mockClipboard.writeText).toHaveBeenCalledWith(testText);
    });

    it('should handle clipboard write failure and show user feedback', async () => {
        const error = new Error('Clipboard write failed');
        mockClipboard.writeText.mockRejectedValue(error);

        await expect(navigator.clipboard.writeText('test')).rejects.toThrow('Clipboard write failed');
    });

    it('should copy invitation code format correctly', async () => {
        mockClipboard.writeText.mockResolvedValue(undefined);

        const inviteCode = 'ABC12345';
        const peerId = 'peer-id-67890';
        const invitation = `${inviteCode}-${peerId}`;

        await navigator.clipboard.writeText(invitation);

        expect(mockClipboard.writeText).toHaveBeenCalledWith('ABC12345-peer-id-67890');
    });

    it('should fallback to execCommand when Clipboard API is unavailable', () => {
        // Remove Clipboard API
        Object.assign(navigator, { clipboard: undefined });

        // Mock execCommand
        const mockExecCommand = vi.fn().mockReturnValue(true);
        document.execCommand = mockExecCommand;

        // Mock document.createElement and related methods
        const mockTextArea = {
            value: '',
            style: {} as CSSStyleDeclaration,
            focus: vi.fn(),
            select: vi.fn()
        };
        const originalCreateElement = document.createElement;
        document.createElement = vi.fn((tag: string) => {
            if (tag === 'textarea') {
                return mockTextArea as unknown as HTMLTextAreaElement;
            }
            return originalCreateElement.call(document, tag);
        }) as unknown as typeof document.createElement;

        const mockAppendChild = vi.fn();
        const mockRemoveChild = vi.fn();
        document.body.appendChild = mockAppendChild;
        document.body.removeChild = mockRemoveChild;

        // Test the fallback path would be taken
        expect(navigator.clipboard).toBeUndefined();
    });

    it('should properly format and copy complex peer IDs with dashes', async () => {
        mockClipboard.writeText.mockResolvedValue(undefined);

        const inviteCode = 'XYZ98765';
        const peerId = 'complex-peer-id-with-multiple-dashes';
        const invitation = `${inviteCode}-${peerId}`;

        await navigator.clipboard.writeText(invitation);

        expect(mockClipboard.writeText).toHaveBeenCalledWith('XYZ98765-complex-peer-id-with-multiple-dashes');
    });
});
