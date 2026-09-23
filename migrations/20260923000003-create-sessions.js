'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Sessions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      sport_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Sports',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      creator_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      venue: {
        type: Sequelize.STRING,
        allowNull: false
      },
      max_players: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Sessions');
  }
};
