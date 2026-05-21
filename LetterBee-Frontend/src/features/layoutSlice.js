import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  status: {
    isOpen: false,
    data: null,
  },
  
  chat: {
    isOpen: false,
    activeChatId: null,
  },
};

const layoutSlice = createSlice({
  name: "layout",
  initialState,

  reducers: {
    setStatusState: (state, action) => {
      state.status = {
        ...state.status,
        ...action.payload,
      };
    },

    setChatState: (state, action) => {
      state.chat = {
        ...state.chat,
        ...action.payload,
      };
    },

    resetLayout: () => initialState,
  },
});

export const {
  setStatusState,
  setChatState,
  resetLayout,
} = layoutSlice.actions;

export default layoutSlice.reducer;