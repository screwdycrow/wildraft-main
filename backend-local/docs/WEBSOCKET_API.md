# WebSocket API for Portal Views

This document describes the WebSocket API for real-time communication between the DM client and portal view clients.

## Connection

**Endpoint:** `ws://localhost:3000/ws/portal-view/:portalViewId?token=<JWT_TOKEN>`

**⚠️ CRITICAL:** This API uses **native WebSockets**, NOT Socket.IO. 

**DO NOT USE Socket.IO client library!** Use the browser's native `WebSocket` API instead.

If you see `EIO=4&transport=websocket` in your connection URL, you're using Socket.IO - this will NOT work with this server.

### Authentication

Connect with a JWT access token as a query parameter:

```
ws://localhost:3000/ws/portal-view/550e8400-e29b-41d4-a716-446655440000?token=YOUR_ACCESS_TOKEN
```

**Note:** The route works with or without a trailing slash. Both `/ws/portal-view/:portalViewId` and `/ws/portal-view/:portalViewId/` are supported.

### Connection Flow

1. Client connects to WebSocket endpoint with JWT token
2. Server validates token and checks library access
3. Server assigns role based on library access:
   - **controller**: OWNER or EDITOR (DM client)
   - **viewer**: VIEWER (Portal client)
4. Server sends `connected` message with role information

### Connection Response

```json
{
  "type": "connected",
  "portalViewId": "550e8400-e29b-41d4-a716-446655440000",
  "role": "controller",
  "message": "Connected to portal view"
}
```

## Message Types

### Client → Server Messages

#### 1. Ping
Keep-alive message.

```json
{
  "type": "ping"
}
```

**Response:**
```json
{
  "type": "pong"
}
```

#### 2. Portal View Update (Controller Only)
Update portal view settings. Only controllers can send this.

```json
{
  "type": "portal-view-update",
  "payload": {
    "name": "Player View - Updated",
    "showEncounter": true,
    "showHealth": true,
    "showAC": true,
    "showActions": false,
    "autoResetImageState": false,
    "combatEncounterId": 1,
    "currentItem": 0,
    "items": [...]
  }
}
```

**Broadcast to all viewers:**
```json
{
  "type": "portal-view-updated",
  "payload": {
    "name": "Player View - Updated",
    "showEncounter": true,
    ...
  }
}
```

#### 3. Item Update (Controller Only)
Update a specific item in the portal view.

```json
{
  "type": "item-update",
  "payload": {
    "itemId": "item-1",
    "position": { "x": 100, "y": 100 },
    "scale": 1.5,
    "visible": true
  }
}
```

**Broadcast to all viewers:**
```json
{
  "type": "item-updated",
  "payload": {
    "itemId": "item-1",
    "position": { "x": 100, "y": 100 },
    ...
  }
}
```

#### 4. Request Sync (Viewer Only)
Request current state from controller.

```json
{
  "type": "request-sync"
}
```

**Notifies controller:**
```json
{
  "type": "sync-requested",
  "from": 123
}
```

#### 5. Sync Response (Controller Only)
Controller responds to sync request with current state.

```json
{
  "type": "sync-response",
  "payload": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Player View",
    "items": [...],
    ...
  }
}
```

**Broadcast to all viewers:**
```json
{
  "type": "sync-response",
  "payload": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    ...
  }
}
```

### Server → Client Messages

#### 1. Connected
Sent when connection is established.

```json
{
  "type": "connected",
  "portalViewId": "550e8400-e29b-41d4-a716-446655440000",
  "role": "controller",
  "message": "Connected to portal view"
}
```

#### 2. Portal View Updated
Broadcast when portal view is updated via REST API or WebSocket.

```json
{
  "type": "portal-view-updated",
  "payload": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Player View - Updated",
    "showEncounter": true,
    "showHealth": true,
    "showAC": true,
    "showActions": false,
    "autoResetImageState": false,
    "combatEncounterId": 1,
    "currentItem": 0,
    "items": [...]
  }
}
```

#### 3. Item Updated
Broadcast when an item is updated.

