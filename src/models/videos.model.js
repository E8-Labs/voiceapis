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
          type: Sequelize.TEXT,
          allowNull: true,
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: true,
        references: {
          model: 'Users', //
          key: 'id'
        }
        },
      });
    
    //   YouTubeVideo.associate = function (models) {
    //     YouTubeVideo.belongsTo(models.User, { foreignKey: "userId" });
    //   };
    
      return YouTubeVideo;
  };

  export default YouTubeVideo;