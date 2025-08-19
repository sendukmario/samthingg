/**
 * Utility functions for browser environment checks
 */

/**
 * Checks if code is running in a browser environment
 * @returns boolean indicating if window is defined
 */
export const isBrowser = (): boolean => typeof window !== 'undefined';

/**
 * Checks if the Clipboard API with ClipboardItem is available
 * @returns boolean indicating if clipboard with ClipboardItem is supported
 */
export const hasClipboardSupport = (): boolean => {
  try {
    return isBrowser() && 
           typeof ClipboardItem !== 'undefined' && 
           typeof navigator.clipboard !== 'undefined' && 
           typeof navigator.clipboard.write === 'function';
  } catch {
    return false;
  }
};

/**
 * Safely executes a function only in browser environment
 * @param callback Function to execute in browser environment
 * @param fallback Optional fallback value to return in non-browser environment
 * @returns Result of callback in browser or fallback value
 */
export const runInBrowser = <T>(callback: () => T, fallback?: T): T => {
  if (isBrowser()) {
    try {
      return callback();
    } catch (error) {
      console.warn('Error in browser operation:', error);
      return fallback as T;
    }
  }
  return fallback as T;
};

/**
 * Creates a ClipboardItem safely if the environment supports it
 * @param blob The blob to create a ClipboardItem from
 * @param context Optional context string for error logging
 * @returns ClipboardItem or null if creation failed
 */
export const createClipboardItem = (blob: Blob, context: string = 'unknown'): ClipboardItem | null => {
  if (!hasClipboardSupport()) {
    return null;
  }
  
  try {
    return new ClipboardItem({ [blob.type]: blob });
  } catch (error) {
    console.warn(`Error creating ClipboardItem in ${context}:`, error);
    return null;
  }
};

/**
 * Safely writes to clipboard using the Clipboard API
 * @param items Array of ClipboardItem to write to clipboard
 * @param context Optional context string for error logging
 * @returns Promise resolving to boolean indicating success
 */
export const writeToClipboard = async (items: ClipboardItem[], context: string = 'unknown'): Promise<boolean> => {
  if (!hasClipboardSupport() || !items || items.length === 0) {
    return false;
  }
  
  try {
    await navigator.clipboard.write(items);
    return true;
  } catch (error) {
    console.warn(`Error writing to clipboard in ${context}:`, error);
    return false;
  }
};