const GoogleAuthModel = (sequelize, Sequelize) => {
  const Assistant = sequelize.define("GoogleAuthModel", {
    name: {
      type: Sequelize.STRING, //
    },
    providerAccountId: {
      type: Sequelize.STRING,
      defaultValue: "",
    },

    idToken: {
      type: Sequelize.STRING(5000),
      defaultValue: "",
    },
    accessToken: {
      type: Sequelize.STRING,
      defaultValue: "",
    },

    refreshToken: {
      type: Sequelize.STRING,
      defaultValue: "",
    },
    expiresAt: {
      type: Sequelize.STRING,
      defaultValue: "",
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Users", //
        key: "id",
      },
    },
    username: {
      type: Sequelize.STRING,
      defaultValue: "",
    },
    description: {
      type: Sequelize.TEXT("medium"),
      allowNull: true,
    },
    location: {
      type: Sequelize.STRING,
      defaultValue: "",
    },
    subscriberCount: {
      type: Sequelize.STRING,
      defaultValue: "",
    },
    videoCount: {
      type: Sequelize.STRING,
      defaultValue: "",
    },
    viewCount: {
      type: Sequelize.STRING,
      defaultValue: "",
    },
    profilePicture: {
      type: Sequelize.STRING,
      defaultValue: "",
    },
    website: {
      type: Sequelize.STRING,
      defaultValue: "",
    },
    emailPublic: {
      type: Sequelize.STRING,
      defaultValue: "",
    },
  });

  return Assistant;
};

export default GoogleAuthModel;
