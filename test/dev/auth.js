function verify (_verifyToken, req, res, next) {
  let token = req.query.token
  if (typeof token !== 'string' || token !== _verifyToken) {
    return res.status(401).send('Invalid token provided')
  }
  next()
}

module.exports.global = (req, res, next) => verify('global', req, res, next)
module.exports.specific = (req, res, next) => verify('specific', req, res, next)

module.exports.testPresent = (req, res, next) => {
  let test = req.query.test
  if (!test) {
    return res.status(400).send('Add `test` in your query')
  }
  next()
}
