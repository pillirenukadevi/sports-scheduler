'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Session, {
        foreignKey: 'creator_id',
        as: 'createdSessions'
      });
      User.belongsToMany(models.Session, {
        through: models.SessionPlayer,
        foreignKey: 'user_id',
        otherKey: 'session_id',
        as: 'joinedSessions'
      });
      User.hasMany(models.SessionPlayer, {
        foreignKey: 'user_id',
        as: 'sessionPlayers'
      });
    }

    validPassword(password) {
      if (!password || !this.password) return false;
      return bcrypt.compareSync(password, this.password);
    }

    get fullName() {
      if (this.last_name) {
        return `${this.first_name} ${this.last_name}`;
      }
      return this.first_name;
    }
  }

  User.init(
    {
      first_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: 'First name is required' },
          notEmpty: { msg: 'First name cannot be empty' }
        },
        set(value) {
          this.setDataValue('first_name', value ? value.trim() : value);
        }
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: true,
        set(value) {
          this.setDataValue('last_name', value ? value.trim() : value);
        }
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: 'An account with this email already exists'
        },
        validate: {
          notNull: { msg: 'Email is required' },
          notEmpty: { msg: 'Email cannot be empty' },
          isEmail: { msg: 'Please provide a valid email address' }
        },
        set(value) {
          this.setDataValue('email', value ? value.trim().toLowerCase() : value);
        }
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: 'Password is required' },
          notEmpty: { msg: 'Password cannot be empty' },
          len: {
            args: [6, 128],
            msg: 'Password must be at least 6 characters long'
          }
        }
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'player',
        validate: {
          isIn: {
            args: [['admin', 'player']],
            msg: 'Role must be either admin or player'
          }
        }
      }
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'Users',
      hooks: {
        beforeSave: async (user) => {
          if (user.changed('password')) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        }
      }
    }
  );

  return User;
};
