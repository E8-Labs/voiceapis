// const { Sequelize } = require(".");
const EmailVerificationCode = (sequelize, Sequelize) => {
  const PasswordResetCode = sequelize.define("EmailVerificationCode", {
    email: {
      type: Sequelize.STRING(255),
    },
    code: {
      type: Sequelize.STRING,
    },
  });

  return PasswordResetCode;
};

export default EmailVerificationCode;
