# Library Management System

Role-based access control (RBAC) for libraries with three access levels.

## Access Roles

| Role | Can View | Can Edit | Can Delete | Can Manage Access |
|------|----------|----------|------------|-------------------|
| **OWNER** | ✅ | ✅ | ✅ | ✅ |
| **EDITOR** | ✅ | ✅ | ❌ | ❌ |
| **VIEWER** | ✅ | ❌ | ❌ | ❌ |

## Library Routes

### Get All Libraries
Get all libraries you have access to with your role.

```http
GET /api/libraries
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "libraries": [
    {
      "id": 1,
      "name": "My Library",
      "description": "A collection",
      "role": "OWNER",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create Library
Create a new library (you become OWNER automatically).

```http
POST /api/libraries
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "My New Library",
  "description": "Optional description"
}
```

### Get Library Details
Get detailed information about a library (requires VIEWER+).

```http
GET /api/libraries/:id
Authorization: Bearer YOUR_TOKEN
```

### Update Library
Update library details (requires EDITOR+).

```http
PUT /api/libraries/:id
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

### Delete Library
Delete a library (requires OWNER).

```http
DELETE /api/libraries/:id
Authorization: Bearer YOUR_TOKEN
```

## Access Management Routes

### List Access
Get all users who have access to a library (requires VIEWER+).

```http
GET /api/libraries/:libraryId/access
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "access": [
    {
      "id": 1,
      "userId": 1,
      "role": "OWNER",
      "user": {
        "id": 1,
        "email": "owner@example.com",
        "name": "Owner"
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Grant Access
Give another user access to your library (requires OWNER).

```http
POST /api/libraries/:libraryId/access
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "email": "friend@example.com",
  "role": "EDITOR"
}
```

**Note:** Can only grant `EDITOR` or `VIEWER` roles (not OWNER).

### Update User Role
Change a user's access level (requires OWNER).

```http
PUT /api/libraries/:libraryId/access/:accessId
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "role": "VIEWER"
}
```

**Note:** Cannot change OWNER role.

### Remove Access
Remove a user's access (requires OWNER).

```http
DELETE /api/libraries/:libraryId/access/:accessId
Authorization: Bearer YOUR_TOKEN
```

**Note:** Cannot remove OWNER access.

### Leave Library
Remove yourself from a library.

```http
POST /api/libraries/:libraryId/leave
Authorization: Bearer YOUR_TOKEN
```

**Note:** Owners cannot leave their own libraries (must transfer ownership or delete).

## Quick Examples

### Share a library with a friend
```bash
# 1. Get your library ID
curl http://localhost:3000/api/libraries \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Grant access
curl -X POST http://localhost:3000/api/libraries/1/access \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"friend@example.com","role":"EDITOR"}'
```

### Check who has access
```bash
curl http://localhost:3000/api/libraries/1/access \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update someone's role
```bash
# Change from EDITOR to VIEWER
curl -X PUT http://localhost:3000/api/libraries/1/access/5 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"VIEWER"}'
```

## Frontend Integration

```javascript
// Get all accessible libraries
async function getLibraries() {
  const token = localStorage.getItem('accessToken');
  const response = await fetch('http://localhost:3000/api/libraries', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

// Create library
async function createLibrary(name, description) {
  const token = localStorage.getItem('accessToken');
  const response = await fetch('http://localhost:3000/api/libraries', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, description })
  });
  return response.json();
}

// Grant access
async function grantAccess(libraryId, email, role) {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`http://localhost:3000/api/libraries/${libraryId}/access`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, role })
  });
  return response.json();
}
```

## Permission Rules

- **Creating**: Anyone can create a library
- **Viewing**: Need at least VIEWER access
- **Editing**: Need at least EDITOR access
- **Deleting**: Only OWNER can delete
- **Managing Access**: Only OWNER can grant/revoke/update access
- **Leaving**: Anyone can leave (except owners of their own libraries)

## Error Responses

**401 Unauthorized**: Not logged in or invalid token

**403 Forbidden**: Insufficient permissions for this action

**404 Not Found**: Library or access record doesn't exist

**409 Conflict**: User already has access to this library

## Use Cases

### Personal Library
1. Create library (you're OWNER)
2. Add/edit/delete content
3. Optionally share with others

### Collaborative Library
1. Create library
2. Grant EDITOR access to collaborators
3. Everyone can edit
4. Only you can delete or manage access

### Shared Reference Library
1. Create library
2. Grant VIEWER access to team
3. They can view but not edit
4. You maintain control

For more details, see the [Swagger documentation](http://localhost:3000/docs).
