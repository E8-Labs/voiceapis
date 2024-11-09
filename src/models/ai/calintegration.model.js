//This is for ai profiles generated by AI
const CalIntegration = (sequelize, Sequelize) => {
  const CalIntegration = sequelize.define("CalIntegration", {
    type: {
      type: Sequelize.STRING,
      defaultValue: "cal_dot_com", // "cal_dot_com", "ghl"
    },
    eventId: {
      //Event id is the meeting event on cal.com
      type: Sequelize.STRING,
      allowNull: true,
    },
    apiKey: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    actionId: {
      type: Sequelize.STRING, // id of the action on the synthflow
      allowNull: true,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Users", //
        key: "id",
      },
    },
  });

  return CalIntegration;
};

export default CalIntegration;

export const CalIntegrationTypes = {
  CalDotCom: "cal_dot_com",
  Ghl: "ghl",
};
