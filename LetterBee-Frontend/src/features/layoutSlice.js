import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  statusAction: null,
  chatAction: null,
};

const layoutSlice = createSlice({
  name: "layout",
  initialState,
  reducers: {
    setStatusAction: (state, action) => {
      state.statusAction = action.payload.statusAction;
    },
    clearStatusAction: (state) => {
      state.statusAction = null;
    },
    setChatAction: (state, action) => {
      state.chatAction = action.payload.chatAction;
    },
    clearChatAction: (state) => {
      state.chatAction = null;
    },
  },
});

export const {
  setStatusAction,
  clearStatusAction,
  setChatAction,
  clearChatAction,
} = layoutSlice.actions;

export default layoutSlice.reducer;
