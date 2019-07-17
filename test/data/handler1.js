module.exports = (req, res) => {
  const customStatus =
    res.locals && res.locals.customStatus ? res.locals.customStatus : 200
  res.status(customStatus).send('OK')
}
