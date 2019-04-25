const debug = require('debug')('m10')
debug('loading celebrate module')
const { celebrate, Joi, errors } = require('celebrate')
const path = require('path')

/**
 * Used to load nested files' functions (e.g. ./myfile.handler.start)
 * @param {string} str - File path of module/handler to load
 * @returns {Object} - Function or object
 */
function nestedLoad (str) {
  str = str.replace('.js', '')
  debug(`trying to load ${str}`)
  if (str.startsWith('./') === false) {
    throw new Error(`Path must start with ./\n Invalid: ${str}`)
    process.exit(1)
  }
  let handlerSplitDot = str.split('.')
  debug('file handler dot split into', handlerSplitDot)
  let handlerPath = path.resolve('.' + handlerSplitDot[1])
  debug(`file path location ${handlerPath}`)
  debug('loading file via require')
  // load plain js
  let m = require(handlerPath)
  debug('file loaded')
  // get "inner" item by going deeper
  let innerList = handlerSplitDot.slice(2, handlerSplitDot.length)
  debug('keys list to loop', innerList)
  innerList.forEach(innerKey => {
    debug(`going deeper with ${innerKey}`)
    // this will set the last item
    m = m[innerKey]
  })
  debug(`done, last element type: ${typeof m}`)
  if (typeof m === 'undefined') {
    throw new Error(
      `File provided with dot ${str} is not defined, make sure you entered the correct path/function`
    )
  }
  // return last item found
  return m
}

/**
 * Wraps an element into an array (if is not already)
 * @param {string|Array} item - string or array
 * @returns {Array}
 */
function getArray (item) {
  return Array.isArray(item) ? item : [item]
}

/**
 * Load m10 configuration into express app
 * @param {Object} config - m10 configuration object
 * @param {Object} app - Express app object
 * @param {Object} ops - Options object
 */
module.exports.init = function (config, app, ops) {
  console.log(`> Found a total of ${config.routes.length} route(s), loading...`)
  const hrstart = process.hrtime()
  debug('looping through routes')
  // setup routes
  config.routes.forEach(function (route) {
    debug('processing route', route)
    debug('loading global handlers')
    let routeHandlers = []
    if (config.global && typeof config.global.middleware !== 'undefined') {
      debug('importing global middleware to this route')
      routeHandlers = getArray(config.global.middleware)
    }

    if (typeof route.append_middleware !== 'undefined') {
      debug('appending middleware to this route')
      routeHandlers = routeHandlers.concat(getArray(route.append_middleware))
    } else if (typeof route.middleware !== 'undefined') {
      debug('adding specific middleware to this route')
      // middleware is specific to this route (overwrite global)
      routeHandlers =
        route.middleware === null ? [] : getArray(route.middleware)
    }

    if (typeof route.manager === 'string') {
      debug('found manager option')
      if (
        typeof route.validate !== 'undefined' ||
        typeof route.handler !== 'undefined'
      ) {
        throw new Error(
          `manager option for route ${route.method} ${
            route.path
          } but validate/handler found on same route, please choose manager only OR validate and handler`
        )
      }
      debug('loading manager exported function')
      let managerFn = nestedLoad(route.manager)
      if (typeof managerFn.validate === 'undefined') {
        throw new Error(
          `Validate object not found in ${route.manager}.validate`
        )
      }
      if (typeof managerFn.handler === 'undefined') {
        throw new Error(
          `Handler function not found in ${route.manager}.handler`
        )
      }
      route.validate = route.manager + '.validate'
      route.handler = route.manager + '.handler'
      debug('validate and handler set', route)
    }
    let infoTxt = ` > ${route.method} ${route.path} => ${route.handler}`

    debug('loading handler function')
    // load handler function
    let handler = nestedLoad(route.handler)

    let schemaInput = null
    if (route.validate) {
      debug('loading schema input')
      // load schema input
      schemaInput = nestedLoad(route.validate)
    }
    debug('composing middleware array from', routeHandlers)
    let routeMiddlewares = []
    routeHandlers.forEach(function (thisRouteMiddleware) {
      debug(`loading route middleware ${thisRouteMiddleware}`)
      let thisMiddleware = nestedLoad(thisRouteMiddleware)
      routeMiddlewares.push(thisMiddleware)
      debug('loaded and added to route list')
    })
    debug('applying celebrate and final handler function to route middlewares')
    // add validation if present
    if (schemaInput !== null) {
      infoTxt += ` | validate: ${route.validate}`
      routeMiddlewares.push(celebrate(schemaInput, { stripUnknown: true }))
    }
    // handler must be the last in the middleware "chain"
    routeMiddlewares.push(handler)

    if (routeHandlers.length > 0)
      infoTxt += ` | middleware(s): ${routeHandlers.join(' ')}`

    debug('applying route definition to app')
    // load route with method, path, schema and handler
    app[route.method.toLowerCase()](route.path, routeMiddlewares)
    console.log(infoTxt)
    debug('route attached')
  })
  debug('all routes attached')
  const hrend = process.hrtime(hrstart)
  debug('routes loaded in: %ds %dms', hrend[0], hrend[1] / 1000000)
  debug('attaching celebrate middleware to app')
  // finally attach celebrate error middleware (to parse and return joi errors in json)
  app.use(errors())
  debug('init done')
  return true
}

// export Joi
module.exports.Joi = Joi

debug('module loaded')
