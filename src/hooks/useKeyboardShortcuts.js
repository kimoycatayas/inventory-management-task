import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

/**
 * Global keyboard shortcuts hook
 * Handles app-wide keyboard shortcuts with proper input detection
 * 
 * @param {Object} options
 * @param {Function} options.onOpenHelp - Callback to open shortcuts help modal
 * @param {Function} options.onCloseHelp - Callback to close shortcuts help modal
 */
export function useKeyboardShortcuts({ onOpenHelp, onCloseHelp }) {
  const router = useRouter();
  const sequenceRef = useRef({ keys: [], timeout: null, secondKeyHandler: null });

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ignore if modifier keys are pressed
      if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }

      // Check if user is typing in an input, textarea, select, or contenteditable
      const target = event.target;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      // Handle Esc key (always works, even when typing)
      if (event.key === 'Escape') {
        if (isTyping) {
          // Blur the focused element
          target.blur();
        }
        // Close help modal if open
        if (onCloseHelp) {
          onCloseHelp();
        }
        return;
      }

      // Ignore all other shortcuts if user is typing
      if (isTyping) {
        return;
      }

      // Handle "?" (Shift + /) to open help
      if (event.key === '?' && event.shiftKey) {
        event.preventDefault();
        if (onOpenHelp) {
          onOpenHelp();
        }
        return;
      }

      // Handle "/" to focus search
      if (event.key === '/' && !event.shiftKey) {
        event.preventDefault();
        const searchInput = document.querySelector('[data-shortcut="search"]');
        if (searchInput) {
          searchInput.focus();
          // Select all text if it's an input
          if (searchInput.tagName === 'INPUT' || searchInput.tagName === 'TEXTAREA') {
            searchInput.select();
          }
        }
        return;
      }

      // Handle "g" sequence for navigation
      if (event.key === 'g' || event.key === 'G') {
        event.preventDefault();
        
        // Clear any existing timeout and listener
        if (sequenceRef.current.timeout) {
          clearTimeout(sequenceRef.current.timeout);
        }
        if (sequenceRef.current.secondKeyHandler) {
          document.removeEventListener('keydown', sequenceRef.current.secondKeyHandler);
        }

        // Set timeout to reset sequence
        sequenceRef.current.timeout = setTimeout(() => {
          sequenceRef.current.keys = [];
          sequenceRef.current.secondKeyHandler = null;
        }, 1000);

        // Wait for second key
        const handleSecondKey = (e) => {
          // Ignore if modifier keys are pressed
          if (e.ctrlKey || e.altKey || e.metaKey) {
            if (sequenceRef.current.timeout) {
              clearTimeout(sequenceRef.current.timeout);
            }
            sequenceRef.current.keys = [];
            sequenceRef.current.secondKeyHandler = null;
            document.removeEventListener('keydown', handleSecondKey);
            return;
          }

          // Check if still typing
          const target = e.target;
          const isTyping =
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable;

          if (isTyping) {
            if (sequenceRef.current.timeout) {
              clearTimeout(sequenceRef.current.timeout);
            }
            sequenceRef.current.keys = [];
            sequenceRef.current.secondKeyHandler = null;
            document.removeEventListener('keydown', handleSecondKey);
            return;
          }

          const secondKey = e.key.toLowerCase();
          
          // Clear timeout
          if (sequenceRef.current.timeout) {
            clearTimeout(sequenceRef.current.timeout);
          }
          sequenceRef.current.keys = [];
          sequenceRef.current.secondKeyHandler = null;

          // Remove this listener
          document.removeEventListener('keydown', handleSecondKey);

          // Handle navigation based on second key
          switch (secondKey) {
            case 'h':
              e.preventDefault();
              router.push('/');
              break;
            case 'p':
              e.preventDefault();
              router.push('/products');
              break;
            case 'w':
              e.preventDefault();
              router.push('/warehouses');
              break;
            case 't':
              e.preventDefault();
              router.push('/transfers');
              break;
            default:
              // Not a valid sequence, ignore
              break;
          }
        };

        // Store handler reference for cleanup
        sequenceRef.current.secondKeyHandler = handleSecondKey;

        // Listen for second key
        document.addEventListener('keydown', handleSecondKey, { once: true });
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (sequenceRef.current.timeout) {
        clearTimeout(sequenceRef.current.timeout);
      }
      if (sequenceRef.current.secondKeyHandler) {
        document.removeEventListener('keydown', sequenceRef.current.secondKeyHandler);
      }
    };
  }, [router, onOpenHelp, onCloseHelp]);
}
