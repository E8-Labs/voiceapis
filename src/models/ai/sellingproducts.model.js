const SellingProducts = (sequelize, Sequelize) => {
  const User = sequelize.define("SellingProducts", {
    name: {
      type: Sequelize.STRING(255),
      defaultValue: "",
    },
    productUrl: {
      type: Sequelize.STRING(255),
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
      type: Sequelize.STRING(255),
      defaultValue: "",
    },
    stripePriceId: {
      type: Sequelize.STRING(255),
      defaultValue: "",
    },
    stripePaymentLink: {
      type: Sequelize.STRING(255),
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
