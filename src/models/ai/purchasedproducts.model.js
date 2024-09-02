const PurchasedProduct = (sequelize, Sequelize) => {
    const User = sequelize.define("PurchasedProduct", {
      productId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: "SellingProducts",
            key: 'id'
        }
      },
      
      productPrice: {
        type: Sequelize.DOUBLE,
        defaultValue: 0
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users', // Table name (plural form)
          key: 'id'
        },
        
      },
      stripePurchseId: {
        type: Sequelize.STRING,
        defaultValue: ''
      },
      stripeInvoiceId: {
        type: Sequelize.STRING,
        defaultValue: ''
      },
      
    });
  
    return User;
  };

  export default PurchasedProduct;