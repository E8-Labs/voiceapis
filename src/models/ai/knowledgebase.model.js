const KnowledgeBase = (sequelize, Sequelize) => {
    const User = sequelize.define("KnowledgeBase", {
      type: {
        type: Sequelize.STRING, //document, text, url
        defaultValue: ''
      },
      content: {
        type: Sequelize.TEXT,
        defaultValue: ''
      },
      documentUrl: {
        type: Sequelize.STRING,
        defaultValue: 0
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

  export default KnowledgeBase;