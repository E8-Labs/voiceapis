const Assistant = (sequelize, Sequelize) => {
  const Assistant = sequelize.define("Assistant", {
    name: {
      type: Sequelize.TEXT, //tate, tristan, this should come fro user's username table
      // unique: true,
    },
    phone: {
      type: Sequelize.TEXT,
      defaultValue: "",
    },

    modelId: {
      type: Sequelize.TEXT,
    },
    apikey: {
      type: Sequelize.TEXT,
    },

    prompt: {
      type: Sequelize.TEXT("medium"),
    },
    webook: {
      type: Sequelize.TEXT,
      defaultValue: "",
    },
    allowTrial: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    claimed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Users", // Table name (plural form)
        key: "id",
      },
    },
    synthAssistantId: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
  });

  return Assistant;
};

export default Assistant;
