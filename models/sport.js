'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Sport extends Model {
    static associate(models) {
      Sport.hasMany(models.Session, {
        foreignKey: 'sport_id',
        as: 'sessions'
      });
    }
  }

  Sport.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: 'A sport with this title already exists'
        },
        validate: {
          notNull: { msg: 'Sport title is required' },
          notEmpty: { msg: 'Sport title cannot be empty' }
        },
        set(value) {
          this.setDataValue('title', value ? value.trim() : value);
        }
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        set(value) {
          this.setDataValue('description', value ? value.trim() : value);
        }
      }
    },
    {
      sequelize,
      modelName: 'Sport',
      tableName: 'Sports'
    }
  );

  return Sport;
};
