module.exports = (req, res, next) => {
  if (res.locals && res.locals.pass == true) {
    return next()
  }
  next(new Error('This is a blocking middleare'))
}
