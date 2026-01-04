import { useState, useCallback } from 'react';
import { Clipboard, Platform } from 'react-native';

/**
 * A custom hook that provides clipboard functionality.
 * @returns {Object} An object containing clipboard functions and state.
 * @property {string | null} data - The current clipboard content.
 * @property {boolean} hasString - Whether the clipboard contains text.
 * @property {Function} getString - Gets the current clipboard content as a string.
 * @property {Function} setString - Sets the clipboard content to the specified string.
 * @property {Function} hasString - Checks if the clipboard contains text.
 * @property {Function} setImage - Sets the clipboard content to the specified image (Android only).
 * @property {Function} getImage - Gets the current clipboard content as an image (Android only).
 *
 * @example
 * function ClipboardExample() {
 *   const { data, hasString, setString, getString } = useClipboard();
 *   const [text, setText] = useState('');
 *
 *   const handleCopy = () => {
 *     setString('Hello, world!');
 *   };
 *
 *   const handlePaste = async () => {
 *     const content = await getString();
 *     setText(content);
 *   };
 *
 *   return (
 *     <View>
 *       <Button title="Copy to Clipboard" onPress={handleCopy} />
 *       <Button title="Paste from Clipboard" onPress={handlePaste} />
 *       <Text>Current clipboard: {data || 'Empty'}</Text>
 *       <Text>Pasted text: {text}</Text>
 *     </View>
 *   );
 * }
 */
function useClipboard() {
  const [data, setData] = useState<string | null>(null);

  /**
   * Gets the current clipboard content as a string.
   * @returns {Promise<string>} A promise that resolves to the clipboard content.
   */
  const getString = useCallback(async (): Promise<string> => {
    try {
      const content = await Clipboard.getString();
      setData(content);
      return content;
    } catch (error) {
      console.error('Failed to get clipboard content:', error);
      return '';
    }
  }, []);

  /**
   * Sets the clipboard content to the specified string.
   * @param {string} content - The text to copy to the clipboard.
   */
  const setString = useCallback(async (content: string): Promise<void> => {
    try {
      await Clipboard.setString(content);
      setData(content);
    } catch (error) {
      console.error('Failed to set clipboard content:', error);
    }
  }, []);

  /**
   * Checks if the clipboard contains text.
   * @returns {Promise<boolean>} A promise that resolves to whether the clipboard contains text.
   */
  const hasString = useCallback(async (): Promise<boolean> => {
    try {
      const content = await getString();
      return content.length > 0;
    } catch (error) {
      console.error('Failed to check clipboard content:', error);
      return false;
    }
  }, [getString]);

  /**
   * Sets the clipboard content to the specified image (Android only).
   * @param {string} image - The base64-encoded image to copy to the clipboard.
   * @returns {Promise<boolean>} A promise that resolves to whether the operation was successful.
   */
  const setImage = useCallback(async (image: string): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      console.warn('setImage is only available on Android');
      return false;
    }

    try {
      // @ts-ignore - setImage is available on Android
      await Clipboard.setImage(image);
      return true;
    } catch (error) {
      console.error('Failed to set image to clipboard:', error);
      return false;
    }
  }, []);

  /**
   * Gets the current clipboard content as an image (Android only).
   * @returns {Promise<string | null>} A promise that resolves to the base64-encoded image, or null if not available.
   */
  const getImage = useCallback(async (): Promise<string | null> => {
    if (Platform.OS !== 'android') {
      console.warn('getImage is only available on Android');
      return null;
    }

    try {
      // @ts-ignore - getImage is available on Android
      const image = await Clipboard.getImage();
      return image;
    } catch (error) {
      console.error('Failed to get image from clipboard:', error);
      return null;
    }
  }, []);

  return {
    data,
    hasString: data !== null && data.length > 0,
    getString,
    setString,
    hasString: hasString,
    setImage,
    getImage,
  };
}

export default useClipboard;
