const { Sequelize, Model, DataTypes } = require('sequelize')
const sequelize = new Sequelize('sqlite:notes.sqlite3')

class Note extends Model {}

Note.init({
    text: DataTypes.STRING,
    owner: DataTypes.STRING
}, {
    sequelize, modelName: 'Note'
})

// Note.sync({ force: true })

module.exports = Note
