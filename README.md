# m10

[![npm version](https://badge.fury.io/js/m10.svg)](https://badge.fury.io/js/m10) 
[![Build Status](https://travis-ci.org/V3RITAS-UTD/m10.svg?branch=master)](https://travis-ci.org/V3RITAS-UTD/m10)

Centralized configuration development for Express APIs.
Describe your api in one file and just point to handlers and joi validations.
All routes with middlewares, handler and validation will be automatically loaded on start-up.

Suitable for:

 * MVPs

 * Prototypes

 * Small APIs

 * Microservices


Scaffold tool: [m10-cli](https://github.com/V3RITAS-UTD/m10-cli)


**Work in progress**


# Install

`npm install --save m10` or `yarn add m10`

Supported only Node.js 8+

# Usage

```js
const express = require('express')
const app = express()
const m10 = require('m10')
const config = require('./config.json') // m10 configuration

// load m10 config into this app
m10.init(config, app)

app.listen(3000)

```


# Config example

```
{
  "global": { // apply to all routes
    "middleware": "./middleware/auth.user" // point to file.functionName
  },
  "routes": [ // list of routes
    {
      "path": "/todo/:id",
      "method": "GET",
      "validate": "./schema/todo.findOne" // Joi schema to validate the user input - can be omitted if is not required
      "handler": "./handler/todo.findOne",
      // Optional (one of):
      /*
        Overwrite global middleware for this route only
        you can also use a single path or null

        "middleware": ["./utils/onlyMobileDevice", "./middleware/auth.user"]
      */
      /*
        Append this middleware (after the global one), for this route only
        you can also use an array

        "append_middleware": "./middleware/auth.premiumPlan"
      */
      /*
        Prepend this middleware (before the global one), for this route only
        you can also use an array

        "prepend_middleware": "./middleware/device.mobileOnly"
      */
    },
    {
      "path": "/ping",
      "method": "GET",
      "handler": "./handler/ping.js",
      "middleware": null // overwrite global middleware settings
    },
    {
      "path": "/todo",
      "method": "POST",
      "manager": "./todo.insertOne" // with manager you mean that `todo.insertOne` will have `handler` (todo.insertOne.handler) and `validate` (todo.insertOne.validate) objects
    }
  ]
}
```

## Lifecycle

`middleware(s)` --> `validate` --> `handler`

This flow will stop if one fails/throws (e.g. if `validate` fails the `handler` will not be called and the request is returned, same for custom middlewares) - see examples below

## File example

#### global.middleware

Value: `./middleware/auth.user`

Will resolve to:

 * File: `./middleware/auth.js`

 * Middleware function `user`

```js
module.exports.user = (req, res, next) => {
  let token = req.headers['x-api-key']
  if (!token || token !== 'password') {
    return res.status(401).send('Token not found/valid') // this will return, validation and handler won't be called 
  }
  // set user id for next routes
  req.session.user_id = 'user_x'
  next()
}
```


#### routes[0].validate

Value: `./schema/todo.findOne`

Will resolve to:

 * File: `./schema/todo.js`

 * Validate object `findOne`


```js
const { Joi } = require('m10') // import Joi lib
module.exports.findOne = {
  params: { // we want to validate only `params`
    id: Joi.string().max(128).required()
  }
  // here you can also validate `query`, `body` etc..
}
```


#### routes[0].handler

Value: `./handler/todo.findOne`

Will resolve to:

 * File: `./handler/todo.js`

 * Handler function `findOne`

```js
module.exports.findOne = async (req, res) => {
  // at this point user has passed the global middleware (middleware/auth.user) and has entered a valid :id (schema/todo.findOne)
  let todoFound = await req.db.collections('todo').findOne({todo_id: req.params.id})
  if (todoFound === null) return res.status(404)
  return res.status(200).json(todoFound)
}
```

#### routes[2].manager

Value: `./handler/todo.insertOne`

Will resolve to:

 * File: `./handler/todo.js`

 * Handler function `insertOne.handler`

 * Validate object `insertOne.validate`

```js
const { Joi } = require('m10') // import Joi lib
// "manager" will automatically load "validate" and "handler" 
module.exports.insertOne = {
  validate: {
    body: { // this is a POST request, validate body
      title: Joi.string().max(128).required(),
      description: Joi.string().max(2048),
      deadline: Joi.date().required()
    }
  },
  handler: async function (req, res) {
    // at this point user has passed all middlewares and body is validated
    let body = req.body
    let newTodo = Object.assign(body, {
      user_id: req.session.user_id,
      todo_id: 't' + Math.floor(Date.now() / 1000)
    })
    let insertRes = await req.db.collections('todo').insertOne(newTodo)
    res.status(201).json({success: true, todo_id: newTodo.todo_id})
  }
}
```

