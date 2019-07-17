const express = require('express')
const m10 = require('../src/index.js')
const request = require('supertest')
const { expect } = require('chai')

function generateExpress (config) {
  let thisApp = express()
  m10.init(config, thisApp)
  return thisApp
}

const testSet = [
  {
    name: 'load plain handler correctly and test it (without validation)',
    config: {
      routes: [
        {
          path: '/todo',
          method: 'get',
          handler: './test/data/handler1.js'
        }
      ]
    }
  },
  {
    name:
      'load plain handler correctly and test it (without validation and set to null)',
    config: {
      routes: [
        {
          path: '/todo',
          method: 'get',
          validation: null,
          handler: './test/data/handler1'
        }
      ]
    }
  },
  {
    name: 'load handler with dot correctly and test it (without validation)',
    config: {
      routes: [
        {
          path: '/todo',
          method: 'get',
          validation: null,
          handler: './test/data/handler2.inner'
        }
      ]
    }
  },
  {
    name: 'load handler with 2 dots correctly and test it (without validation)',
    config: {
      routes: [
        {
          path: '/todo',
          method: 'get',
          validation: null,
          handler: './test/data/handler3.inner.again'
        }
      ]
    }
  },
  {
    name: 'undefined handler (function does not exists)',
    should_throw: true,
    config: {
      routes: [
        {
          path: '/todo',
          method: 'get',
          validation: null,
          handler: './test/data/handler2.inner.NOT_HERE'
        }
      ]
    }
  },
  {
    name: 'undefined handler (file does not exists)',
    should_throw: true,
    config: {
      routes: [
        {
          path: '/todo',
          method: 'get',
          validation: null,
          handler: './test/NOT_HERE.js'
        }
      ]
    }
  },
  {
    name: 'load handler and validation with `manager` option and test it',
    tests: [
      {
        path: '/todo?limit=11',
        status: 400
      },
      {
        path: '/todo?limit=10',
        status: 200
      },
      {
        path: '/todo',
        status: 200
      }
    ],
    config: {
      routes: [
        {
          path: '/todo',
          method: 'get',
          manager: './test/data/manager1'
        }
      ]
    }
  },
  {
    name: 'Invalid path',
    should_throw: true,
    config: {
      routes: [
        {
          path: '/to do',
          method: 'get'
        }
      ]
    }
  },
  {
    name: 'Invalid path',
    should_throw: true,
    config: {
      routes: [
        {
          path: 'todo',
          method: 'get'
        }
      ]
    }
  },
  {
    name: 'Invalid path',
    should_throw: true,
    config: {
      routes: [
        {
          path: '/todo/inv#alid',
          method: 'get'
        },
        {
          path: '/todo',
          method: 'get',
          manager: './test/data/manager1'
        }
      ]
    }
  },
  {
    name: 'load handlers without ./',
    config: {
      routes: [
        {
          path: '/todo',
          method: 'get',
          validation: null,
          handler: 'test/data/handler3.inner.again'
        }
      ]
    }
  },
  {
    name: 'load handler and validation with /',
    tests: [
      {
        path: '/todo?limit=11',
        status: 400
      },
      {
        path: '/todo?limit=10',
        status: 200
      },
      {
        path: '/todo',
        status: 200
      }
    ],
    config: {
      routes: [
        {
          path: '/todo',
          method: 'get',
          manager: '/test/data/manager1'
        }
      ]
    }
  },
  {
    name: 'test global middleware and null overwrite',
    tests: [
      {
        path: '/todo',
        status: 200
      },
      {
        path: '/fail-middleware',
        status: 500
      }
    ],
    config: {
      global: {
        middleware: '/test/data/fail-middleware'
      },
      routes: [
        {
          path: '/todo',
          method: 'get',
          handler: '/test/data/handler1',
          middleware: null // this path should have no middleware
        },
        {
          path: '/fail-middleware',
          handler: '/test/data/handler1',
          method: 'get'
        }
      ]
    }
  },
  {
    name: 'test global middleware prepend and null overwrite',
    tests: [
      {
        path: '/middleware-null',
        status: 200
      },
      {
        path: '/middleware-custom',
        status: 200
      },
      {
        path: '/no-middleware',
        status: 500
      },
      {
        path: '/middleware-prepend?test=pass',
        status: 200
      }
    ],
    config: {
      global: {
        middleware: '/test/data/fail-middleware'
      },
      routes: [
        {
          path: '/middleware-null',
          method: 'get',
          handler: '/test/data/handler1',
          middleware: null // this path should have no middleware
        },
        {
          path: '/middleware-custom',
          method: 'get',
          handler: '/test/data/handler1',
          middleware: '/test/data/success-middleware' // overwrite global middleware
        },
        {
          path: '/no-middleware', // use global one
          handler: '/test/data/handler1',
          method: 'get'
        },
        {
          path: '/middleware-prepend',
          handler: '/test/data/handler1',
          method: 'get',
          prepend_middleware: '/test/data/auth' // prepend middleware so we test the data passes between middlewares
        }
      ]
    }
  },
  {
    name: 'test global middleware append and null overwrite',
    tests: [
      {
        path: '/middleware-overwrite',
        status: 200
      },
      {
        path: '/no-middleware',
        status: 500
      },
      {
        path: '/middleware-append?customStatus=999&test=pass', // test=pass is for global one, customStatus for the appended one
        status: 999
      }
    ],
    config: {
      global: {
        middleware: '/test/data/auth'
      },
      routes: [
        {
          path: '/no-middleware',
          method: 'get',
          handler: '/test/data/handler1'
        },
        {
          path: '/middleware-overwrite',
          method: 'get',
          handler: '/test/data/handler1',
          middleware: null
        },
        {
          path: '/no-middleware', // use global one
          handler: '/test/data/handler1',
          method: 'get'
        },
        {
          path: '/middleware-append',
          handler: '/test/data/handler1',
          method: 'get',
          append_middleware: '/test/data/append-status' // will be called after the global one
        }
      ]
    }
  }
]

testSet.forEach(t => {
  describe(t.name, () => {
    if (t.should_throw === true) {
      it('should throw', innerDone => {
        expect(() => generateExpress(t.config)).to.throw()
        innerDone()
      })
      // return so below code is not executed when app throws
      return
    }

    let app = generateExpress(t.config)

    for (let i = 0; i < t.config.routes.length; i++) {
      let testRoute = t.config.routes[i]
      it(`${testRoute.method} ${testRoute.path}`, async () => {
        if (t.tests) {
          for (let j = 0; j < t.tests.length; j++) {
            let thisTest = t.tests[j]
            let method = thisTest.method ? thisTest.method : testRoute.method
            await request(app)
              [method](thisTest.path)
              .expect(thisTest.status)
          }
        } else {
          await request(app)
            [testRoute.method](testRoute.path)
            .expect(200)
        }
      })
    }
  })
})
