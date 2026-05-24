// mockDb.js
// Simulates Firestore real-time functionality using localStorage and BroadcastChannel.
// Allows seamless multi-tab testing without Firebase configuration.

const channel = new BroadcastChannel('luluchat_mock_db_sync');

// Helper to get rooms from localStorage
const getRooms = () => {
  try {
    return JSON.parse(localStorage.getItem('luluchat_rooms')) || {};
  } catch (e) {
    return {};
  }
};

// Helper to save rooms to localStorage
const saveRooms = (rooms) => {
  localStorage.setItem('luluchat_rooms', JSON.stringify(rooms));
};

// Helper to get messages for a room
const getMessages = (roomId) => {
  try {
    return JSON.parse(localStorage.getItem(`luluchat_messages_${roomId}`)) || [];
  } catch (e) {
    return [];
  }
};

// Helper to save messages for a room
const saveMessages = (roomId, messages) => {
  localStorage.setItem(`luluchat_messages_${roomId}`, JSON.stringify(messages));
};

// Subscriptions storage
const roomListeners = new Map(); // roomId -> Set of callbacks
const messageListeners = new Map(); // roomId -> Set of callbacks

// Listen for broadcast sync messages
channel.onmessage = (event) => {
  const { type, roomId } = event.data;
  
  if (type === 'ROOM_UPDATE' && roomListeners.has(roomId)) {
    const rooms = getRooms();
    const room = rooms[roomId];
    if (room) {
      roomListeners.get(roomId).forEach((cb) => cb(room));
    }
  }
  
  if (type === 'MESSAGE_UPDATE' && messageListeners.has(roomId)) {
    const messages = getMessages(roomId);
    messageListeners.get(roomId).forEach((cb) => cb(messages));
  }
};

// Exported mock services
export const mockDb = {
  createRoom: async (creatorName) => {
    // Generate a simple unique 8-character ID
    const roomId = Math.random().toString(36).substring(2, 10);
    // Generate a 6-digit numeric passcode
    const passcode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const newRoom = {
      id: roomId,
      passcode,
      creatorName,
      joinedName: null,
      status: 'waiting',
      createdAt: new Date().toISOString()
    };
    
    const rooms = getRooms();
    rooms[roomId] = newRoom;
    saveRooms(rooms);
    
    return newRoom;
  },

  joinRoom: async (roomId, passcode, username) => {
    const rooms = getRooms();
    const room = rooms[roomId];
    
    if (!room) {
      throw new Error('Room not found');
    }
    
    if (room.status === 'disbanded') {
      throw new Error('Bu lobi dağıtılmış ve kalıcı olarak kapatılmıştır.');
    }
    
    if (room.passcode !== passcode) {
      throw new Error('Invalid passcode');
    }
    
    if (room.status === 'active' && room.joinedName !== username && room.creatorName !== username) {
      throw new Error('Room is full (2/2)');
    }
    
    // If the creator is re-entering, it's fine.
    // If a new user is joining:
    if (room.creatorName !== username && room.joinedName !== username) {
      room.joinedName = username;
      room.status = 'active';
      rooms[roomId] = room;
      saveRooms(rooms);
      
      // Notify other tabs
      channel.postMessage({ type: 'ROOM_UPDATE', roomId });
      
      // Trigger local listener if any
      if (roomListeners.has(roomId)) {
        roomListeners.get(roomId).forEach((cb) => cb(room));
      }
    }
    
    return room;
  },

  listenToRoom: (roomId, callback) => {
    // Immediate callback execution with current state
    const rooms = getRooms();
    const room = rooms[roomId];
    if (room) {
      callback(room);
    }
    
    if (!roomListeners.has(roomId)) {
      roomListeners.set(roomId, new Set());
    }
    roomListeners.get(roomId).add(callback);
    
    // Return unsubscribe function
    return () => {
      if (roomListeners.has(roomId)) {
        roomListeners.get(roomId).delete(callback);
        if (roomListeners.get(roomId).size === 0) {
          roomListeners.delete(roomId);
        }
      }
    };
  },

  listenToMessages: (roomId, callback) => {
    // Immediate callback execution with current state
    const messages = getMessages(roomId);
    callback(messages);
    
    if (!messageListeners.has(roomId)) {
      messageListeners.set(roomId, new Set());
    }
    messageListeners.get(roomId).add(callback);
    
    // Return unsubscribe function
    return () => {
      if (messageListeners.has(roomId)) {
        messageListeners.get(roomId).delete(callback);
        if (messageListeners.get(roomId).size === 0) {
          messageListeners.delete(roomId);
        }
      }
    };
  },

  sendMessage: async (roomId, sender, text, imageBase64 = '') => {
    const messages = getMessages(roomId);
    const newMessage = {
      id: Math.random().toString(36).substring(2, 15),
      sender,
      text,
      image: imageBase64,
      timestamp: new Date().toISOString()
    };
    
    messages.push(newMessage);
    saveMessages(roomId, messages);
    
    // Notify other tabs
    channel.postMessage({ type: 'MESSAGE_UPDATE', roomId });
    
    // Trigger local listener
    if (messageListeners.has(roomId)) {
      messageListeners.get(roomId).forEach((cb) => cb(messages));
    }
    
    return newMessage;
  },

  leaveRoom: async (roomId, username) => {
    const rooms = getRooms();
    const room = rooms[roomId];
    if (!room) return;
    
    room.status = 'disbanded';
    rooms[roomId] = room;
    saveRooms(rooms);
    channel.postMessage({ type: 'ROOM_UPDATE', roomId });
    if (roomListeners.has(roomId)) {
      roomListeners.get(roomId).forEach((cb) => cb(room));
    }
  },

  getDisbandedRooms: async () => {
    const rooms = getRooms();
    return Object.values(rooms)
      .filter(room => room.status === 'disbanded')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  getRoomMessages: async (roomId) => {
    return getMessages(roomId);
  }
};
