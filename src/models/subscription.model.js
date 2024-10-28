let SubscriptionModel = (sequelize, Sequelize) => {
  const Model = sequelize.define("SubscriptionModel", {
    subid: {
      type: Sequelize.STRING(100),
    },
    data: {
      type: Sequelize.STRING(8000),
    },
    environment: {
      type: Sequelize.TEXT,
      defaultValue: "Sandbox",
      allowNull: false,
    },
    customerId: {
      type: Sequelize.TEXT,
      defaultValue: "",
      allowNull: false,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
  });
  // Chat.belongsTo(User);
  // Chat.belongsTo(Prompt)
  return Model;
};
export default SubscriptionModel;
