# WebSocket Migration to Socket.IO

## Why We Switched

We migrated from `@fastify/websocket` (native WebSocket) to Socket.IO because:

1. **Much simpler API** - No dealing with `readyState`, manual connection handling, or complex parameter extraction
2. **Built-in reconnection** - Automatic reconnection with exponential backoff
3. **Better error handling** - Proper error propagation and handling
4. **Event-based** - Named events instead of parsing message types
5. **Rooms** - Built-in room support for efficient broadcasting
6. **Production-ready** - Battle-tested in thousands of production apps

## What Changed

### Backend Changes

#### 1. Dependencies
**Before:**
```json
"@fastify/websocket": "^x.x.x"
```

**After:**
```json
"socket.io": "^4.x.x",
"fastify-socket.io": "^5.x.x"
```

#### 2. Server Setup (src/index.ts)
**Before:**
```typescript
import websocket from '@fastify/websocket';
fastify.register(websocket);
registerPortalViewSocket(fastify);
```

**After:**
```typescript
import fastifySocketIO from 'fastify-socket.io';

fastify.register(fastifySocketIO, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

fastify.ready().then(() => {
  registerPortalViewSocket(fastify);
});
```

#### 3. WebSocket Handler (src/websocket/portal-view-socket.ts)
**Before:** ~400 lines of complex parameter extraction, socket state management, etc.

**After:** ~250 lines of clean, event-based code with Socket.IO

Key improvements:
- ✅ Parameters from `socket.handshake.auth` and `socket.handshake.query`
- ✅ Namespaces: `/portal-view/{id}`
- ✅ Middleware for authentication
- ✅ Built-in rooms: `socket.join(portalViewId)`
- ✅ Easy broadcasting: `socket.to(portalViewId).emit()`
- ✅ Automatic cleanup

### Frontend Changes

#### 1. Installation
```bash
npm install socket.io-client
```

#### 2. Connection
**Before:**
```typescript
const ws = new WebSocket(
  `ws://localhost:3000/ws/portal-view/${id}?token=${token}`
);
```

**After:**
```typescript
import { io } from 'socket.io-client';

const socket = io(`http://localhost:3000/portal-view/${id}`, {
  auth: { token }
});
```

#### 3. Sending Messages
**Before:**
```typescript
ws.send(JSON.stringify({ type: 'portal-view-update', payload: data }));
```

**After:**
```typescript
socket.emit('portal-view-update', data);
```

#### 4. Receiving Messages
**Before:**
```typescript
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'portal-view-updated') {
    // handle
  }
};
```

**After:**
```typescript
socket.on('portal-view-updated', (data) => {
  // handle
});
```

#### 5. Reconnection
**Before:** Manual implementation with timers and retry logic

**After:** Automatic! Just configure:
```typescript
{
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 10,
}
```

## New URL Format

### WebSocket Endpoint
**Before:** `ws://localhost:3000/ws/portal-view/{portalViewId}?token=...`

**After:** `/portal-view/{portalViewId}` (with token in auth option)

Example:
```typescript
const socket = io('http://localhost:3000/portal-view/629d9a16-39af-4e1e-9f31-59978a800d15', {
  auth: { token: yourJWTToken }
});
```

## Authentication

**Before:** Token in query parameter
```
?token=eyJhbGci...
```

**After:** Token in handshake auth
```typescript
io(url, {
  auth: {
    token: yourJWTToken
  }
});
```

## Benefits We Gained

1. **No more `readyState` checks** - Socket.IO handles connection state internally
2. **No manual reconnection logic** - Built-in with backoff
3. **No manual ping/pong** - Built-in heartbeat
4. **No JSON.stringify/parse** - Automatic serialization
5. **Proper event typing** - TypeScript-friendly events
6. **Transport fallback** - Falls back to polling if WebSocket fails
7. **Better debugging** - Socket.IO DevTools available

## Migration Checklist

- [x] Install Socket.IO dependencies
- [x] Update server setup in `src/index.ts`
- [x] Rewrite WebSocket handler for Socket.IO
- [x] Add TypeScript declarations for Fastify + Socket.IO
- [x] Update frontend guide with Socket.IO examples
- [x] Test authentication flow
- [x] Test broadcasting
- [x] Test reconnection
- [ ] Update existing frontend code to use Socket.IO client
- [ ] Remove old `@fastify/websocket` dependency

## Frontend Migration Steps

1. Install `socket.io-client`:
   ```bash
   npm install socket.io-client
   ```

2. Update your composable to use Socket.IO (see `docs/WEBSOCKET_FRONTEND_GUIDE.md`)

3. Update all components that use WebSocket:
   - Replace `WebSocket` with `io()`
   - Change message sending from `ws.send()` to `socket.emit()`
   - Change event handlers from `ws.onmessage` to `socket.on()`
   - Remove manual reconnection logic

4. Test thoroughly:
   - Connection establishment
   - Authentication
   - Message sending/receiving
   - Automatic reconnection
   - Multiple clients

## Files Changed

### Backend
- `src/index.ts` - Socket.IO registration
- `src/websocket/portal-view-socket.ts` - Complete rewrite
- `src/types/fastify-socket.io.d.ts` - New type declarations
- `package.json` - New dependencies

### Documentation
- `docs/WEBSOCKET_FRONTEND_GUIDE.md` - Updated for Socket.IO
- `docs/WEBSOCKET_MIGRATION_SOCKETIO.md` - This file

## Testing

Once your frontend is updated, test:

1. **DM (controller) connects** - Should see "Connected as: controller"
2. **Player (viewer) connects** - Should see "Connected as: viewer"
3. **DM sends update** - Players should receive it instantly
4. **Multiple players** - All should receive updates
5. **Disconnect/reconnect** - Should reconnect automatically
6. **Kill server** - Clients should attempt to reconnect
7. **Invalid token** - Should reject with clear error

## Rollback Plan

If needed to rollback:
1. `npm install @fastify/websocket`
2. Restore `src/index.ts` from git history
3. Restore `src/websocket/portal-view-socket.ts` from git history
4. Remove `src/types/fastify-socket.io.d.ts`
5. Keep frontend on old WebSocket code

## Performance Notes

Socket.IO has slightly more overhead than raw WebSocket due to:
- Protocol framing
- Heartbeat packets
- Fallback transport support

However, for 99% of use cases (including this one), the overhead is negligible and worth the developer experience and reliability improvements.

## Conclusion

This migration significantly improves:
- **Developer experience** - Much simpler code
- **Reliability** - Built-in reconnection
- **Maintainability** - Less custom code to maintain
- **Features** - Rooms, namespaces, broadcasting

The old `@fastify/websocket` implementation had issues with parameter extraction that were framework-specific and poorly documented. Socket.IO is a proven, production-ready solution used by millions of applications.

✨ **Socket.IO FTW!** ✨

