import { authAPI } from "../api/api.js";
import { setUser, clearUser } from "../features/userSlice.js";

// Register a new user
export const registerUser = async (formData, dispatch) => {
  const { data } = await authAPI.register(formData);
  dispatch(setUser(data?.createdUser));
  return data;
};

// Login a user
export const loginUser = async (credentials, dispatch) => {
  const { data } = await authAPI.login(credentials);
  console.log("Data", data?.loggedInUser);
  dispatch(setUser(data?.loggedInUser));
  return data;
};

// Logout the user
export const logoutUser = async (dispatch) => {
  const { data } = await authAPI.logout();
  dispatch(clearUser());
  return data;
};

//  Reset the password
export const resetPassword = async (resetData, dispatch) => {
  const { data } = await authAPI.resetPassword(resetData);
  dispatch(setUser(data.data));
  return data;
};

// Refresh the access token
export const refreshAccessToken = async () => {
  const { data } = await authAPI.refreshAccessToken();
  return response.data;
};