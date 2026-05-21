import axios from "axios";

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