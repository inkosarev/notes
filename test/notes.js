const bcrypt = require('bcryptjs')
const chai = require('chai')
const chaiHttp = require('chai-http')
const should = chai.should()

const User = require('../models/User')
const Note = require('../models/Note')

const server = require('../server')
const status = require('../constants')

let accessToken
let refreshToken
let viewToken

chai.use(chaiHttp)

User.destroy({ where: {}, truncate: true })
Note.destroy({ where: {}, truncate: true })

// Note.create({ text: 'lorem ipsum', owner: 'ex@mail.com' })
describe('all', () => {
    describe('registration', () => {
        it('it should not POST a new user without login/password', (done) => {
            chai.request(server)
                .post('/auth/register')
                .send({"email": "", "password": ""})
                .end((err, res) => {
                    res.should.have.status(status.BAD_REQUEST)
                    done()
                })
        })

        it('it should POST a new user', (done) => {
            chai.request(server)
                .post('/auth/register')
                .send({"email": "ex@mail.com", "password": "pass"})
                .end((err, res) => {
                    res.should.have.status(status.CREATED)
                    done()
                })
        })

        it('it should login the user and get valid tokens', (done) => {
            chai.request(server)
                .post('/auth/login')
                .set('Content-Type', 'application/json')
                .send({"email": "ex@mail.com", "password": "pass"})
                .end((err, res) => {
                    res.should.have.status(status.OK)

                    res.body.should.have.property('accessToken')
                    res.body.should.have.property('refreshToken')

                    accessToken = res.body.accessToken
                    refreshToken = res.body.refreshToken

                    chai.request(server)
                        .head('/notes/notes')
                        .set('Authorization', 'JWT ' + accessToken)
                        .end((err, res) => {
                            res.should.have.status(status.OK)
                            done()
                        })
                })
        })

        it('it should refresh access token', done => {
            chai.request(server)
                .post('/auth/refresh')
                .set('Content-Type', 'application/json')
                .send({token: refreshToken})
                .end((err, res) => {
                    res.should.have.status(status.OK)

                    res.body.should.have.property('accessToken')
                    accessToken = res.body.accessToken

                    chai.request(server)
                        .get('/notes/notes')
                        .set('Authorization', 'JWT ' + accessToken)
                        .end((err, res) => {
                            res.should.have.status(status.OK)
                            done()
                        })
                })
        })

        it('it login user and POST a new note', done => {
            chai.request(server)
                .post('/auth/login')
                .set('Content-Type', 'application/json')
                .send({"email": "ex@mail.com", "password": "pass"})
                .end((err, res) => {
                    res.should.have.status(status.OK)
                    res.body.should.have.property('accessToken')
                    accessToken = res.body.accessToken

                    chai.request(server)
                        .post('/notes/notes')
                        .set('Authorization', 'JWT ' + accessToken)
                        .send({"text": "lorem ipsum"})
                        .end((err, res) => {
                            res.should.have.status(status.CREATED)
                            done()
                        })
                })
        })

        it('it should UPDATE existing note', done => {
            Note.create({ text: 'lorem ipsum', owner: 'ex@mail.com' })
                .then(note => {
                    chai.request(server)
                        .put('/notes/notes')
                        .set('Authorization', 'JWT ' + accessToken)
                        .send({
                            "noteId": note.id,
                            "fields": {
                                "text": "new text",
                                "nonexistent": null
                            }
                        })
                        .end((err, res) => {
                            res.should.have.status(status.OK)
                            done()
                        })
                })
        })

        it('it should delete note', done => {
            Note.create({ text: 'lorem ipsum', owner: 'ex@mail.com' })
                .then(note => {
                    chai.request(server)
                        .delete('/notes/notes')
                        .set('Authorization', 'JWT ' + accessToken)
                        .send({ "noteId": note.id })
                        .end((err, res) => {
                            res.should.have.status(status.OK)
                            done()
                        })
                })
        })

        it('it should share note', done => {
            Note.create({ text: 'lorem ipsum', owner: 'ex@mail.com' })
                .then(note => {
                    chai.request(server)
                        .post('/notes/share')
                        .set('Authorization', 'JWT ' + accessToken)
                        .send({"noteId": note.id})
                        .end((err, res) => {
                            res.should.have.status(status.OK)
                            chai.request(server)
                                .get(`/notes/note?token=${res.body}`)
                                .end((err, res) => {
                                    res.should.have.status(status.OK)
                                    done()
                                })
                        })
                })
        })

        it('it should GET all notes', done => {
            chai.request(server)
                .get('/notes/notes')
                .set('Authorization', 'JWT ' + accessToken)
                .end((err, res) => {
                    res.should.have.status(status.OK)
                    res.body.notes.should.be.a('array')
                    res.body.notes.length.should.be.eql(3)
                })
            done()
        })

        it('it should GET all notes limit 1 offset 3', done => {
            Note.create({ text: 'lorem ipsum', owner: 'ex@mail.com' })
                .then(note => {
                    chai.request(server)
                        .get('/notes/notes?limit=1&offset=3')
                        .set('Authorization', 'JWT ' + accessToken)
                        .end((err, res) => {
                            res.should.have.status(status.OK)
                            res.body.notes.should.be.a('array')
                            res.body.notes.length.should.be.eql(1)
                            res.body.notes[0].id.should.be.eql(note.id)
                            done()
                        })
                })
        })
    })
})





