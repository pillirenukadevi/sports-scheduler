const { sequelize, User, Sport, Session, SessionPlayer } = require('../models');

async function cleanDatabase() {
  await SessionPlayer.destroy({ where: {}, force: true });
  await Session.destroy({ where: {}, force: true });
  await Sport.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });
}

module.exports = {
  cleanDatabase,
  closeDatabase: async () => {
    await sequelize.close();
  }
};
