const User = (sequelize, Sequelize) => {
  const User = sequelize.define("User", {
    name: {
      type: Sequelize.STRING(255),
      defaultValue: "",
    },
    username: {
      type: Sequelize.STRING(255),
      defaultValue: "",
    },
    phone: {
      type: Sequelize.STRING(255),
      defaultValue: "",
    },

    email: {
      type: Sequelize.STRING,
    },
    password: {
      type: Sequelize.STRING,
    },
    role: {
      type: Sequelize.STRING(255), //"caller", "creator"
      defaultValue: "caller",
    },

    profile_image: {
      // we store smaller image for fast loading here
      type: Sequelize.STRING(255),
      defaultValue: "",
    },
    full_profile_image: {
      // we store full size image here
      type: Sequelize.STRING(255),
      defaultValue: "",
    },
    city: {
      // we store smaller image for fast loading here
      type: Sequelize.STRING(255),
      defaultValue: "",
    },

    state: {
      // we store smaller image for fast loading here
      type: Sequelize.STRING(255),
      defaultValue: "",
    },
    phoneVerified: {
      // we store smaller image for fast loading here
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    seconds_available: {
      type: Sequelize.INTEGER,
      defaultValue: 300,
    },
    model_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });

  return User;
};

export default User;
