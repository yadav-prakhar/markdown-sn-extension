/**
 * Helper functions for tests
 */

/**
 * Convert markdown without [code] wrapper tags for easier testing
 */
export function convertWithoutCodeTags(convertFunc, input, options = {}) {
  return convertFunc(input, { ...options, skipCodeTags: true });
}

/**
 * Convert markdown with default ServiceNow format (includes [code] tags)
 */
export function convertWithCodeTags(convertFunc, input, options = {}) {
  return convertFunc(input, options);
}
