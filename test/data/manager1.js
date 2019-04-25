const { Joi } = require('../../src/index.js')
module.exports = {
  validate: {
    query: {
      limit: Joi.number().max(10)
    }
  },
  handler: (req, res) => {
    res.status(200).send('OK')
  }
}
