const ChatModel = (sequelize, Sequelize) => {
  const Model = sequelize.define("ChatModel", {
    chat_id: {
      type: Sequelize.STRING(255),
      default: "",
    },
    from: {
      type: Sequelize.STRING(255),
      default: "user",
    },
    message: {
      type: Sequelize.STRING(255),
      defaultValue: "",
      allowNull: true,
    },
  });
  return ChatModel;
};

export default ChatModel;
