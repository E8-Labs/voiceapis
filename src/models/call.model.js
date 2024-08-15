const CallModel = (sequelize, Sequelize) => {
    const Model = sequelize.define("CallModel", {
        phone:{
            type: Sequelize.STRING,
            default: '',
            allowNull: false,
        },
        callId: {
            type: Sequelize.STRING,
            default: '',
            allowNull: false
        },
        model: {
            type: Sequelize.STRING,
            default: '',
            allowNull: false
        },
        transcript: {
            type: Sequelize.TEXT,
            default: '',
            allowNull: false
        },
        summary: {
            type: Sequelize.TEXT,
            default: '',
            allowNull: false
        },
        duration: {
            type: Sequelize.TEXT,
            default: '',
            allowNull: false
        },
        status: {
            type: Sequelize.TEXT,
            default: '',
            allowNull: false
        },
        paymentStatus: {
            type: Sequelize.STRING, // charged, failed
            default: '',
            allowNull: false
        },
        chargeDescription: {
            type: Sequelize.STRING, // charged, failed
            default: '',
            allowNull: false
        },
        paymentId: {
            type: Sequelize.STRING,
            defaultValue: '',
            allowNull: false
        }

    })
    return Model
}

export default CallModel