```json
{
  "type": "item-updated",
  "payload": {
    "itemId": "item-1",
    "position": { "x": 100, "y": 100 },
    "scale": 1.5
  }
}
```

#### 4. Sync Requested
Notifies controller that a viewer requested sync.

```json
{
  "type": "sync-requested",
  "from": 123
}
```

#### 5. Sync Response
Current state sent in response to sync request.

```json
{
  "type": "sync-response",
  "payload": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Player View",
    "items": [...]
  }
}
```

#### 6. Error
Error message.

```json
{
  "type": "error",
  "message": "Only controllers can send updates"
}
```

## Roles

### Controller (DM Client)
- Can send `portal-view-update`
- Can send `item-update`
- Can send `sync-response`
- Receives all broadcasts
- Receives `sync-requested` notifications

### Viewer (Portal Client)
- Can send `request-sync`
- Receives all broadcasts
- Cannot send updates

## REST API Integration

When portal views are updated via REST API, the changes are automatically broadcast to all connected WebSocket clients:

- **POST** `/api/libraries/:libraryId/portal-views` - Broadcasts new portal view
- **PUT** `/api/libraries/:libraryId/portal-views/:portalViewId` - Broadcasts update
- **DELETE** `/api/libraries/:libraryId/portal-views/:portalViewId` - Broadcasts deletion

## Client Implementation Examples

### JavaScript/TypeScript

**⚠️ IMPORTANT: Use native WebSocket, NOT Socket.IO!**

```typescript
// ✅ CORRECT - Native WebSocket
const token = 'YOUR_ACCESS_TOKEN';
const portalViewId = '550e8400-e29b-41d4-a716-446655440000';
const ws = new WebSocket(
  `ws://localhost:3000/ws/portal-view/${portalViewId}?token=${token}`
);

// ❌ WRONG - Socket.IO (DO NOT USE)
// const socket = io(`ws://localhost:3000/ws/portal-view/${portalViewId}?token=${token}`);
```

ws.onopen = () => {
  console.log('Connected to portal view');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'connected':
      console.log('Role:', message.role);
      break;
    case 'portal-view-updated':
      // Update portal view UI
      updatePortalView(message.payload);
      break;
    case 'item-updated':
      // Update specific item
      updateItem(message.payload);
      break;
    case 'error':
      console.error('Error:', message.message);
      break;
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from portal view');
};

// Send update (controller only)
function sendUpdate(payload: any) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'portal-view-update',
      payload,
    }));
  }
}

// Send ping
function ping() {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}

// Keep-alive interval
setInterval(ping, 30000); // Every 30 seconds
```

### React Hook Example

```typescript
import { useEffect, useRef, useState } from 'react';

export function usePortalViewSocket(portalViewId: string, token: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [role, setRole] = useState<'controller' | 'viewer' | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(
      `ws://localhost:3000/ws/portal-view/${portalViewId}?token=${token}`
    );

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'connected') {
        setRole(message.role);
      }
      // Handle other message types...
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      setIsConnected(false);
      setRole(null);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [portalViewId, token]);

  const sendUpdate = (payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'portal-view-update',
        payload,
      }));
    }
  };

  return {
    isConnected,
    role,
    sendUpdate,
  };
}
```

## Error Handling

### Connection Errors

- **1008**: Authentication required / Invalid token / User not found
- **1008**: Portal view not found
- **1008**: Access denied (no library access)

### Message Errors

If a message is invalid or unauthorized, the server will send an error message:

```json
{
  "type": "error",
  "message": "Only controllers can send updates"
}
```

## Best Practices

1. **Reconnection**: Implement automatic reconnection with exponential backoff
2. **Keep-Alive**: Send ping messages every 30 seconds to keep connection alive
3. **Error Handling**: Handle connection errors and message errors gracefully
4. **State Management**: Sync local state with server state on connection
5. **Role Checking**: Check role before attempting to send controller-only messages

## Security

- All connections require valid JWT token
- Library access is verified before allowing connection
- Role-based permissions enforced on message types
- Only users with library access can connect to portal views

