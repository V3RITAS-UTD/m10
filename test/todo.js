const { Joi } = require('celebrate')

module.exports = {
  validate: {
    query: {
      limit: Joi.number()
        .integer()
        .max(100)
    }
  },
  handler: function (req, res) {
    res.status(200).json([{ name: 'test module' }])
  }
}

module.exports.ping = function (req, res) {
  res.status(200).send('OK')
}
