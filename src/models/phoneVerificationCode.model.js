// const { Sequelize } = require(".");
const PhoneVerificationCodeModel = (sequelize, Sequelize) => {
  const PasswordResetCode = sequelize.define("PhoneVerificationCodeModel", {
    phone: {
      type: Sequelize.STRING(255),
    },
    code: {
      type: Sequelize.STRING,
    },
  });

  return PasswordResetCode;
};

export default PhoneVerificationCodeModel;
