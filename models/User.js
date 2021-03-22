const { Sequelize, Model, DataTypes } = require('sequelize')
const sequelize = new Sequelize('sqlite:notes.sqlite3')

class User extends Model {}

User.init({
    email: DataTypes.STRING,
    password: DataTypes.STRING
}, {
    sequelize, modelName: 'User'
})

// User.sync({ force: true })

module.exports = User
