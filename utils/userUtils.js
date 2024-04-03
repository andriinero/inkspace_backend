exports.updateUserList = async (usersList, listName, userId) => {
  for (const user of usersList) {
    user[listName] = user[listName].filter((u) => u.toString() !== userId);
    await user.save();
  }
};
