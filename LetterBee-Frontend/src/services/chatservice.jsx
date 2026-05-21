export const fetchRecentChatsService = () => {
    setRecentUsers((prevUsers) => {
        let updatedUsers = [...prevUsers];
        users.forEach((newUser) => {
            const index = updatedUsers.findIndex(
                (user) => user._id === newUser._id,
            );
            if (index !== -1) {
                const [matchedUser] = updatedUsers.splice(index, 1);
                updatedUsers.unshift(matchedUser);
            } else {
                updatedUsers.unshift(newUser);
            }
        });
        return updatedUsers;
    });
    console.log("Recentusers", recentUsers);
};