const UserAi = (sequelize, Sequelize) => {
  const User = sequelize.define("UserAi", {
    name: {
      type: Sequelize.STRING,
      defaultValue: "",
    },
    action: {
      type: Sequelize.TEXT("medium"),
    },
    tagline: {
      type: Sequelize.TEXT("medium"),
    },

    audio: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    greeting: {
      type: Sequelize.STRING(200),
    },
    possibleUserQuery: {
      type: Sequelize.STRING, //"caller", "creator"
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
      type: Sequelize.STRING,
      defaultValue: "",
    },
    instaUrl: {
      type: Sequelize.STRING,
      defaultValue: "",
    },
    twitterUrl: {
      type: Sequelize.STRING,
      defaultValue: "",
    },
    discordUrl: {
      type: Sequelize.STRING,
      defaultValue: "",
    },
    youtubeUrl: {
      type: Sequelize.STRING,
      defaultValue: "",
    },
    webUrl: {
      type: Sequelize.STRING,
      defaultValue: "",
    },
    webUrlScrapedData: {
      type: Sequelize.TEXT("medium"),
      // defaultValue: "",
    },
    goalType: {
      // product, webinar, other
      type: Sequelize.STRING,
      defaultValue: "",
    },
    productToSell: {
      // if product provided
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    webinarUrl: {
      type: Sequelize.STRING,
      defaultValue: "",
    },
    goalTitle: {
      type: Sequelize.STRING,
      defaultValue: "",
    },
    goalUrl: {
      type: Sequelize.STRING,
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
    callCalendarApiKey: {
      //from dashboard
      type: Sequelize.STRING,
    },
    ghlCalendarApiKey: {
      //from dashboard
      type: Sequelize.STRING,
    },
    //ObjectionHandling related
    reassurance: {
      //from dashboard
      type: Sequelize.DOUBLE,
      defaultValue: 2.5,
    },
    validateConcerns: {
      //from dashboard
      type: Sequelize.DOUBLE,
      defaultValue: 2.5,
    },
    compromiseAndAlternatives: {
      //from dashboard
      type: Sequelize.DOUBLE,
      defaultValue: 2.5,
    },
    positiveRedirects: {
      //from dashboard
      type: Sequelize.DOUBLE,
      defaultValue: 2.5,
    },
    provideDetailedExplanation: {
      //from dashboard
      type: Sequelize.DOUBLE,
      defaultValue: 2.5,
    },
  });

  return User;
};

export default UserAi;
