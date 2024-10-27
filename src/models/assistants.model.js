const Assistant = (sequelize, Sequelize) => {
  const Assistant = sequelize.define("Assistant", {
    name: {
      type: Sequelize.STRING(1000), //tate, tristan, this should come fro user's username table
      // unique: true,
    },
    phone: {
      type: Sequelize.STRING(1000),
      defaultValue: "",
    },

    modelId: {
      type: Sequelize.STRING(1000),
    },
    apikey: {
      type: Sequelize.STRING(1000),
    },

    prompt: {
      type: Sequelize.TEXT,
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
      type: Sequelize.STRING(1000),
      allowNull: true,
    },
  });

  return Assistant;
};

export default Assistant;
