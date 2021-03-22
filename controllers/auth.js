const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const status = require('../constants')
const User = require('../models/User')

const refreshTokens = []

// New user registration
const register = async (req, res) => {
    const email = req.body.email
    let password = req.body.password

    if (!(email && password)) {
        console.log(email, password)
       return res.status(status.BAD_REQUEST).json({message: 'User registration failed'})
    }

    const candidate = await User.findOne({
        where: { email }
    })

    if (!candidate) {
        // Create user
        try {
            const salt = bcrypt.genSaltSync(10)
            password = bcrypt.hashSync(password, salt)
            await User.create({email, password})
            res.status(status.CREATED).json({ message: 'User created successfully' })
        } catch (e) {
            res.status(status.SERVER_ERROR).json({ message: 'User registration failed', })
        }
    } else {
        // User already exists
        res.status(status.CONFLICT).json({ message: 'User already exists' })
    }
}

// User login
const login = async  (req, res) => {
    const user = await User.findOne({
        where: { email: req.body.email }
    })

    if (user) {
        const passwordMatched = bcrypt.compareSync(req.body.password, user.password)

        if (passwordMatched) {
            res.status(status.OK).json(generateTokens(user.email))
        } else {
            res.status(status.FORBIDDEN).json({ message: 'Invalid password' })
        }
    } else {
        res.status(status.NOT_FOUND).json({ message: 'User does not exist' })
    }
}

// User authentication
const authentication = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token == null) return res.sendStatus(status.UNAUTHORIZED)

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(status.FORBIDDEN)
        req.user = user.email
        next()
    })
}

// Get a new pair of tokens
const generateTokens = email => {
    const user = { email }

    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 60 * 60 })
    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET)

    refreshTokens.push(refreshToken) // todo token's storage

    return {
        accessToken,
        refreshToken
    }
}

// Refresh an access token
const refreshToken = (req, res) => {
    const refreshToken = req.body.token

    if (refreshToken == null) console.log('NULL')

    if (refreshToken == null) return res.sendStatus(status.UNAUTHORIZED)
    if (!refreshTokens.includes(refreshToken)) return res.sendStatus(status.FORBIDDEN)

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(status.FORBIDDEN)
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 60 * 60 })
        res.status(status.OK).json({ accessToken })
    })
}

module.exports = {
    authentication,
    refreshToken,
    register,
    login
}
