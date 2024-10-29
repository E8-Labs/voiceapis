//This is for ai profiles generated by AI
const CommunicationInstructions = (sequelize, Sequelize) => {
  const Values = sequelize.define("CommunicationInstructions", {
    title: {
      type: Sequelize.STRING,
      defaultValue: "", //optional
    },
    pacing: {
      type: Sequelize.STRING,
      defaultValue: "", //optional
    },
    tone: {
      type: Sequelize.STRING,
      defaultValue: "", //optional
    },
    intonation: {
      type: Sequelize.STRING,
      defaultValue: "", //optional
    },
    scenario: {
      type: Sequelize.STRING,
      defaultValue: "", //optional
    },
    prompt: {
      type: Sequelize.STRING,
      defaultValue: "", //optional
    },
    response: {
      type: Sequelize.TEXT("medium"),
      allowNull: true,
    },
    description: {
      type: Sequelize.TEXT("medium"),
      allowNull: true,
    },
    type: {
      type: Sequelize.STRING,
      defaultValue: "ai", // "ai", "manual"
    },
    kbType: {
      type: Sequelize.STRING,
      defaultValue: "", //video, kb
    },
    kbId: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Users", // Table name (plural form)
        key: "id",
      },
    },
  });

  return Values;
};

export default CommunicationInstructions;
