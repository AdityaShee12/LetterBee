import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: "", selectUser: ""
}

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setSelectUser: (state, action) => {
      state.selectUser = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
    },
  },
});

export const {
  setUser, setSelectUser, clearUser
} = userSlice.actions;
export default userSlice.reducer;
