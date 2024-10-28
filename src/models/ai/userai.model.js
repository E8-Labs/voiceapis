const UserAi = (sequelize, Sequelize) => {
  const User = sequelize.define("UserAi", {
    name: {
      type: Sequelize.TEXT,
      defaultValue: "",
    },
    action: {
      type: Sequelize.TEXT("medium"),
    },
    tagline: {
      type: Sequelize.TEXT("medium"),
    },

    audio: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    greeting: {
      type: Sequelize.STRING(200),
    },
    possibleUserQuery: {
      type: Sequelize.TEXT, //"caller", "creator"
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
      type: Sequelize.TEXT,
      defaultValue: "",
    },
    instaUrl: {
      type: Sequelize.TEXT,
      defaultValue: "",
    },
    twitterUrl: {
      type: Sequelize.TEXT,
      defaultValue: "",
    },
    discordUrl: {
      type: Sequelize.TEXT,
      defaultValue: "",
    },
    youtubeUrl: {
      type: Sequelize.TEXT,
      defaultValue: "",
    },
    webUrl: {
      type: Sequelize.TEXT,
      defaultValue: "",
    },
    webUrlScrapedData: {
      type: Sequelize.TEXT("medium"),
      // defaultValue: "",
    },
    goalType: {
      // product, webinar, other
      type: Sequelize.TEXT,
      defaultValue: "",
    },
    productToSell: {
      // if product provided
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    webinarUrl: {
      type: Sequelize.TEXT,
      defaultValue: "",
    },
    goalTitle: {
      type: Sequelize.TEXT,
      defaultValue: "",
    },
    goalUrl: {
      type: Sequelize.TEXT,
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
