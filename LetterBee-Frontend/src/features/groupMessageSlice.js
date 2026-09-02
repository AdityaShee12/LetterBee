import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    groupMessage: null,
};

const groupMessageSlice = createSlice({
    name: "groupMessage",

    initialState,

    reducers: {
        setGroupMessage: (state, action) => {
            state.groupMessage = action.payload;
        },

        clearGroupMessage: (state) => {
            state.groupMessage = null;
        },
    },
});

export const {
    setGroupMessage,
    clearGroupMessage,
} = groupMessageSlice.actions;

export default groupMessageSlice.reducer;