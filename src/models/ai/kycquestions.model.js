const KycQuestions = (sequelize, Sequelize) => {
  const User = sequelize.define("KycQuestions", {
    question: {
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
  });

  return User;
};

export default KycQuestions;
