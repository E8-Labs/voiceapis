const KnowledgeBase = (sequelize, Sequelize) => {
  const User = sequelize.define("KnowledgeBase", {
    type: {
      type: Sequelize.STRING, //document, text, url
      defaultValue: "",
    },
    content: {
      type: Sequelize.TEXT("medium"),
      defaultValue: "",
      // allowNull: true,
    },
    processedData: {
      type: Sequelize.TEXT("medium"),
      allowNull: true,
      // defaultValue: "",
    },
    documentUrl: {
      type: Sequelize.STRING,
      defaultValue: "",
    },
    description: {
      type: Sequelize.STRING,
      defaultValue: "",
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Users", // Table name (plural form)
        key: "id",
      },
    },
    processed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
  });

  return User;
};

export default KnowledgeBase;
