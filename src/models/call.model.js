const CallModel = (sequelize, Sequelize) => {
  const Model = sequelize.define("CallModel", {
    phone: {
      type: Sequelize.TEXT,
      default: "",
      allowNull: false,
    },
    callId: {
      type: Sequelize.TEXT,
      default: "",
      allowNull: false,
    },
    model: {
      type: Sequelize.TEXT,
      default: "",
      allowNull: false,
    },
    modelId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Users", // Table name (plural form)
        key: "id",
      },
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Users", // Table name (plural form)
        key: "id",
      },
    },
    transcript: {
      type: Sequelize.TEXT,
      default: "",
      allowNull: false,
    },
    summary: {
      type: Sequelize.TEXT,
      default: "",
      allowNull: false,
    },
    duration: {
      type: Sequelize.TEXT,
      default: "",
      allowNull: false,
    },
    status: {
      type: Sequelize.TEXT,
      default: "",
      allowNull: false,
    },
    paymentStatus: {
      type: Sequelize.TEXT, // charged, failed
      default: "",
      allowNull: false,
    },
    chargeDescription: {
      type: Sequelize.TEXT, // charged, failed
      default: "",
      allowNull: false,
    },
    paymentId: {
      type: Sequelize.TEXT,
      defaultValue: "",
      allowNull: false,
    },
    paymentAmount: {
      type: Sequelize.DOUBLE,
      allowNull: true,
    },
    callData: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    promptTokens: {
      type: Sequelize.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    },
    completionTokens: {
      type: Sequelize.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    },
    totalCost: {
      type: Sequelize.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    },

    recordingUrl: {
      type: Sequelize.TEXT,
      defaultValue: "",
      allowNull: true,
    },
  });
  return Model;
};

export default CallModel;
