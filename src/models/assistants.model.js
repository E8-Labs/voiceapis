const Assistant = (sequelize, Sequelize) => {
  const Assistant = sequelize.define("Assistant", {
    name: {
      type: Sequelize.STRING, //tate, tristan, this should come fro user's username table
      // unique: true,
    },
    phone: {
      type: Sequelize.STRING,
      defaultValue: "",
    },

    modelId: {
      type: Sequelize.STRING,
    },
    apikey: {
      type: Sequelize.STRING,
    },

    prompt: {
      type: Sequelize.TEXT("medium"),
    },
    webook: {
      type: Sequelize.STRING,
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
      type: Sequelize.STRING,
      allowNull: true,
    },
  });

  return Assistant;
};

export default Assistant;
