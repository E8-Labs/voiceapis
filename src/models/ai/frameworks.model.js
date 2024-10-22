//This is for ai profiles generated by AI
const FrameworkAndTechnique = (sequelize, Sequelize) => {
  const FrameworkAndTechnique = sequelize.define("FrameworkAndTechnique", {
    title: {
      type: Sequelize.STRING,
      defaultValue: "",
    },
    description: {
      type: Sequelize.STRING,
      defaultValue: "",
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

  return FrameworkAndTechnique;
};

export default FrameworkAndTechnique;
