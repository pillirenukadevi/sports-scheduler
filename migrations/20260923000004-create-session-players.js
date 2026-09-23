'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SessionPlayers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      session_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Sessions',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE'
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

    // Add unique constraint on [session_id, user_id]
    await queryInterface.addIndex('SessionPlayers', ['session_id', 'user_id'], {
      unique: true,
      name: 'session_user_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('SessionPlayers');
  }
};
