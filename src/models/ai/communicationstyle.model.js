//This is for ai profiles generated by AI
const CommunicationStyle = (sequelize, Sequelize) => {
  const Values = sequelize.define("CommunicationStyle", {
    title: {
      type: Sequelize.STRING,
      defaultValue: "",
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

export default CommunicationStyle;
