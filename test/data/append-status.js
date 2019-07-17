module.exports = (req, res, next) => {
  res.locals.customStatus = req.query.customStatus
  next()
}
