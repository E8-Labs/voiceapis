const KnowledgeBase = (sequelize, Sequelize) => {
  const User = sequelize.define("KnowledgeBase", {
    type: {
      type: Sequelize.STRING(1000), //document, text, url
      defaultValue: "",
    },
    content: {
      type: Sequelize.TEXT("medium"),
      // defaultValue: "",
      allowNull: true,
    },
    name: {
      // name of the document
      type: Sequelize.STRING(1000),
      // defaultValue: "",
      allowNull: true,
    },
    subject: {
      // subject of the url
      type: Sequelize.STRING(1000),
      // defaultValue: "",
      allowNull: true,
    },
    processedData: {
      type: Sequelize.TEXT("medium"),
      allowNull: true,
      // defaultValue: "",
    },
    documentUrl: {
      type: Sequelize.STRING(1000),
      defaultValue: "",
    },
    description: {
      type: Sequelize.STRING(1000),
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
    addedToDb: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
  });

  return User;
};

export default KnowledgeBase;
