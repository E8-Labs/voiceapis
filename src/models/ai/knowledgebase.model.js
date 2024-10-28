const KnowledgeBase = (sequelize, Sequelize) => {
  const User = sequelize.define("KnowledgeBase", {
    type: {
      type: Sequelize.TEXT, //document, text, url
      defaultValue: "",
    },
    content: {
      type: Sequelize.TEXT("medium"),
      // defaultValue: "",
      allowNull: true,
    },
    name: {
      // name of the document
      type: Sequelize.TEXT,
      // defaultValue: "",
      allowNull: true,
    },
    subject: {
      // subject of the url
      type: Sequelize.TEXT,
      // defaultValue: "",
      allowNull: true,
    },
    processedData: {
      type: Sequelize.TEXT("medium"),
      allowNull: true,
      // defaultValue: "",
    },
    documentUrl: {
      type: Sequelize.TEXT,
      defaultValue: "",
    },
    description: {
      type: Sequelize.TEXT,
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
