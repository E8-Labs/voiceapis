const UserCallSummary = (sequelize, Sequelize) => {
  const User = sequelize.define("UserCallSummary", {
    name: {
      type: Sequelize.STRING,
      defaultValue: "",
    },
    summary: {
      type: Sequelize.TEXT("medium"),
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
    modelId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Users", // Table name (plural form)
        key: "id",
      },
    },
  });

  return User;
};

export default UserCallSummary;
