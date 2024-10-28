//This is for ai profiles generated by AI
const MainPoints = (sequelize, Sequelize) => {
  const FrameworkAndTechnique = sequelize.define("MainPoints", {
    title: {
      type: Sequelize.STRING(255),
      defaultValue: "",
    },
    description: {
      type: Sequelize.STRING(255),
      defaultValue: "",
    },
    type: {
      type: Sequelize.STRING(255),
      defaultValue: "", // "main points", "key topics" etc MainPointsTypes
    },
    kbType: {
      type: Sequelize.STRING(255),
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
