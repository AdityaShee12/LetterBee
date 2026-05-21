

// Store previous chat
export const fetchRecentChats = async () => {
    setTimeout(async () => {
      try {
        const response = await axios.get(
          `${BACKEND_API}/api/v1/users/userList?userId=${userId}`, {
          withCredentials: true
        }
        );
        console.log("Res", response);

        if (response.data) {
          const updatedData = response.data.map((data) => ({
            ...data,
            lastMessage: {
              ...data.lastMessage,
              text: decryptMessage(data.lastMessage.text),
            },
          }));
          setRecentUsers(updatedData);
          console.log("Data", updatedData);
        }
      } catch (error) {
        console.error("Error fetching recent chats:", error);
      }
    }, 100);
};