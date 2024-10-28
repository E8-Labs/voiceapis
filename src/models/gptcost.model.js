// const { Sequelize } = require(".");
const GptCostModel = (sequelize, Sequelize) => {
  const GptCostModel = sequelize.define("GptCostModel", {
    type: {
      // cron job
      type: Sequelize.STRING(255),
    },
    cost: {
      type: Sequelize.DOUBLE,
    },
    input: {
      // cron job
      type: Sequelize.TEXT("medium"),
    },
    output: {
      // cron job
      type: Sequelize.TEXT("medium"),
    },
    itemId: {
      // cron job
      type: Sequelize.INTEGER,
    },
    userId: {
      // cron job
      type: Sequelize.INTEGER,
    },
  });

  return GptCostModel;
};

export default GptCostModel;
