// server/socketHandlers/webrtcHandler.js

const userSocketMap = new Map();

const handleWebRTCEvents = (io, socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on("join-room", (roomId, userInfo) => {
    console.log(`👤 ${userInfo.userName} joined ${roomId}`);
    socket.join(roomId);
    socket.currentRoomId = roomId;
    socket.currentUserId = userInfo.userId;
    socket.currentUserName = userInfo.userName;
    userSocketMap.set(userInfo.userId, socket.id);

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
    socket.emit("existing-users", existingUsers);
    socket.to(roomId).emit("user-connected", {
      userId: userInfo.userId,
      userName: userInfo.userName,
      socketId: socket.id,
    });
  });

  // Chat relay
  socket.on("chat-message", (data) => {
    const { roomId, message } = data;
    io.to(roomId).emit("chat-message", {
      id: message.id,
      sender: message.userName,
      message: message.text,
      timestamp: message.timestamp,
    });
  });

  // WebRTC signal relay
  socket.on("offer", (data) => {
    const targetSocket = userSocketMap.get(data.target);
    if (targetSocket)
      io.to(targetSocket).emit("offer", { offer: data.offer, caller: data.caller });
  });

  socket.on("answer", (data) => {
    const targetSocket = userSocketMap.get(data.target);
    if (targetSocket)
      io.to(targetSocket).emit("answer", {
        answer: data.answer,
        answerer: data.answerer,
      });
  });

  socket.on("ice-candidate", (data) => {
    const targetSocket = userSocketMap.get(data.target);
    if (targetSocket)
      io.to(targetSocket).emit("ice-candidate", {
        candidate: data.candidate,
        from: data.from,
      });
  });

  // ✅ Host-only meeting end
  socket.on("meeting-ended", (data) => {
    if (data.isHost) {
      console.log(`📢 Meeting ${data.roomId} ended by host ${socket.currentUserName}`);
      io.to(data.roomId).emit("meeting-ended");
    } else {
      console.log(`⚠️ Unauthorized meeting end attempt by ${socket.currentUserName}`);
      socket.emit("not-authorized", { message: "Only host can end the meeting." });
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ Disconnected: ${socket.id}`);
    if (socket.currentUserId) userSocketMap.delete(socket.currentUserId);
    if (socket.currentRoomId && socket.currentUserId) {
      socket.to(socket.currentRoomId).emit("user-disconnected", socket.currentUserId);
    }
  });
};

module.exports = { handleWebRTCEvents };
