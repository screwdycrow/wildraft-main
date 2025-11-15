# Library Versions API Documentation

## Overview

The Library Versions API provides a version tracking system for efficient client-side caching. Instead of constantly refetching library data, clients can check version numbers to determine if their cached data is still valid.

Each library has three separate version counters:
- **version** - Increments when library metadata (name, description) changes
- **tagsVersion** - Increments when tags are created, updated, or deleted
- **itemsVersion** - Increments when library items are created, updated, or deleted

## How It Works

1. **Client caches data** with version numbers in localStorage
2. **Client checks versions** before using cached data
3. **If versions match** → Use cached data (no API call needed)
4. **If versions differ** → Refetch only the changed data

This dramatically reduces API calls and improves performance, especially for large libraries.

## API Endpoints

### Get Library Versions

**GET** `/api/libraries/:libraryId/versions`

Get current version numbers for a specific library.

**Authentication:** Required (Bearer Token)  
**Permission:** VIEWER, EDITOR, or OWNER access to the library

**Path Parameters:**
- `libraryId` (string, required) - The ID of the library

**Response (200):**
```json
{
  "libraryId": 6,
  "version": 3,
  "tagsVersion": 5,
  "itemsVersion": 12,
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

**Response Fields:**
- `libraryId` (number) - The library ID
- `version` (number) - Current library metadata version
- `tagsVersion` (number) - Current tags version
- `itemsVersion` (number) - Current items version
- `updatedAt` (string) - ISO timestamp of last version update

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/libraries/6/versions" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Response:**
```json
{
  "libraryId": 6,
  "version": 3,
  "tagsVersion": 5,
  "itemsVersion": 12,
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

**Errors:**
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User doesn't have access to this library
- `404 Not Found` - Library doesn't exist
- `500 Internal Server Error` - Server error

---

### Batch Get Versions

**POST** `/api/versions/batch`

Get version numbers for multiple libraries at once. Useful for checking all libraries the user has access to.

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "libraryIds": [6, 7, 8]
}
```

**Request Fields:**
- `libraryIds` (number[], required) - Array of library IDs to check

**Response (200):**
```json
{
  "versions": [
    {
      "libraryId": 6,
      "version": 3,
      "tagsVersion": 5,
      "itemsVersion": 12,
      "updatedAt": "2025-01-15T10:30:00.000Z"
    },
    {
      "libraryId": 7,
      "version": 1,
      "tagsVersion": 2,
      "itemsVersion": 8,
      "updatedAt": "2025-01-14T15:20:00.000Z"
    },
    {
      "libraryId": 8,
      "version": 1,
      "tagsVersion": 1,
      "itemsVersion": 1,
      "updatedAt": "2025-01-15T09:00:00.000Z"
    }
  ]
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/versions/batch" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"libraryIds": [6, 7, 8]}'
```

**Errors:**
- `400 Bad Request` - Invalid request body (missing or empty libraryIds array)
- `401 Unauthorized` - Missing or invalid authentication token
- `500 Internal Server Error` - Server error

**Note:** If a library doesn't have a version record yet, one will be automatically created with all versions set to 1.

---

## Version Increment Rules

Versions are automatically incremented by the backend when changes occur:

### Library Version (`version`)
- ✅ Library created (initialized to 1)
- ✅ Library name updated
- ✅ Library description updated

### Tags Version (`tagsVersion`)
- ✅ Tag created
- ✅ Tag updated (name, color, folder)
- ✅ Tag deleted

### Items Version (`itemsVersion`)
- ✅ Library item created
- ✅ Library item updated (name, description, data, tags, files)
- ✅ Library item deleted

**Note:** Version records are automatically created when a library is created. If you check versions for an existing library that doesn't have a version record yet, one will be created automatically.

---

## Frontend Integration Example

### Basic Version Check

```typescript
// Check if cached library data is still valid
async function checkLibraryCache(libraryId: number, cachedVersion: number) {
  const response = await fetch(`/api/libraries/${libraryId}/versions`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const { version } = await response.json();
  
  if (version > cachedVersion) {
    // Cache is stale, refetch library
    return false;
  }
  
  // Cache is valid
  return true;
}
```

### Smart Caching with Version Tracking

```typescript
interface CachedLibrary {
  data: any;
  version: number;
  tagsVersion: number;
  itemsVersion: number;
  cachedAt: number;
}

// Get library with version checking
async function getLibrary(libraryId: number): Promise<any> {
  const cacheKey = `library_${libraryId}`;
  const cached = localStorage.getItem(cacheKey);
  
  if (cached) {
    const cachedData: CachedLibrary = JSON.parse(cached);
    
    // Check versions
    const response = await fetch(`/api/libraries/${libraryId}/versions`);
    const serverVersions = await response.json();
    
    // Check if library metadata changed
    if (serverVersions.version > cachedData.version) {
      // Refetch library
      const library = await fetchLibraryFromAPI(libraryId);
      localStorage.setItem(cacheKey, JSON.stringify({
        data: library,
        ...serverVersions,
        cachedAt: Date.now()
      }));
      return library;
    }
    
    // Check if tags changed
    if (serverVersions.tagsVersion > cachedData.tagsVersion) {
      // Refetch tags only
      const tags = await fetchTagsFromAPI(libraryId);
      // Update cache with new tags version
    }
    
    // Check if items changed
    if (serverVersions.itemsVersion > cachedData.itemsVersion) {
      // Refetch items only
      const items = await fetchItemsFromAPI(libraryId);
      // Update cache with new items version
    }
    
    // All versions match, use cache
    return cachedData.data;
  }
  
  // No cache, fetch from API
  const library = await fetchLibraryFromAPI(libraryId);
  const versions = await fetchVersions(libraryId);
  
  localStorage.setItem(cacheKey, JSON.stringify({
    data: library,
    ...versions,
    cachedAt: Date.now()
  }));
  
  return library;
}
```

### Batch Version Check

```typescript
// Check versions for all libraries at once
async function checkAllLibraryVersions(libraryIds: number[]) {
  const response = await fetch('/api/versions/batch', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ libraryIds })
  });
  
  const { versions } = await response.json();
  
  // Compare with cached versions
  versions.forEach(serverVersion => {
    const cached = getCachedLibrary(serverVersion.libraryId);
    if (cached) {
      if (serverVersion.version > cached.version) {
        // Library changed, refetch
        refetchLibrary(serverVersion.libraryId);
      }
      if (serverVersion.tagsVersion > cached.tagsVersion) {
        // Tags changed, refetch
        refetchTags(serverVersion.libraryId);
      }
      if (serverVersion.itemsVersion > cached.itemsVersion) {
        // Items changed, refetch
        refetchItems(serverVersion.libraryId);
      }
    }
  });
}
```

---

## Best Practices

### 1. Check Versions Before Using Cache
Always check versions before using cached data. Don't assume cache is valid.

### 2. Granular Refetching
Only refetch what changed:
- If `tagsVersion` changed → refetch tags only
- If `itemsVersion` changed → refetch items only
- If `version` changed → refetch library metadata

### 3. Batch Version Checks
Use the batch endpoint when checking multiple libraries to reduce API calls.

### 4. Handle Missing Versions
If a library doesn't have a version record, the API will create one automatically. Your frontend should handle this gracefully.

### 5. Cache Expiration
Consider adding a TTL (time-to-live) to your cache in addition to version checking. For example, invalidate cache after 24 hours regardless of version.

### 6. Error Handling
If version check fails, fall back to refetching the data. Don't block the UI waiting for version checks.

---

## Performance Benefits

### Without Version Tracking
- Every page load: 3-5 API calls (library, tags, items, etc.)
- Every navigation: Full refetch
- **Result:** Slow, high server load, poor UX

### With Version Tracking
- First load: Full fetch + cache versions
- Subsequent loads: 1 version check API call
- If versions match: 0 additional API calls (use cache)
- If versions differ: Only refetch what changed
- **Result:** Fast, low server load, excellent UX

**Example:**
- User has 5 libraries
- Without version tracking: 15-25 API calls on page load
- With version tracking: 1 batch version check (5 libraries) + only refetch what changed
- **Savings:** 80-95% reduction in API calls

---

## Database Schema

The version tracking uses a `LibraryVersion` table:

```prisma
model LibraryVersion {
  id            Int      @id @default(autoincrement())
  libraryId     Int      @unique
  library       Library  @relation(fields: [libraryId], references: [id], onDelete: Cascade)
  version       Int      @default(1) // Library metadata version
  tagsVersion   Int      @default(1) // Tags version
  itemsVersion  Int      @default(1) // Items version
  updatedAt     DateTime @default(now()) @updatedAt

  @@index([libraryId])
}
```

Versions are automatically incremented by the backend when changes occur. You don't need to manually manage version numbers.

---

## Troubleshooting

### Versions Not Incrementing
- Check that you're using the correct route handlers
- Verify the library ID is correct
- Check server logs for errors

### Cache Always Invalid
- Ensure you're comparing the correct version fields
- Check that cached versions are being stored correctly
- Verify version numbers are numbers, not strings

### Performance Issues
- Use batch version checks for multiple libraries
- Don't check versions on every render - debounce or use intervals
- Consider background version checks while user is idle

---

## Related Documentation

- [Libraries API](./LIBRARIES.md) - Library management
- [Tags API](./TAGS_API.md) - Tag management
- [Library Items API](./LIBRARY_ITEMS_API.md) - Item management
- [File URLs](./FILES_API.md) - File URL expiration (6 hours)

