//This is for ai profiles generated by AI
const PersonalityTrait = (sequelize, Sequelize) => {
  const PersonalityTrait = sequelize.define("PersonalityTrait", {
    trait: {
      type: Sequelize.STRING(255),
      defaultValue: "",
    },
    score: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    type: {
      type: Sequelize.STRING(255),
      defaultValue: "ai", // "ai", "manual"
    },
    kbType: {
      type: Sequelize.STRING(255),
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

  return PersonalityTrait;
};

export default PersonalityTrait;
