const express = require('express')
const app = express()
const m10 = require('../src/index.js')
const config = require('./config.json')

m10.init(config, app)

app.listen(process.env.PORT || 3000)

module.exports = app
