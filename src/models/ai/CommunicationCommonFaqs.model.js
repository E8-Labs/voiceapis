//This is for ai profiles generated by AI
const CommunicationCommonFaqs = (sequelize, Sequelize) => {
  const Values = sequelize.define("CommunicationCommonFaqs", {
    question: {
      type: Sequelize.STRING,
      defaultValue: "",
    },
    answer: {
      type: Sequelize.STRING,
      defaultValue: "",
    },
    type: {
      type: Sequelize.STRING,
      defaultValue: "ai", // "ai", "manual"
    },
    kbType: {
      type: Sequelize.STRING,
      defaultValue: "", //video, kb
    },
    kbId: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Users", // Table name (plural form)
        key: "id",
      },
    },
  });

  return Values;
};

export default CommunicationCommonFaqs;
