const SocialAuthModel = (sequelize, Sequelize) => {
    const Assistant = sequelize.define("SocialAuthModel", {
      name: {
        type: Sequelize.STRING, //tate, tristan, this should come fro user's username table
        // unique: true,
      },
      socialUserId: {
        type: Sequelize.STRING,
        defaultValue: ''
      },
      
      accessToken: {
        type: Sequelize.STRING ,
        defaultValue: ''
      },
      
      refreshToken: {
        type: Sequelize.STRING ,
        defaultValue: ''
      },

      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users', // Table name (plural form)
          key: 'id'
        }
      },
    });
  
    return Assistant;
  };

  export default SocialAuthModel;