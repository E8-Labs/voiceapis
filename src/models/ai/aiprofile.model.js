//This is for ai profiles generated by AI
const AIProfile = (sequelize, Sequelize) => {
  const User = sequelize.define("AIProfile", {
    profileData: {
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
  });

  return User;
};

export default AIProfile;
