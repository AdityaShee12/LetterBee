import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  groupId: "",
  groupName: "",
  groupAvatar: "",
  groupAbout: "",
  groupMembers: [],
};

const groupMessageSlice = createSlice({
  name: "groupMessage",
  initialState,

  reducers: {
    setGroup: (state, action) => {
      const {
        groupId,
        groupName,
        groupAvatar,
        groupAbout,
        groupMembers,
      } = action.payload;

      state.groupId = groupId || "";
      state.groupName = groupName || "";
      state.groupAvatar = groupAvatar || "";
      state.groupAbout = groupAbout || "";
      state.groupMembers = groupMembers || [];
    },

    clearGroup: () => initialState,
  },
});

export const { setGroup, clearGroup } = groupMessageSlice.actions;

export default groupMessageSlice.reducer;