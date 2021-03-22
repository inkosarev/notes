require('dotenv').config()

const express = require('express')
const app = express()

const controller = require('./controllers/notes')
const authRoutes = require('./routes/auth')
const notesRoutes = require('./routes/notes')

app.use(express.json())
app.use('/auth', authRoutes)
app.use('/notes', notesRoutes)
app.get('/notes/note', controller.viewNote)

app.listen(3000)

module.exports = app
