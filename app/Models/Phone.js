module.exports = (sequelize, DataTypes) => {
  const Phone = sequelize.define(
    'Phone',
    {
      numero: DataTypes.STRING,
      ddd: DataTypes.STRING,
    },
    {
      sequelize,
    }
  )
  Phone.associate = models => {
    Phone.belongsTo(models.User, { foreignKey: 'user_id', as: 'users' })
  }
  return Phone
}
