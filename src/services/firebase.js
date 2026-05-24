// firebase.js
import { mockDb } from './mockDb';

let app = null;
let db = null;
let useFirebase = false;

// List of expected configuration keys
const CONFIG_KEYS = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId'
];

// Helper to get configuration from localStorage or process.env (Vite)
export const getSavedFirebaseConfig = () => {
  // 1. Try localStorage
  try {
    const localConfig = localStorage.getItem('luluoynamiyorum_firebase_config');
    if (localConfig) {
      const parsed = JSON.parse(localConfig);
      if (validateConfig(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    // Ignore localStorage read errors
  }

  // 2. Try env variables (with fallbacks for static production deployments)
  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDPVgRtMXISSvQvT5u7B50CWveQleOOga0',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'budgetmore-9829a.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'budgetmore-9829a',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'budgetmore-9829a.firebasestorage.app',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '317982292168',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:317982292168:web:81b2d7f050bfffd4094dfd'
  };

  if (validateConfig(envConfig)) {
    return envConfig;
  }

  return null;
};

// Validate that a configuration object has all required fields
export const validateConfig = (config) => {
  if (!config) return false;
  return CONFIG_KEYS.every(key => typeof config[key] === 'string' && config[key].trim().length > 0);
};

// Save Firebase configuration to localStorage
export const saveFirebaseConfig = (config) => {
  if (validateConfig(config)) {
    localStorage.setItem('luluoynamiyorum_firebase_config', JSON.stringify(config));
    return true;
  }
  return false;
};

// Clear Firebase configuration from localStorage
export const clearFirebaseConfig = () => {
  localStorage.removeItem('luluoynamiyorum_firebase_config');
};

// Check if Firebase is currently active
export const isFirebaseConfigured = () => {
  return useFirebase;
};

// Dynamically initialize Firebase
const initFirebase = async () => {
  const config = getSavedFirebaseConfig();
  if (!config) {
    console.warn("luluoynamiyorum: Firebase credentials not found. Falling back to Local Demo Mode (Mock DB).");
    useFirebase = false;
    return;
  }

  try {
    // Dynamically import Firebase libraries to avoid bundle issues if not installed or configured
    const { initializeApp } = await import('firebase/app');
    const { getFirestore } = await import('firebase/firestore');

    app = initializeApp(config);
    db = getFirestore(app);
    useFirebase = true;
    console.log("luluoynamiyorum: Firebase successfully initialized and connected!");
  } catch (error) {
    console.error("luluoynamiyorum: Failed to initialize Firebase. Falling back to Local Demo Mode.", error);
    useFirebase = false;
  }
};

// Initialize on load
initFirebase();

// Helper to check and wait for Firebase init if needed
const ensureInitialized = async () => {
  // If we haven't loaded yet, try to wait briefly
  if (app === null && getSavedFirebaseConfig()) {
    await initFirebase();
  }
};

// Service interface combining Firebase Firestore and MockDB fallback
export const chatService = {
  isFirebase: () => useFirebase,

  createRoom: async (creatorName) => {
    await ensureInitialized();
    if (!useFirebase) {
      return mockDb.createRoom(creatorName);
    }

    try {
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      
      const roomId = Math.random().toString(36).substring(2, 10);
      const passcode = Math.floor(100000 + Math.random() * 900000).toString();

      const roomData = {
        id: roomId,
        passcode,
        creatorName,
        joinedName: null,
        status: 'waiting',
        createdAt: new Date().toISOString()
      };
      
      const roomRef = doc(db, 'rooms', roomId);
      await setDoc(roomRef, {
        ...roomData,
        createdAt: serverTimestamp()
      });

      return roomData;
    } catch (e) {
      console.error("Firebase createRoom error, falling back to mock:", e);
      return mockDb.createRoom(creatorName);
    }
  },

  joinRoom: async (roomId, passcode, username) => {
    await ensureInitialized();
    if (!useFirebase) {
      return mockDb.joinRoom(roomId, passcode, username);
    }

    try {
      const { doc, getDoc, updateDoc } = await import('firebase/firestore');
      
      const roomRef = doc(db, 'rooms', roomId);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error('Oda bulunamadı');
      }
      
      const room = roomSnap.data();
      
      if (room.status === 'disbanded') {
        throw new Error('Bu lobi dağıtılmış ve kalıcı olarak kapatılmıştır.');
      }
      
      if (room.passcode !== passcode) {
        throw new Error('Geçersiz şifre');
      }
      
      if (room.status === 'active' && room.joinedName !== username && room.creatorName !== username) {
        throw new Error('Oda dolu (2/2)');
      }
      
      // Update room state if joining for the first time
      if (room.creatorName !== username && room.joinedName !== username) {
        await updateDoc(roomRef, {
          joinedName: username,
          status: 'active'
        });
        room.joinedName = username;
        room.status = 'active';
      }
      
      return room;
    } catch (e) {
      console.error("Firebase joinRoom error, falling back to mock:", e);
      return mockDb.joinRoom(roomId, passcode, username);
    }
  },

  listenToRoom: (roomId, callback) => {
    if (!useFirebase) {
      return mockDb.listenToRoom(roomId, callback);
    }

    let unsubscribe = () => {};
    
    // Asynchronous listener setup
    (async () => {
      try {
        const { doc, onSnapshot } = await import('firebase/firestore');
        const roomRef = doc(db, 'rooms', roomId);
        unsubscribe = onSnapshot(roomRef, (docSnap) => {
          if (docSnap.exists()) {
            callback(docSnap.data());
          } else {
            callback(null);
          }
        }, (err) => {
          console.error("Firebase listenToRoom snapshot error:", err);
        });
      } catch (e) {
        console.error("Firebase listenToRoom error, falling back to mock:", e);
        unsubscribe = mockDb.listenToRoom(roomId, callback);
      }
    })();

    // Return wrap to unsubscribe
    return () => unsubscribe();
  },

  listenToMessages: (roomId, callback) => {
    if (!useFirebase) {
      return mockDb.listenToMessages(roomId, callback);
    }

    let unsubscribe = () => {};

    (async () => {
      try {
        const { collection, onSnapshot, query, orderBy } = await import('firebase/firestore');
        const messagesRef = collection(db, 'rooms', roomId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        
        unsubscribe = onSnapshot(q, (querySnap) => {
          const messages = [];
          querySnap.forEach((docSnap) => {
            const data = docSnap.data();
            // Convert Firebase Timestamp to ISO string for compatibility
            let timestampStr = new Date().toISOString();
            if (data.timestamp) {
              timestampStr = data.timestamp.toDate ? data.timestamp.toDate().toISOString() : data.timestamp;
            }
            messages.push({
              id: docSnap.id,
              ...data,
              timestamp: timestampStr
            });
          });
          callback(messages);
        }, (err) => {
          console.error("Firebase listenToMessages snapshot error:", err);
        });
      } catch (e) {
        console.error("Firebase listenToMessages error, falling back to mock:", e);
        unsubscribe = mockDb.listenToMessages(roomId, callback);
      }
    })();

    return () => unsubscribe();
  },

  sendMessage: async (roomId, sender, text, imageBase64 = '') => {
    await ensureInitialized();
    if (!useFirebase) {
      return mockDb.sendMessage(roomId, sender, text, imageBase64);
    }

    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      
      const messagesRef = collection(db, 'rooms', roomId, 'messages');
      await addDoc(messagesRef, {
        sender,
        text,
        image: imageBase64,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error("Firebase sendMessage error, falling back to mock:", e);
      return mockDb.sendMessage(roomId, sender, text, imageBase64);
    }
  },

  leaveRoom: async (roomId, username) => {
    await ensureInitialized();
    if (!useFirebase) {
      return mockDb.leaveRoom(roomId, username);
    }

    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        status: 'disbanded'
      });
    } catch (e) {
      console.error("Firebase leaveRoom error, falling back to mock:", e);
      return mockDb.leaveRoom(roomId, username);
    }
  },

  reinitialize: async () => {
    await initFirebase();
    return useFirebase;
  },

  getDisbandedRooms: async () => {
    await ensureInitialized();
    if (!useFirebase) {
      return mockDb.getDisbandedRooms();
    }
    try {
      const { collection, getDocs, query, where } = await import('firebase/firestore');
      const q = query(collection(db, 'rooms'), where('status', '==', 'disbanded'));
      const querySnap = await getDocs(q);
      const rooms = [];
      querySnap.forEach((docSnap) => {
        rooms.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      
      // Sort in memory to avoid index requirements
      rooms.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return timeB - timeA;
      });
      
      return rooms;
    } catch (e) {
      console.error("Firebase getDisbandedRooms error, falling back to mock:", e);
      return mockDb.getDisbandedRooms();
    }
  },

  getRoomMessages: async (roomId) => {
    await ensureInitialized();
    if (!useFirebase) {
      return mockDb.getRoomMessages(roomId);
    }
    try {
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      const messagesRef = collection(db, 'rooms', roomId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      const querySnap = await getDocs(q);
      const messages = [];
      querySnap.forEach((docSnap) => {
        const data = docSnap.data();
        let timestampStr = new Date().toISOString();
        if (data.timestamp) {
          timestampStr = data.timestamp.toDate ? data.timestamp.toDate().toISOString() : data.timestamp;
        }
        messages.push({
          id: docSnap.id,
          ...data,
          timestamp: timestampStr
        });
      });
      return messages;
    } catch (e) {
      console.error("Firebase getRoomMessages error, falling back to mock:", e);
      return mockDb.getRoomMessages(roomId);
    }
  }
};
