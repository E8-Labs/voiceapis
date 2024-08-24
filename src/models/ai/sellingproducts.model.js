const SellingProducts = (sequelize, Sequelize) => {
    const User = sequelize.define("SellingProducts", {
      name: {
        type: Sequelize.STRING,
        defaultValue: ''
      },
      productUrl: {
        type: Sequelize.STRING,
        defaultValue: ''
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
        }
      },
    });
  
    return User;
  };

  export default SellingProducts;