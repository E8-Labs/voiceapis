const SellingProducts = (sequelize, Sequelize) => {
  const User = sequelize.define("SellingProducts", {
    name: {
      type: Sequelize.STRING(1000),
      defaultValue: "",
    },
    productUrl: {
      type: Sequelize.STRING(1000),
      defaultValue: "",
    },
    productPrice: {
      type: Sequelize.DOUBLE,
      defaultValue: 0,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Users", // Table name (plural form)
        key: "id",
      },
    },
    stripeProductId: {
      type: Sequelize.STRING(1000),
      defaultValue: "",
    },
    stripePriceId: {
      type: Sequelize.STRING(1000),
      defaultValue: "",
    },
    stripePaymentLink: {
      type: Sequelize.STRING(1000),
      defaultValue: "",
    },
    isSelling: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
  });

  return User;
};

export default SellingProducts;
