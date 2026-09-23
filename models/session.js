'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Session extends Model {
    static associate(models) {
      Session.belongsTo(models.User, {
        foreignKey: 'creator_id',
        as: 'creator'
      });
      Session.belongsTo(models.Sport, {
        foreignKey: 'sport_id',
        as: 'sport'
      });
      Session.belongsToMany(models.User, {
        through: models.SessionPlayer,
        foreignKey: 'session_id',
        otherKey: 'user_id',
        as: 'players'
      });
      Session.hasMany(models.SessionPlayer, {
        foreignKey: 'session_id',
        as: 'sessionPlayers'
      });
    }

    // Helper to check if a user is the creator
    isCreator(userId) {
      return this.creator_id === userId;
    }

    // Helper to check if a session is in the past
    get isPast() {
      const sessionDateTime = new Date(`${this.date}T${this.time}`);
      return sessionDateTime < new Date();
    }

    // Helper to get registration closing datetime
    get closingDateTime() {
      if (this.registration_deadline) {
        return new Date(this.registration_deadline);
      }
      // Default: closes 1 hour before session match time
      const matchDateTime = new Date(`${this.date}T${this.time}`);
      return new Date(matchDateTime.getTime() - 60 * 60 * 1000);
    }

    // Helper to check if join window is closed
    get isRegistrationClosed() {
      return new Date() > this.closingDateTime;
    }
  }

  Session.init(
    {
      registration_deadline: {
        type: DataTypes.DATE,
        allowNull: true
      },
      sport_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: 'Please select a sport' },
          notEmpty: { msg: 'Please select a sport' }
        }
      },
      creator_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: 'Creator is required' }
        }
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          notNull: { msg: 'Session date is required' },
          notEmpty: { msg: 'Session date cannot be empty' },
          isDate: { msg: 'Please provide a valid date' }
        }
      },
      time: {
        type: DataTypes.TIME,
        allowNull: false,
        validate: {
          notNull: { msg: 'Session time is required' },
          notEmpty: { msg: 'Session time cannot be empty' }
        }
      },
      venue: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: 'Venue/location is required' },
          notEmpty: { msg: 'Venue/location cannot be empty' }
        },
        set(value) {
          this.setDataValue('venue', value ? value.trim() : value);
        }
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
        set(value) {
          this.setDataValue('address', value ? value.trim() : value);
        }
      },
      max_players: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
        validate: {
          notNull: { msg: 'Max players is required' },
          min: {
            args: [2],
            msg: 'Max players must be at least 2'
          }
        }
      }
    },
    {
      sequelize,
      modelName: 'Session',
      tableName: 'Sessions'
    }
  );

  return Session;
};
