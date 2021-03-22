const express = require('express')
const router = express.Router()

const controller = require('../controllers/notes')
const authentication = require('../controllers/auth').authentication

router.use('/notes', authentication)
router.use('/share', authentication)

router.route('/notes')
    .get(controller.getNotes)
    .post(controller.createNote)
    .put(controller.updateNote)
    .delete(controller.deleteNote)

router.route('/share')
    .post(controller.shareNote)


module.exports = router
