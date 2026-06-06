import { authAPI } from "../api/api.js";
import { setUser, clearUser } from "../features/userSlice.js";

// Register a new user
export const registerUser = async (formData, dispatch) => {
  const { data } = await authAPI.register(formData);
  console.log("Data", data);
  dispatch(setUser(data));
  return data;
};

// Login a user
export const loginUser = async (credentials, dispatch) => {
  const { data } = await authAPI.login(credentials);
  dispatch(setUser(data?.loggedInUser));
  return data;
};

// Logout the user
export const logoutUser = async (dispatch) => {console.log("swork");

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