import axios from "axios";
import { authAPI } from "../api/api";
import { debounce } from "lodash";
import { setUser } from "../features/userSlice";

export const changeProfilePic = async (formData, dispatch) => {
  const { data } = await authAPI.profilePicChange(formData);
  dispatch(setUser(data));
  return data;
};

export const changeProfileAbout = async (aboutData, dispatch) => {
  const { data } = await authAPI.profileAboutChange(aboutData);
  dispatch(setUser(data));
  return data;
};

// It is fetch users those are matchs with search query
export const fetchUsersService = debounce(async (searchText) => {
  if (!searchText.trim()) {
    setUsers([]);
    return;
  }
  try {
    const response = await axios.get(
      `${BACKEND_API}/api/v1/users/searchUser?query=${searchText}&userId=${userId}`, {
      withCredentials: true
    }
    );
    console.log("Res", response);
    const usersWithUUID = response.data.map((user) => ({
      ...user,
    }));
    console.log("Data", usersWithUUID);
    setUsers(usersWithUUID);
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}, 300);

// Search for a user by username
export const searchUserByUsername = async (username) => {
  try {
    const response = await axios.get(`/search-user?username=${username}`);
    return response.data;
  } catch (error) {
    throw new Error("User not found");
  }
};