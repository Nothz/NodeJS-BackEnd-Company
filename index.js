/**
 * Primary file for the API
 *
 */

//  Dependencies
const http = require('http')
const https = require('https')
const url = require('url')
const StringDecoder = require('string_decoder').StringDecoder
const config = require('./config')
const fs = require('fs')

// Instantiate the HTTP server
const httpServer = http.createServer((req,res)=>{
  unifiedServer(req,res)
})

// Start the HTTP server
httpServer.listen(config.httpPort,()=>{
  console.log("The server is listening on port "+config.httpPort)
})

// Instantiate the HTTPS server
const httpsServerOptions = {
  'key' : fs.readFileSync('./https/key.pem'),
  'cert' : fs.readFileSync('./https/cert.pem')
}
const httpsServer = https.createServer(httpsServerOptions,(req,res)=>{
  unifiedServer(req,res)
})

// Start the HTTPS server
httpsServer.listen(config.httpsPort,()=>{
  console.log("The server is listening on port "+config.httpsPort)
})

// All the server logic for both the http and https server
const unifiedServer = (req, res)=>{

  // Get the URL and parse it
  const parseUrl = url.parse(req.url,true)

  // Get the path
  const path = parseUrl.pathname
  const trimmedPath = path.replace(/^\/+|\/+$/g,'')

  // Get the query string as an object
  const queryStringObject = parseUrl.query

  // Get the HTTP Method
  const method = req.method.toLowerCase()

  // Get the headers as an object
  const headers = req.headers

  // Get the payload, if any
  const decode = new StringDecoder('utf-8')
  let buffer = ''
  req.on('data',data=>{
    buffer += decode.write(data)
  })
  req.on('end',()=>{
    buffer += decode.end()

    // Choose the handler this request should go to. If one is not found, use the notFound handler
    const chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound

    // Construct the data object to send to the handler
    const data = {
      'trimmedPath': trimmedPath,
      'queryStringObject' : queryStringObject,
      'method' : method,
      'headers' : headers,
      'payload' : buffer
    }

    // Route the request tot the handler specified in the router
    chosenHandler(data,(statusCode,payload)=>{
      // Use the status code called back by the handler, or default to 200
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200
      // Use the payload called back by the handler, or default to empty object
      payload = typeof(payload) == 'object' ? payload : {}

      // Convert the payload to a string
      let payloadString = JSON.stringify(payload)

      // Return the response
      res.setHeader('Content-Type','application/json')
      res.writeHead(statusCode)
      res.end(payloadString)

      // Log the request path
      console.log('Returning this response: ',statusCode,payloadString)
    })
  })
}

// Define the handlers
const handlers = {};

// Sample handler
handlers.sample = (data,callback)=>{
  // Callback a http status code, and a payload object
  callback(406,{'name' : 'sample handler'})
}

// Ping handler
handlers.ping = (data,callback)=>{
  callback(200)
}

// Not found handler
handlers.notFound = (data,callback)=>{
  callback(404)
}

// Define a request router
const router = {
  'sample' : handlers.sample,
  'ping' : handlers.ping,
  'hello' : handlers.hello
}
