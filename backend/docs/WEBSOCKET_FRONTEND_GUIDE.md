# Frontend WebSocket Guide - Socket.IO Implementation

This guide explains how to integrate with the Socket.IO WebSocket server for real-time portal view updates.

## Installation

First, install the Socket.IO client:

```bash
npm install socket.io-client
```

## Connection URL Format

Connect to a portal view using:

```
/portal-view/{portalViewId}
```

Example:
```
/portal-view/629d9a16-39af-4e1e-9f31-59978a800d15
```

## Authentication

Pass the JWT token in the connection options:

```typescript
import { io, Socket } from 'socket.io-client';

const socket = io(`http://localhost:3000/portal-view/${portalViewId}`, {
  auth: {
    token: yourJWTToken
  }
});
```

## Vue 3 Composable Example

```typescript
// composables/usePortalSocket.ts
import { ref, onUnmounted, watch } from 'vue';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth';

interface PortalSocketOptions {
  portalViewId: string;
  onConnected?: (data: any) => void;
  onPortalViewUpdated?: (data: any) => void;
  onItemUpdated?: (data: any) => void;
  onSyncRequested?: (data: any) => void;
  onSyncResponse?: (data: any) => void;
  onError?: (error: string) => void;
}

export function usePortalSocket(options: PortalSocketOptions) {
  const authStore = useAuthStore();
  const socket = ref<Socket | null>(null);
  const isConnected = ref(false);
  const connectionError = ref<string | null>(null);

  const connect = () => {
    if (!options.portalViewId) {
      console.error('[Portal Socket] No portal view ID provided');
      return;
    }

    if (!authStore.accessToken) {
      console.error('[Portal Socket] No access token available');
      return;
    }

    console.log('[Portal Socket] Connecting to:', options.portalViewId);

    // Create Socket.IO connection
    socket.value = io(`http://localhost:3000/portal-view/${options.portalViewId}`, {
      auth: {
        token: authStore.accessToken
      },
      transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    // Connection events
    socket.value.on('connect', () => {
      console.log('[Portal Socket] Connected');
      isConnected.value = true;
      connectionError.value = null;
    });

    socket.value.on('disconnect', (reason) => {
      console.log('[Portal Socket] Disconnected:', reason);
      isConnected.value = false;
    });

    socket.value.on('connect_error', (error) => {
      console.error('[Portal Socket] Connection error:', error.message);
      connectionError.value = error.message;
      isConnected.value = false;
      if (options.onError) {
        options.onError(error.message);
      }
    });

    // Custom events
    socket.value.on('connected', (data) => {
      console.log('[Portal Socket] Server confirmed connection:', data);
      if (options.onConnected) {
        options.onConnected(data);
      }
    });

    socket.value.on('portal-view-updated', (data) => {
      console.log('[Portal Socket] Portal view updated:', data);
      if (options.onPortalViewUpdated) {
        options.onPortalViewUpdated(data);
      }
    });

    socket.value.on('item-updated', (data) => {
      console.log('[Portal Socket] Item updated:', data);
      if (options.onItemUpdated) {
        options.onItemUpdated(data);
      }
    });

    socket.value.on('sync-requested', (data) => {
      console.log('[Portal Socket] Sync requested:', data);
      if (options.onSyncRequested) {
        options.onSyncRequested(data);
      }
    });

    socket.value.on('sync-response', (data) => {
      console.log('[Portal Socket] Sync response:', data);
      if (options.onSyncResponse) {
        options.onSyncResponse(data);
      }
    });

    socket.value.on('error', (error) => {
      console.error('[Portal Socket] Server error:', error);
      if (options.onError) {
        options.onError(error.message || 'Unknown error');
      }
    });

    // Ping/Pong for connection health
    const pingInterval = setInterval(() => {
      if (socket.value?.connected) {
        socket.value.emit('ping');
      }
    }, 30000); // Ping every 30 seconds

    socket.value.on('pong', (data) => {
      console.log('[Portal Socket] Pong received:', data);
    });

    // Cleanup interval on disconnect
    socket.value.on('disconnect', () => {
      clearInterval(pingInterval);
    });
  };

  const disconnect = () => {
    if (socket.value) {
      console.log('[Portal Socket] Disconnecting');
      socket.value.disconnect();
      socket.value = null;
      isConnected.value = false;
    }
  };

  const sendPortalViewUpdate = (payload: any) => {
    if (!socket.value || !isConnected.value) {
      console.warn('[Portal Socket] Cannot send - not connected');
      return;
    }
    socket.value.emit('portal-view-update', payload);
  };

  const sendItemUpdate = (payload: any) => {
    if (!socket.value || !isConnected.value) {
      console.warn('[Portal Socket] Cannot send - not connected');
      return;
    }
    socket.value.emit('item-update', payload);
  };

  const requestSync = () => {
    if (!socket.value || !isConnected.value) {
      console.warn('[Portal Socket] Cannot send - not connected');
      return;
    }
    socket.value.emit('request-sync');
  };

  const sendSyncResponse = (payload: any) => {
    if (!socket.value || !isConnected.value) {
      console.warn('[Portal Socket] Cannot send - not connected');
      return;
    }
    socket.value.emit('sync-response', payload);
  };

  // Auto-connect when portalViewId changes
  watch(
    () => options.portalViewId,
    (newId) => {
      disconnect();
      if (newId) {
        connect();
      }
    },
    { immediate: true }
  );

  // Cleanup on unmount
  onUnmounted(() => {
    disconnect();
  });

  return {
    socket,
    isConnected,
    connectionError,
    connect,
    disconnect,
    sendPortalViewUpdate,
    sendItemUpdate,
    requestSync,
    sendSyncResponse,
  };
}
```

## Usage in Components

### For Controllers (DM View)

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { usePortalSocket } from '@/composables/usePortalSocket';
import { useRoute } from 'vue-router';

const route = useRoute();
const portalViewId = ref(route.params.id as string);
const currentPortalView = ref(null);

// Setup Socket.IO connection
const {
  isConnected,
  connectionError,
  sendPortalViewUpdate,
  sendItemUpdate,
  sendSyncResponse,
} = usePortalSocket({
  portalViewId: portalViewId.value,
  onConnected: (data) => {
    console.log('Connected as:', data.role);
  },
  onSyncRequested: (data) => {
    // A viewer requested current state - send it
    console.log('Sync requested by user:', data.from);
    sendSyncResponse({
      portalView: currentPortalView.value,
    });
  },
  onError: (error) => {
    alert(`Connection error: ${error}`);
  },
});

// When portal view is updated locally, broadcast to viewers
const updatePortalView = async (updates: any) => {
  // Update via REST API
  const response = await fetch(`/api/portal-views/${portalViewId.value}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  const updated = await response.json();
  currentPortalView.value = updated;

  // Broadcast to connected viewers via WebSocket
  sendPortalViewUpdate(updated);
};

// When current item changes
const changeCurrentItem = (item: any) => {
  updatePortalView({ currentItem: item });
};
</script>

<template>
  <div>
    <div v-if="connectionError" class="error">
      {{ connectionError }}
    </div>
    <div v-else-if="!isConnected" class="warning">
      Connecting to portal view...
    </div>
    <div v-else class="success">
      Connected - viewers will see updates in real-time
    </div>

    <!-- Your DM controls here -->
    <button @click="changeCurrentItem(someItem)">
      Show Item to Players
    </button>
  </div>
</template>
```

### For Viewers (Player Portal)

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { usePortalSocket } from '@/composables/usePortalSocket';
import { useRoute } from 'vue-router';

const route = useRoute();
const portalViewId = ref(route.params.id as string);
const currentPortalView = ref(null);
const currentItem = ref(null);

// Setup Socket.IO connection
const {
  isConnected,
  connectionError,
  requestSync,
} = usePortalSocket({
  portalViewId: portalViewId.value,
  onConnected: (data) => {
    console.log('Connected as viewer');
    // Request current state from controller
    requestSync();
  },
  onPortalViewUpdated: (data) => {
    console.log('Portal view updated:', data);
    currentPortalView.value = data;
  },
  onItemUpdated: (data) => {
    console.log('Item updated:', data);
    currentItem.value = data;
  },
  onSyncResponse: (data) => {
    console.log('Received sync response:', data);
    currentPortalView.value = data.portalView;
  },
  onError: (error) => {
    console.error('Connection error:', error);
  },
});

// Fetch initial state
const loadPortalView = async () => {
  const response = await fetch(`/api/portal-views/${portalViewId.value}`);
  currentPortalView.value = await response.json();
};

loadPortalView();
</script>

<template>
  <div>
    <div v-if="connectionError" class="error">
      {{ connectionError }}
    </div>
    <div v-else-if="!isConnected" class="warning">
      Connecting...
    </div>
    <div v-else class="success">
      Connected - receiving live updates
    </div>

    <!-- Display current item -->
    <div v-if="currentItem">
      <h2>{{ currentItem.name }}</h2>
      <img :src="currentItem.imageUrl" />
    </div>
  </div>
</template>
```

## Message Types

### Client → Server

| Event | Payload | Role Required | Description |
|-------|---------|---------------|-------------|
| `ping` | none | any | Health check |
| `portal-view-update` | `{ ...portalViewData }` | controller | Update portal view state |
| `item-update` | `{ ...itemData }` | controller | Update specific item |
| `request-sync` | none | viewer | Request current state |
| `sync-response` | `{ portalView: {...} }` | controller | Send current state |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `connected` | `{ portalViewId, role, userId, message }` | Connection confirmed |
| `pong` | `{ timestamp }` | Health check response |
| `portal-view-updated` | `{ ...portalViewData }` | Portal view was updated |
| `item-updated` | `{ ...itemData }` | Item was updated |
| `sync-requested` | `{ from: userId }` | Viewer requested sync |
| `sync-response` | `{ portalView: {...} }` | Current state from controller |
| `error` | `{ message }` | Error occurred |

## Connection Management

Socket.IO handles:
- ✅ **Automatic reconnection** - Reconnects automatically if connection drops
- ✅ **Heartbeat/ping-pong** - Built-in connection health monitoring
- ✅ **Transport fallback** - Falls back from WebSocket to polling if needed
- ✅ **Rooms** - Efficient message broadcasting to specific portal views
- ✅ **Authentication** - Token validated before connection established

## Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| `Portal view ID is required` | Missing portalViewId in namespace | Check connection URL |
| `Authentication token is required` | No token provided | Pass token in `auth` option |
| `Invalid authentication token` | Expired or invalid JWT | Refresh token and reconnect |
| `Portal view not found` | Invalid portal view ID | Verify portal view exists |
| `Access denied` | User lacks permissions | Check library access |
| `Only controllers can send updates` | Viewer tried to send update | Only DM/controllers can update |

## Best Practices

1. **Always check `isConnected` before sending messages**
2. **Handle connection errors gracefully** - Show UI feedback
3. **Request sync on connect** - Viewers should request current state
4. **Throttle frequent updates** - Don't spam updates every keystroke
5. **Use TypeScript** - Type your message payloads
6. **Monitor connection status** - Show connection indicator to users
7. **Clean up on unmount** - Socket disconnection is handled automatically

## Testing with Browser DevTools

```javascript
// In browser console
const { io } = require('socket.io-client');

const socket = io('http://localhost:3000/portal-view/YOUR_PORTAL_VIEW_ID', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

socket.on('connected', (data) => console.log('Connected:', data));
socket.on('portal-view-updated', (data) => console.log('Update:', data));

// Send test update (if you're a controller)
socket.emit('portal-view-update', { test: 'data' });
```

## Differences from Native WebSocket

**Advantages of Socket.IO:**
- ✅ Much simpler API - no need to handle readyState, manual reconnection, etc.
- ✅ Built-in reconnection with exponential backoff
- ✅ Event-based (not just message strings)
- ✅ Rooms for efficient broadcasting
- ✅ Automatic transport fallback (WebSocket → polling)
- ✅ Built-in heartbeat mechanism
- ✅ Better error handling

**What Changed:**
- URL: Now `/portal-view/{id}` instead of `/ws/portal-view/{id}`
- Token: Passed in `auth` option, not query parameter
- Events: Named events instead of `type` in message payload
- Connection: Automatic reconnection, no manual retry logic needed

That's it! Socket.IO is much more user-friendly and production-ready! 🎉
