const UserAi = (sequelize, Sequelize) => {
    const User = sequelize.define("UserAi", {
      name: {
        type: Sequelize.STRING,
        defaultValue: ''
      },
      action: {
        type: Sequelize.STRING,
        defaultValue: ''
      },
      tagline: {
        type: Sequelize.STRING,
        defaultValue: ''
      },
      
      audio: {
        type: Sequelize.STRING,
        allowNull: true
      },
      greeting: {
        type: Sequelize.STRING
      },
      possibleUserQuery: {
        type: Sequelize.STRING, //"caller", "creator"
        defaultValue: ''
      },
      
      price: { // we store smaller image for fast loading here
        type: Sequelize.DOUBLE,
        defaultValue: 0
      },
      isFree: { // we store full size image here
        type: Sequelize.BOOLEAN,
        defaultValue: false
        
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
  
    return User;
  };

  export default UserAi;