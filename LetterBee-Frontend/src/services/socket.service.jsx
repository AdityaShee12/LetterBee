export const connectUserSocket = (
   socket,
   userId,
   userName
) => {
   if (socket.connected) {
      socket.emit(
         "new-user-joined",
         userId,
         userName
      );
   } else {
      socket.connect();
      socket.emit(
         "new-user-joined",
         userId,
         userName
      );
   }
};