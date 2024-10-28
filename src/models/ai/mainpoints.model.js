//This is for ai profiles generated by AI
const MainPoints = (sequelize, Sequelize) => {
  const FrameworkAndTechnique = sequelize.define("MainPoints", {
    title: {
      type: Sequelize.STRING,
      defaultValue: "",
    },
    description: {
      type: Sequelize.TEXT("medium"),
      defaultValue: "",
    },
    type: {
      type: Sequelize.STRING,
      defaultValue: "", // "main points", "key topics" etc MainPointsTypes
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

  return FrameworkAndTechnique;
};

export default MainPoints;
