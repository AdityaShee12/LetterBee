import { io } from "socket.io-client";
import { BACKEND_API } from "../api/Backend_API.js";

const socket = io(BACKEND_API, {
  withCredentials: true,
});

export default socket;
