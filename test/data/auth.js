module.exports = (req, res, next) => {
  if (req.query && req.query.test == 'pass') {
    res.locals.pass = true
    return next()
  }
  next(new Error('Add ?test=pass'))
}
