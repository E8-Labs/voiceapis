const ChatModel = (sequelize, Sequelize) => {
  const Model = sequelize.define("ChatModel", {
    chat_id: {
      type: Sequelize.STRING,
      default: "",
    },
    from: {
      type: Sequelize.STRING,
      default: "user",
    },
    message: {
      type: Sequelize.STRING,
      defaultValue: "",
      allowNull: true,
    },
  });
  return ChatModel;
};

export default ChatModel;
