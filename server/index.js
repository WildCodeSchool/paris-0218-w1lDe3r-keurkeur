const express = require('express')
const bodyParser = require('body-parser')
const session = require('express-session')
const fileStore = require('session-file-store')(session)

const port = 3000
const secret = 'something wild'

const db = require('./db-fs.js')

const app = express()

// MIDDLEWARES

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// Headers middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin)
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  res.header('Access-Control-Allow-Credentials', 'true') // important
  next()
})

// set up session
app.use(session({
  secret,
  resave: true,
  saveUninitialized: false,
  store: new fileStore({secret}),
}))

// Logger middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, { user: req.session.user, cookie: req.headers.cookie })
  next()
})
// ROUTES

app.get('/', (req, res) => {
  const user = req.session.user || {}

  res.json(user)
})

const keepBests = users => users
  .sort((user1, user2) => user2.bestScore - user1.bestScore)
  .slice(0, 5)

app.get('/scores', (req, res) => {
  db.getUsers()
    .then(keepBests)
    .then(users => res.json(users))
    .catch(err => res.status(500).end(err.message))
})

app.post('/addscore', (req, res, next) => {
  const { userId, score } = req.body

  db.addScore(userId, score)
    .then(() => res.json('OK'))
    .catch(next)
})

// Sign up : check the database to verify that the email get from client doesn't exist
// then write a new file in database/users to create the new user
app.post('/sign-up', async (req, res, next) => {
  const user = req.body // username, email, password

  // error handling
  const users = await db.getUsers()

  const emails = users.map(user => user.email)
  const emailAlreadyExists = emails.some(email => email === user.email)
  if (emailAlreadyExists) {
    return next(Error('Email already exists'))
  }

  const usernames = users.map(user => user.username)
  const usernameAlreadyExists = usernames.some(username => username === user.username)
  if (usernameAlreadyExists) {
    return next(Error('Username already exists'))
  }

  user.bestScore = 0
  user.score = []

  db.addUser(user)
    .then(() => res.json('OK'))
    .catch(err => res.status(500).end(err.message))
})

// Sign in / sign out
app.post('/sign-in', async (req, res, next) => {
  const credentials = req.body

  const users = await db.getUsers()

  // does user exists ?
  const user = users.find(user => user.username === credentials.username || user.email === credentials.username)

  // Error handling
  if (!user) {
    return res.json({ error: 'User not found' })
  }
  if (user.password !== credentials.password) {
    return res.json({ error: 'Wrong password' })
  }

  // else, set the user into the session
  req.session.user = user

  res.json(user)
})

app.get('/sign-out', (req, res, next) => {
  req.session.user = {}

  res.json(req.session.user)
})

app.use((err, req, res, next) => {
  if (err) {
    res.json({ message: err.message })
    console.error(err)
  }

  next(err)
})

app.listen(port, err => console.log(err || `server listening on port ${port}`))
