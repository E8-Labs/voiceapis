const UserAi = (sequelize, Sequelize) => {
  const User = sequelize.define("UserAi", {
    name: {
      type: Sequelize.STRING(255),
      defaultValue: "",
    },
    action: {
      type: Sequelize.TEXT("medium"),
    },
    tagline: {
      type: Sequelize.TEXT("medium"),
    },

    audio: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    greeting: {
      type: Sequelize.STRING(200),
    },
    possibleUserQuery: {
      type: Sequelize.STRING(255), //"caller", "creator"
      defaultValue: "",
    },

    price: {
      // we store smaller image for fast loading here
      type: Sequelize.DOUBLE,
      defaultValue: 0,
    },
    isFree: {
      // we store full size image here
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Users", // Table name (plural form)
        key: "id",
      },
    },
    fbUrl: {
      type: Sequelize.STRING(255),
      defaultValue: "",
    },
    instaUrl: {
      type: Sequelize.STRING(255),
      defaultValue: "",
    },
    twitterUrl: {
      type: Sequelize.STRING(255),
      defaultValue: "",
    },
    discordUrl: {
      type: Sequelize.STRING(255),
      defaultValue: "",
    },
    youtubeUrl: {
      type: Sequelize.STRING(255),
      defaultValue: "",
    },
    webUrl: {
      type: Sequelize.STRING(255),
      defaultValue: "",
    },
    webUrlScrapedData: {
      type: Sequelize.TEXT("medium"),
      // defaultValue: "",
    },
    goalType: {
      // product, webinar, other
      type: Sequelize.STRING(255),
      defaultValue: "",
    },
    productToSell: {
      // if product provided
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    webinarUrl: {
      type: Sequelize.STRING(255),
      defaultValue: "",
    },
    goalTitle: {
      type: Sequelize.STRING(255),
      defaultValue: "",
    },
    goalUrl: {
      type: Sequelize.STRING(255),
      defaultValue: "",
    },
    profession: {
      //from dashboard
      type: Sequelize.STRING(500),
    },
    aiObjective: {
      //from dashboard
      type: Sequelize.TEXT("medium"),
    },
  });

  return User;
};

export default UserAi;
