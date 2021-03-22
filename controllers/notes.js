const Note = require('../models/Note')
const jwt = require('jsonwebtoken')
const status = require('../constants')
/**
 * GET /notes маршрут для получения списка всех заметок
 * limit - параметр ограничивающий количество заметок
 * offset - параметр определяющий индекс начала выборки
 */
const getNotes = async (req, res) => {
    const notes = await Note.findAll({
        limit: req.query.limit,
        offset: req.query.offset,
        where: { owner: req.user }
    })

    res.status(status.OK).json({ notes, count: notes.length })
}

// Create a new note
const createNote = async (req, res) => {
    const text = req.body.text
    const owner = req.user

    try {
        await Note.create({ text, owner })
        res.status(status.CREATED).json({ message: 'Note create successfully' })
    } catch(e) {
        res.status(status.SERVER_ERROR).json({ message: 'Note creation failed' })
    }
}

// Update existing note
const updateNote = async (req, res) => {
    let note
    const fieldsToUpdate = req.body.fields

    try {
        note = await Note.findOne({
            where: { id: req.body.noteId }
        })
    } catch (e) {
        res.status(status.SERVER_ERROR).json({ message: 'Note update failed' })
    }

    if (note) {
        for (let field in fieldsToUpdate) {
            if (field in note) note[field] = fieldsToUpdate[field]
        }

        try {
            await note.save()
            res.status(status.OK).json({ message: 'Note updated successfully' })
        } catch (e) {
            res.status(status.SERVER_ERROR).json({ message: 'Note update failed' })
        }
    } else {
        res.status(status.NOT_FOUND).json({ message: 'Note not found' })
    }


}

// Delete note
const deleteNote = async (req, res) => {
    const note = await Note.findOne({
        where: { id: req.body.noteId }
    })

    try {
        await note.destroy()
        res.status(status.OK).json({ message: 'Note deleted successfully' })
    } catch (e) {
        res.status(status.SERVER_ERROR).json({ message: 'Note deletion failed' })
    }
}

// Share note
const shareNote = (req, res) => {
    const token = jwt.sign(req.body.noteId, process.env.VIEW_TOKEN_SECRET)
    res.status(status.OK).json(token)
}

// View note
const viewNote = async (req, res) => {
    let id
    jwt.verify(req.query.token, process.env.VIEW_TOKEN_SECRET, (err, noteId) => {
        if (err) {
            console.log('token ~>', req.query.token)
            console.error(err)
            res.sendStatus(status.FORBIDDEN)
        }
        id = noteId
    })

    try {
        const note = await Note.findOne({
            where: { id }
        })

        if (note) res.status(status.OK).json(note)
        else res.status(status.NOT_FOUND).json({ message: 'Note not found' })

    } catch (e) {
        res.status(status.SERVER_ERROR).json({ message: 'Note search failed' })
    }
}

module.exports = {
    getNotes,
    createNote,
    updateNote,
    deleteNote,
    shareNote,
    viewNote
}
