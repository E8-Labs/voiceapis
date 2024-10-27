//This is for ai profiles generated by AI
const UserDemeanor = (sequelize, Sequelize) => {
  const Values = sequelize.define("UserDemeanor", {
    title: {
      type: Sequelize.STRING(1000),
      defaultValue: "", //optional
    },
    description: {
      type: Sequelize.STRING(1000),
      defaultValue: "",
    },
    type: {
      type: Sequelize.STRING(1000),
      defaultValue: "ai", // "ai", "manual"
    },
    kbType: {
      type: Sequelize.STRING(1000),
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

export default UserDemeanor;
