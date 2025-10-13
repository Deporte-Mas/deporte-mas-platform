/**
 * Validates if a string is a valid HTTPS URL
 * @param {string} url - The URL to validate
 * @returns {boolean} True if valid HTTPS URL, false otherwise
 */
export const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return false;
  }

  try {
    const urlObj = new URL(trimmed);

    // Only allow HTTPS protocol for security
    if (urlObj.protocol !== 'https:') {
      return false;
    }

    // Ensure hostname exists and is not empty
    if (!urlObj.hostname || urlObj.hostname.length === 0) {
      return false;
    }

    return true;
  } catch (error) {
    // URL constructor throws if URL is malformed
    return false;
  }
};

/**
 * Sanitizes a URL string by trimming whitespace
 * @param {string} url - The URL to sanitize
 * @returns {string} Sanitized URL
 */
export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return '';
  }

  return url.trim();
};
