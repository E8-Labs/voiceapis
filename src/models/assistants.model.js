const Assistant = (sequelize, Sequelize) => {
    const Assistant = sequelize.define("Assistant", {
      name: {
        type: Sequelize.STRING, //tate, tristan
        unique: true,
      },
      phone: {
        type: Sequelize.STRING,
        defaultValue: ''
      },
      
      modelId: {
        type: Sequelize.STRING 
      },
      apikey: {
        type: Sequelize.STRING
      },
      
      prompt: {
        type: Sequelize.TEXT
      },
    });
  
    return Assistant;
  };

  export default Assistant;