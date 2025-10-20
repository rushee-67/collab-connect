// server/socketHandlers/webrtcHandler.js

// Maintain userId → socketId mapping
const userSocketMap = new Map();

const handleWebRTCEvents = (io, socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  // When a user joins a meeting room
  socket.on('join-room', (roomId, userInfo) => {
    console.log(`User ${userInfo.userId} joining room ${roomId}`);

    socket.join(roomId);
    socket.currentRoomId = roomId;
    socket.currentUserId = userInfo.userId;
    socket.currentUserName = userInfo.userName;

    // Map userId → socketId
    userSocketMap.set(userInfo.userId, socket.id);

    // List of existing users in the room
    const socketsInRoom = io.sockets.adapter.rooms.get(roomId);
    const existingUsers = [];

    if (socketsInRoom) {
      socketsInRoom.forEach(socketId => {
        if (socketId !== socket.id) {
          const existingSocket = io.sockets.sockets.get(socketId);
          if (existingSocket && existingSocket.currentUserId) {
            existingUsers.push({
              userId: existingSocket.currentUserId,
              userName: existingSocket.currentUserName,
              socketId
            });
          }
        }
      });
    }

    // Send list of existing users to the new joiner
    socket.emit('existing-users', existingUsers);

    // Notify others of new user
    socket.to(roomId).emit('user-connected', {
      userId: userInfo.userId,
      userName: userInfo.userName,
      socketId: socket.id
    });

    console.log(`✅ ${userInfo.userName} joined room ${roomId}`);
  });

  // WebRTC signaling: Offer
  socket.on('offer', (data) => {
    const targetSocketId = userSocketMap.get(data.target);
    if (targetSocketId) {
      io.to(targetSocketId).emit('offer', {
        offer: data.offer,
        caller: data.caller
      });
    }
  });

  // WebRTC signaling: Answer
  socket.on('answer', (data) => {
    const targetSocketId = userSocketMap.get(data.target);
    if (targetSocketId) {
      io.to(targetSocketId).emit('answer', {
        answer: data.answer,
        answerer: data.answerer
      });
    }
  });

  // ICE Candidate exchange
  socket.on('ice-candidate', (data) => {
    const targetSocketId = userSocketMap.get(data.target);
    if (targetSocketId) {
      io.to(targetSocketId).emit('ice-candidate', {
        candidate: data.candidate,
        from: data.from
      });
    }
  });

  // ✅ Screen share event alignment
  socket.on('screen-share-started', (roomId) => {
    socket.to(roomId).emit('screen-share-started', socket.currentUserId);
  });

  socket.on('screen-share-stopped', (roomId) => {
    socket.to(roomId).emit('screen-share-stopped', socket.currentUserId);
  });

  // ✅ Chat message fix (single emit, correct structure)
  socket.on('chat-message', (data) => {
    // Only send to others in room (not sender)
    socket.to(data.roomId).emit('chat-message', data.message);
  });

  // Emoji reactions
  socket.on('emoji-reaction', (data) => {
    socket.to(data.roomId).emit('emoji-reaction', {
      emoji: data.emoji,
      sender: data.sender,
      timestamp: new Date().toISOString()
    });
  });

  // ✅ End meeting for everyone
  socket.on('meeting-ended', (data) => {
    io.to(data.roomId).emit('meeting-ended');
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
    if (socket.currentUserId) userSocketMap.delete(socket.currentUserId);
    if (socket.currentRoomId && socket.currentUserId) {
      socket.to(socket.currentRoomId).emit('user-disconnected', socket.currentUserId);
    }
  });
};

module.exports = { handleWebRTCEvents };
