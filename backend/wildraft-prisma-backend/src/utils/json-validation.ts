/**
 * JSON validation utilities for flexible JSON fields
 * Provides size limits and basic structure validation while maintaining flexibility
 */

// Maximum size for JSON fields (1MB in bytes)
const MAX_JSON_SIZE = 1024 * 1024; // 1MB

// Maximum depth for nested JSON structures (prevents extremely deep nesting)
const MAX_JSON_DEPTH = 20;

/**
 * Validates JSON size by stringifying and checking byte length
 */
export function validateJsonSize(data: any, maxSize: number = MAX_JSON_SIZE): { valid: boolean; error?: string } {
  try {
    const jsonString = JSON.stringify(data);
    const sizeInBytes = Buffer.byteLength(jsonString, 'utf8');
    
    if (sizeInBytes > maxSize) {
      const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
      const maxSizeInMB = (maxSize / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        error: `JSON payload too large: ${sizeInMB}MB exceeds maximum of ${maxSizeInMB}MB`,
      };
    }
    
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `Failed to validate JSON size: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Validates JSON depth to prevent extremely nested structures
 */
export function validateJsonDepth(data: any, maxDepth: number = MAX_JSON_DEPTH, currentDepth: number = 0): { valid: boolean; error?: string } {
  if (currentDepth > maxDepth) {
    return {
      valid: false,
      error: `JSON structure too deep: exceeds maximum depth of ${maxDepth} levels`,
    };
  }
  
  if (data === null || data === undefined) {
    return { valid: true };
  }
  
  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      for (const item of data) {
        const result = validateJsonDepth(item, maxDepth, currentDepth + 1);
        if (!result.valid) {
          return result;
        }
      }
    } else {
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const result = validateJsonDepth(data[key], maxDepth, currentDepth + 1);
          if (!result.valid) {
            return result;
          }
        }
      }
    }
  }
  
  return { valid: true };
}

/**
 * Validates that items field is an array if provided
 */
export function validateItemsArray(items: any): { valid: boolean; error?: string } {
  if (items === null || items === undefined) {
    return { valid: true };
  }
  
  if (!Array.isArray(items)) {
    return {
      valid: false,
      error: 'Items field must be an array or null',
    };
  }
  
  return { valid: true };
}

/**
 * Comprehensive validation for flexible JSON fields
 * Validates size, depth, and basic structure
 */
export function validateFlexibleJson(
  data: any,
  options: {
    maxSize?: number;
    maxDepth?: number;
    mustBeArray?: boolean;
  } = {}
): { valid: boolean; error?: string } {
  const { maxSize = MAX_JSON_SIZE, maxDepth = MAX_JSON_DEPTH, mustBeArray = false } = options;
  
  // Skip validation if data is null/undefined
  if (data === null || data === undefined) {
    return { valid: true };
  }
  
  // Validate array structure if required
  if (mustBeArray) {
    const arrayValidation = validateItemsArray(data);
    if (!arrayValidation.valid) {
      return arrayValidation;
    }
  }
  
  // Validate size
  const sizeValidation = validateJsonSize(data, maxSize);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }
  
  // Validate depth
  const depthValidation = validateJsonDepth(data, maxDepth);
  if (!depthValidation.valid) {
    return depthValidation;
  }
  
  return { valid: true };
}

