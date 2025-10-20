// server/socketHandlers/webrtcHandler.js

const userSocketMap = new Map();

const handleWebRTCEvents = (io, socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // ✅ Join room
  socket.on('join-room', (roomId, userInfo) => {
    console.log(`👤 ${userInfo.userName} joined ${roomId}`);
    socket.join(roomId);
    socket.currentRoomId = roomId;
    socket.currentUserId = userInfo.userId;
    socket.currentUserName = userInfo.userName;

    userSocketMap.set(userInfo.userId, socket.id);

    // List other users in room
    const socketsInRoom = io.sockets.adapter.rooms.get(roomId);
    const existingUsers = [];
    if (socketsInRoom) {
      socketsInRoom.forEach((socketId) => {
        if (socketId !== socket.id) {
          const s = io.sockets.sockets.get(socketId);
          if (s && s.currentUserId) {
            existingUsers.push({
              userId: s.currentUserId,
              userName: s.currentUserName,
              socketId,
            });
          }
        }
      });
    }

    socket.emit('existing-users', existingUsers);
    socket.to(roomId).emit('user-connected', {
      userId: userInfo.userId,
      userName: userInfo.userName,
      socketId: socket.id,
    });
  });

  // ✅ WebRTC offer/answer
  socket.on('offer', (data) => {
    const targetSocketId = userSocketMap.get(data.target);
    if (targetSocketId) {
      io.to(targetSocketId).emit('offer', {
        offer: data.offer,
        caller: data.caller,
      });
    }
  });

  socket.on('answer', (data) => {
    const targetSocketId = userSocketMap.get(data.target);
    if (targetSocketId) {
      io.to(targetSocketId).emit('answer', {
        answer: data.answer,
        answerer: data.answerer,
      });
    }
  });

  // ✅ ICE candidates
  socket.on('ice-candidate', (data) => {
    const targetSocketId = userSocketMap.get(data.target);
    if (targetSocketId) {
      io.to(targetSocketId).emit('ice-candidate', {
        candidate: data.candidate,
        from: data.from,
      });
    }
  });

  // ✅ Screen sharing alignment
  socket.on('screen-share-started', (roomId) => {
    socket.to(roomId).emit('screen-share-started', socket.currentUserId);
  });
  socket.on('screen-share-stopped', (roomId) => {
    socket.to(roomId).emit('screen-share-stopped', socket.currentUserId);
  });

  // ✅ Chat fix — broadcast sender + timestamp
  socket.on('chat-message', (data) => {
    const { roomId, message } = data;
    socket.to(roomId).emit('chat-message', {
      id: message.id,
      sender: message.userName,
      message: message.text,
      timestamp: message.timestamp,
    });
  });

  // ✅ Meeting end broadcast
  socket.on('meeting-ended', (data) => {
    console.log(`📢 Meeting ${data.roomId} ended by ${socket.currentUserName}`);
    io.to(data.roomId).emit('meeting-ended');
  });

  // ✅ Disconnect cleanup
  socket.on('disconnect', () => {
    if (socket.currentUserId) userSocketMap.delete(socket.currentUserId);
    if (socket.currentRoomId && socket.currentUserId) {
      socket.to(socket.currentRoomId).emit('user-disconnected', socket.currentUserId);
    }
    console.log(`❌ ${socket.currentUserName || socket.id} disconnected`);
  });
};

module.exports = { handleWebRTCEvents };
