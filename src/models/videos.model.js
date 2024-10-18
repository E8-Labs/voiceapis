const YouTubeVideo = (sequelize, Sequelize) => {
  const YouTubeVideo = sequelize.define("YouTubeVideo", {
    videoId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    thumbnailUrl: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    caption: {
      type: Sequelize.TEXT("medium"),
      allowNull: true,
    },
    labeledTranscript: {
      type: Sequelize.TEXT("medium"),
      allowNull: true,
    },
    summary: {
      type: Sequelize.TEXT("medium"),
      allowNull: true,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Users", //
        key: "id",
      },
    },
    addedToDb: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    tokensUsed: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    cost: {
      type: Sequelize.DOUBLE,
      defaultValue: 0,
    },
  });

  //   YouTubeVideo.associate = function (models) {
  //     YouTubeVideo.belongsTo(models.User, { foreignKey: "userId" });
  //   };

  return YouTubeVideo;
};

export default YouTubeVideo;
