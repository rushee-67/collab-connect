// server/socketHandlers/webrtcHandler.js

const handleWebRTCEvents = (io, socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  // When a user joins a meeting room
  socket.on('join-room', (roomId, userInfo) => {
    console.log(`User ${userInfo.userId} joining room ${roomId}`);
    
    // Join the socket to the room
    socket.join(roomId);
    
    // Store user info in socket
    socket.currentRoomId = roomId;
    socket.currentUserId = userInfo.userId;
    socket.currentUserName = userInfo.userName;

    // Get all sockets in this room (existing users)
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
              socketId: socketId
            });
          }
        }
      });
    }

    // Send existing users to the new user
    socket.emit('existing-users', existingUsers);

    // Tell everyone else in the room that a new user joined
    socket.to(roomId).emit('user-connected', {
      userId: userInfo.userId,
      userName: userInfo.userName,
      socketId: socket.id
    });

    console.log(`User ${userInfo.userId} joined room ${roomId}. Existing users:`, existingUsers.length);
  });

  // Handle WebRTC signaling - offer
  socket.on('offer', (data) => {
    console.log(`Offer from ${data.caller} to ${data.target}`);
    socket.to(data.target).emit('offer', {
      offer: data.offer,
      caller: data.caller || socket.currentUserId
    });
  });

  // Handle WebRTC signaling - answer
  socket.on('answer', (data) => {
    console.log(`Answer from ${data.answerer} to ${data.target}`);
    socket.to(data.target).emit('answer', {
      answer: data.answer,
      answerer: data.answerer || socket.currentUserId
    });
  });

  // Handle ICE candidates
  socket.on('ice-candidate', (data) => {
    console.log(`ICE candidate from ${data.from} to ${data.target}`);
    socket.to(data.target).emit('ice-candidate', {
      candidate: data.candidate,
      from: data.from || socket.currentUserId
    });
  });

  // Handle screen sharing
  socket.on('screen-share-start', (roomId) => {
    socket.to(roomId).emit('screen-share-started', socket.currentUserId);
  });

  socket.on('screen-share-stop', (roomId) => {
    socket.to(roomId).emit('screen-share-stopped', socket.currentUserId);
  });

  // Handle chat messages
  socket.on('chat-message', (data) => {
    io.to(data.roomId).emit('chat-message', {
      message: data.message,
      sender: data.sender,
      timestamp: new Date().toISOString()
    });
  });

  // Handle emoji reactions
  socket.on('emoji-reaction', (data) => {
    socket.to(data.roomId).emit('emoji-reaction', {
      emoji: data.emoji,
      sender: data.sender,
      timestamp: new Date().toISOString()
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
    if (socket.currentRoomId && socket.currentUserId) {
      socket.to(socket.currentRoomId).emit('user-disconnected', socket.currentUserId);
    }
  });
};

module.exports = { handleWebRTCEvents };
