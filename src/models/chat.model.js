const ChatModel = (sequelize, Sequelize) => {
  const Model = sequelize.define("ChatModel", {
    chat_id: {
      type: Sequelize.TEXT,
      default: "",
    },
    from: {
      type: Sequelize.TEXT,
      default: "user",
    },
    message: {
      type: Sequelize.TEXT,
      defaultValue: "",
      allowNull: true,
    },
  });
  return ChatModel;
};

export default ChatModel;
