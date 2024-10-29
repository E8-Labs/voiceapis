const PurchasedProduct = (sequelize, Sequelize) => {
  const User = sequelize.define("PurchasedProduct", {
    productId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "SellingProducts",
        key: "id",
      },
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
    paymentIntentId: {
      type: Sequelize.STRING,
      defaultValue: "",
    },
    livemode: {
      type: Sequelize.BOOLEAN,
      default: false,
    },
    status: {
      type: Sequelize.STRING,
      default: "succeeded",
    },
    data: {
      type: Sequelize.TEXT("medium"),
      allowNull: true,
      // defaultValue: "",
    },
  });

  return User;
};

export default PurchasedProduct;
