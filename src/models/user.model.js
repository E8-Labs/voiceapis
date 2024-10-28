const User = (sequelize, Sequelize) => {
  const User = sequelize.define("User", {
    name: {
      type: Sequelize.TEXT,
      defaultValue: "",
    },
    username: {
      type: Sequelize.TEXT,
      defaultValue: "",
    },
    phone: {
      type: Sequelize.TEXT,
      defaultValue: "",
    },

    email: {
      type: Sequelize.STRING,
    },
    password: {
      type: Sequelize.STRING,
    },
    role: {
      type: Sequelize.TEXT, //"caller", "creator"
      defaultValue: "caller",
    },

    profile_image: {
      // we store smaller image for fast loading here
      type: Sequelize.TEXT,
      defaultValue: "",
    },
    full_profile_image: {
      // we store full size image here
      type: Sequelize.TEXT,
      defaultValue: "",
    },
    city: {
      // we store smaller image for fast loading here
      type: Sequelize.TEXT,
      defaultValue: "",
    },

    state: {
      // we store smaller image for fast loading here
      type: Sequelize.TEXT,
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
