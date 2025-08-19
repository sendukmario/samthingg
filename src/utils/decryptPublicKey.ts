/**
 * Decrypts a hex-encoded AES-GCM ciphertext using a salt-derived key.
 *
 * @param {string} target - The hex-encoded ciphertext to decrypt.
 * @param {string} salt - A 32-character string used to derive the decryption key and nonce.
 * @returns {Promise<string | null>} The decrypted string, or `null` if decryption fails.
 *
 * @throws {Error} If the salt is not exactly 32 characters long.
 *
 * @example
 * const result = await decryptPublicKey("a1b2c3...", "12345678901234567890123456789012");
 * console.log(result); // decrypted text
 */
export async function decryptPublicKey(
  target: string,
  salt: string
): Promise<string | null> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const nonceBytes = encoder.encode(salt);
  const gcmNonce = nonceBytes.slice(0, 12);
  const ciphertextBytes = hexToBytes(target);

  const hash = await window.crypto.subtle.digest("SHA-256", nonceBytes);

  const key = await window.crypto.subtle.importKey(
    "raw",
    hash,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  try {
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: gcmNonce },
      key,
      ciphertextBytes
    );

    return decoder.decode(decrypted);
  } catch (err) {
    console.error("Decryption failed", err);
    return null;
  }
}

/**
 * Converts a hex-encoded string to a Uint8Array.
 *
 * @param {string} hex - The hex string to convert.
 * @returns {Uint8Array} The resulting byte array.
 *
 * @example
 * const bytes = hexToBytes("aabbcc");
 * console.log(bytes); // Uint8Array [170, 187, 204]
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex?.length / 2);
  for (let i = 0; i < bytes?.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}
