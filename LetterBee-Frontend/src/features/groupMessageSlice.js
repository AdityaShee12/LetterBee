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
    setGroupId: (state, action) => {
      state.groupId = action.payload.groupId;
    },
    setGroupName: (state, action) => {
      state.groupName = action.payload.groupName;
    },
    setGroupAvatar: (state, action) => {
      state.groupAvatar = action.payload.groupAvatar;
    },
    setGroupAbout: (state, action) => {
      state.groupAbout = action.payload.groupAbout;
    },
    setGroupMembers: (state, action) => {
      state.groupMembers = action.payload.groupMembers;
    },
  },
});

export const {
  setGroupId,
  setGroupAvatar,
  setGroupName,
  setGroupUsers,
  setGroupAbout,
  setGroupMembers,
} = groupMessageSlice.actions;
export default groupMessageSlice.reducer;
