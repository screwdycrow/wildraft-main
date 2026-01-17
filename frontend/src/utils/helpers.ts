/**
 * Global utility functions for common operations
 */

/**
 * Debounce function - delays execution until after wait time has passed
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @param immediate - If true, call function immediately on first invocation
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }

    const callNow = immediate && !timeout

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)

    if (callNow) func(...args)
  }
}

/**
 * Throttle function - limits function execution to once per wait time
 * @param func - Function to throttle
 * @param wait - Wait time in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  let lastResult: ReturnType<T>

  return function executedFunction(...args: Parameters<T>): ReturnType<T> {
    if (!inThrottle) {
      lastResult = func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, wait)
    }
    return lastResult
  }
}

/**
 * Deep clone an object
 * @param obj - Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T
  if (typeof obj === 'object') {
    const clonedObj = {} as { [key: string]: any }
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj as T
  }
  return obj
}

/**
 * Sleep/delay function
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after ms
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Format number with commas
 * @param num - Number to format
 * @returns Formatted string
 */
export function formatNumber(num: number): string {
  return num.toLocaleString()
}

/**
 * Clamp a number between min and max
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Generate a random ID
 * @param length - Length of ID (default: 8)
 * @returns Random ID string
 */
export function randomId(length = 8): string {
  return Math.random().toString(36).substring(2, 2 + length)
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 * @param value - Value to check
 * @returns True if empty
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * Get a value from nested object using dot notation path
 * @param obj - Object to get value from
 * @param path - Dot notation path (e.g., 'user.profile.name')
 * @param defaultValue - Default value if path doesn't exist
 * @returns Value at path or default
 */
export function getNestedValue<T = any>(
  obj: any,
  path: string,
  defaultValue?: T
): T | undefined {
  const keys = path.split('.')
  let result = obj

  for (const key of keys) {
    if (result === null || result === undefined) return defaultValue
    result = result[key]
  }

  return result !== undefined ? result : defaultValue
}

/**
 * Set a value in nested object using dot notation path
 * @param obj - Object to set value in
 * @param path - Dot notation path (e.g., 'user.profile.name')
 * @param value - Value to set
 */
export function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.')
  const lastKey = keys.pop()!
  let current = obj

  for (const key of keys) {
    if (current[key] === null || current[key] === undefined) {
      current[key] = {}
    }
    current = current[key]
  }

  current[lastKey] = value
}

/**
 * Remove duplicates from array
 * @param array - Array to remove duplicates from
 * @param key - Optional key to compare objects by
 * @returns Array without duplicates
 */
export function unique<T>(array: T[], key?: keyof T): T[] {
  if (!key) {
    return Array.from(new Set(array))
  }

  const seen = new Set()
  return array.filter(item => {
    const value = item[key]
    if (seen.has(value)) {
      return false
    }
    seen.add(value)
    return true
  })
}

/**
 * Group array items by a key
 * @param array - Array to group
 * @param key - Key to group by (function or key name)
 * @returns Object with grouped arrays
 */
export function groupBy<T>(
  array: T[],
  key: keyof T | ((item: T) => string)
): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : String(item[key])
    if (!result[groupKey]) {
      result[groupKey] = []
    }
    result[groupKey].push(item)
    return result
  }, {} as Record<string, T[]>)
}

