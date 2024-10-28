const SellingProducts = (sequelize, Sequelize) => {
  const User = sequelize.define("SellingProducts", {
    name: {
      type: Sequelize.TEXT,
      defaultValue: "",
    },
    productUrl: {
      type: Sequelize.TEXT,
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
      type: Sequelize.TEXT,
      defaultValue: "",
    },
    stripePriceId: {
      type: Sequelize.TEXT,
      defaultValue: "",
    },
    stripePaymentLink: {
      type: Sequelize.TEXT,
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
