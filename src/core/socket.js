import { Server } from "socket.io";

const createSocket = (server) => {
  const io = new Server(server);

  io.on("connection", (socket) => {
    socket.on("DIALOGS:JOIN", (dialogId) => {
      socket.dialogId = dialogId;
      socket.join(dialogId);
      console.log("JOINED", dialogId);
    });
    socket.on("DIALOGS:TYPING", ({ dialogId, typingUser }) => {
      io.to(dialogId).emit("DIALOGS:TYPING", { dialogId, typingUser });
    });
  });
  return io;
};

export default createSocket;
