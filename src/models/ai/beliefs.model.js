//This is for ai profiles generated by AI
const UserBeliefs = (sequelize, Sequelize) => {
  const Values = sequelize.define("UserBeliefs", {
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
      defaultValue: "ai", // "ai", "manual"
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

  return Values;
};

export default UserBeliefs;
