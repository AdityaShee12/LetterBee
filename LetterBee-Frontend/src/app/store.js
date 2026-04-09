import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../features/userSlice.js";
import layoutReducer from "../features/layoutSlice.js";
import groupReducer from "../features/groupMessageSlice.js";

export const store = configureStore({
  reducer: {
    user: userReducer,
    layout: layoutReducer,
    groupMessage: groupReducer,
  },
});
