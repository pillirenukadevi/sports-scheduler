'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SessionPlayer extends Model {
    static associate(models) {
      SessionPlayer.belongsTo(models.Session, {
        foreignKey: 'session_id'
      });
      SessionPlayer.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }

  SessionPlayer.init(
    {
      session_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Sessions',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      }
    },
    {
      sequelize,
      modelName: 'SessionPlayer',
      tableName: 'SessionPlayers',
      indexes: [
        {
          unique: true,
          fields: ['session_id', 'user_id'],
          name: 'session_user_unique'
        }
      ]
    }
  );

  return SessionPlayer;
};
