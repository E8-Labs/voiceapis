const GoogleAuthModel = (sequelize, Sequelize) => {
    const Assistant = sequelize.define("GoogleAuthModel", {
      name: {
        type: Sequelize.STRING, //
      },
      providerAccountId: {
        type: Sequelize.STRING,
        defaultValue: ''
      },
      
      idToken: {
        type: Sequelize.STRING(5000),
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
      expiresAt: {
        type: Sequelize.STRING ,
        defaultValue: ''
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
  
    return Assistant;
  };

  export default GoogleAuthModel;