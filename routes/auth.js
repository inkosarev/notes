const express = require('express')
const router = express.Router()

const controller = require('../controllers/auth')

router.post('/refresh', controller.refreshToken)
router.post('/register', controller.register)
router.post('/login', controller.login)

module.exports = router
