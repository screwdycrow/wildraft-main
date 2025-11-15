# WebSocket Backend Implementation Summary

## Architecture Overview

The WebSocket server is built using **Fastify** with the `@fastify/websocket` plugin (v8.3.1).

## Files Structure

```
src/
├── index.ts                           # Main server file (WebSocket plugin registered)
├── websocket/
│   └── portal-view-socket.ts         # Portal View WebSocket handler
└── routes/
    └── portal-views.ts               # REST API routes (can broadcast updates)
```

## Key Components

### 1. WebSocket Route Handler (`portal-view-socket.ts`)

**Endpoint:** `GET /ws/portal-view/:portalViewId?token=<JWT>`

**Authentication Flow:**
1. Extract `portalViewId` from URL params
2. Extract JWT `token` from query string
3. Verify JWT token
4. Check user exists in database
5. Check portal view exists
6. Verify user has access to portal view's library
7. Determine role: `controller` (OWNER/EDITOR) or `viewer`

**Connection Management:**
- Connections stored in `portalViewConnections` Map by portal view ID
- Socket metadata stored in `socketMetadata` Map
- Automatic cleanup on disconnect

### 2. Message Handlers

| Message Type | Controller | Viewer | Action |
|--------------|------------|--------|--------|
| `ping` | ✅ | ✅ | Returns `pong` with timestamp |
| `portal-view-update` | ✅ | ❌ | Broadcasts to all viewers |
| `item-update` | ✅ | ❌ | Broadcasts to all viewers |
| `request-sync` | ❌ | ✅ | Notifies controller |
| `sync-response` | ✅ | ❌ | Broadcasts to all viewers |

### 3. Broadcasting Functions

#### `broadcastToPortalView()`
Sends message to all connections in a portal view (except sender)

#### `notifyController()`
Sends message only to controller connections

#### `broadcastPortalViewUpdate()` (exported)
Called from REST API routes to notify WebSocket clients of updates

## Data Flow

### Controller → Viewers (Real-time Updates)
```
Controller Client
      ↓
  WebSocket
      ↓
portal-view-update message
      ↓
 Server broadcasts
      ↓
All Viewer Clients
```

### REST API → WebSocket Clients
```
REST API Call
      ↓
Update Database
      ↓
broadcastPortalViewUpdate()
      ↓
All Connected Clients
```

### Viewer → Controller (Sync Request)
```
Viewer Client
      ↓
request-sync message
      ↓
Server routes to controller
      ↓
Controller Client
      ↓
sync-response message
      ↓
All Viewer Clients
```

## Important Implementation Details

### SocketStream vs WebSocket
```typescript
// In @fastify/websocket v8+
async (connection: SocketStream, req: FastifyRequest) => {
  const socket = connection.socket; // This is the actual WebSocket
  
  // Use socket.send(), socket.on(), socket.close()
  socket.send(JSON.stringify({ type: 'connected' }));
}
```

### Parameter Access
```typescript
// In @fastify/websocket, req.params and req.query may be undefined
// Extract from URL directly for reliability
const urlParts = req.url.split('?')[0].split('/');
const portalViewId = urlParts[urlParts.length - 1];

const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
const token = url.searchParams.get('token');
```

### Safe Broadcasting
```typescript
// Always check readyState before sending
if (connection.socket.readyState === connection.socket.OPEN) {
  connection.socket.send(messageStr);
}
```

## Server Configuration

### In `src/index.ts`:
```typescript
import websocket from '@fastify/websocket';
import { registerPortalViewSocket } from './websocket/portal-view-socket';

// Register WebSocket plugin
fastify.register(websocket);

// Register WebSocket routes (BEFORE regular routes)
registerPortalViewSocket(fastify);

// Then register REST routes
fastify.register(authRoutes, { prefix: '/api' });
fastify.register(libraryRoutes, { prefix: '/api' });
// ... etc
```

**⚠️ Important:** WebSocket routes must be registered BEFORE REST routes!

## Integration with REST API

To broadcast updates from REST endpoints:

```typescript
import { broadcastPortalViewUpdate } from '../websocket/portal-view-socket';

// In your route handler
fastify.patch('/api/portal-views/:id', async (request, reply) => {
  // ... update database ...
  
  // Notify WebSocket clients
  await broadcastPortalViewUpdate(fastify, portalViewId, {
    currentItem: updatedPortalView.currentItem,
    showHealth: updatedPortalView.showHealth,
    // ... other fields
  });
  
  return updatedPortalView;
});
```

## Error Handling

### Connection Errors
- **1008 Policy Violation**: Auth/permission issues
- **1011 Internal Server Error**: Unexpected server errors
- **1003 Unsupported Data**: Wrong protocol (e.g., Socket.IO attempt)

### Logging
All errors are logged with context:
```typescript
fastify.log.error({ 
  error,
  portalViewId,
  userId,
  stack: error.stack 
}, 'Error description');
```

## Testing

### Manual Test with wscat
```bash
npm install -g wscat

# Connect
wscat -c "ws://localhost:3000/ws/portal-view/YOUR_PORTAL_ID?token=YOUR_JWT"

# Send messages
{"type":"ping"}
{"type":"portal-view-update","payload":{"currentItem":2}}
```

### Browser Console Test
```javascript
const ws = new WebSocket('ws://localhost:3000/ws/portal-view/YOUR_ID?token=YOUR_TOKEN');
ws.onmessage = (e) => console.log(JSON.parse(e.data));
ws.send(JSON.stringify({ type: 'ping' }));
```

## Security Considerations

✅ **Implemented:**
- JWT authentication required
- Database user verification
- Portal view access control
- Role-based message permissions

❌ **Not Implemented (Future):**
- Rate limiting per connection
- Message size limits
- Connection count per user limit

## Performance Notes

- **Connection Storage**: O(1) lookup by portal view ID
- **Broadcasting**: O(n) where n = connections in portal view
- **Memory**: Each connection stores minimal metadata
- **Recommended**: Monitor connection count in production

## Monitoring Recommendations

```typescript
// Add to your metrics/monitoring
- Total active connections
- Connections per portal view
- Messages sent/received per second
- Connection duration
- Reconnection frequency
```

## Common Issues & Solutions

### Issue: "TypeError: socket.send is not a function"
**Solution:** Use `connection.socket` not `connection` directly

### Issue: Parameters are undefined
**Solution:** Access via `req.params` and `req.query`, not `connection`

### Issue: Messages not reaching clients
**Solution:** Check `socket.readyState === socket.OPEN` before sending

### Issue: Memory leak
**Solution:** Ensure cleanup in `socket.on('close')` handler

## Future Enhancements

1. **Compression**: Enable per-message deflate for large payloads
2. **Binary Support**: For image data or large datasets
3. **Presence**: Track who's viewing in real-time
4. **Typing Indicators**: Show when controller is making changes
5. **Batching**: Group rapid updates to reduce messages
6. **Metrics**: Track connection health and performance

## Resources

- [@fastify/websocket docs](https://github.com/fastify/fastify-websocket)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [RFC 6455](https://tools.ietf.org/html/rfc6455) - WebSocket Protocol

