const net = require('net')
const ConnectionManager = require('./lib/connection_manager')
const InputHandler = require('./lib/input_handler')
const config = require('./config')

process.on('uncaughtException', err => {
  console.log(err.stack)
})

process.on('unhandledRejection', err => {
  console.log(err.stack)
})

start()

async function start() {
  try {
    validateConfig()
    startServer()
    console.log('DoorNode listening on port ' + config.port)
    if (config.debugPort) {
      startDebugServer()
      console.log('Debug interface listening on port ' + config.debugPort)
    }
  } catch (err) {
    console.log(err.stack)
    process.exit()
  }
}

function validateConfig() {
  if (!config.port) {
    throw new Error('config.port not configured')
  }

  if (!config.dosbox.dosboxPath) {
    throw new Error('config.dosbox.dosboxPath not configured')
  }

  if (!config.dosbox.configPath) {
    throw new Error('config.dosbox.configPath not configured')
  }

  if (!config.dosbox.drivePath) {
    throw new Error('config.dosbox.drivePath not configured')
  }

  if (!config.dosbox.startPort) {
    throw new Error('config.dosbox.startPort not specified')
  }
}

function startServer() {
  let server = net.createServer(conn => {
    conn.setEncoding('binary')
    
    let wrapper = ConnectionManager.init(conn)

    conn.on('end', () => {
      ConnectionManager.close(wrapper)
    })

    conn.on('data', async str => {
      await InputHandler.onData(wrapper, str)
    })
  })

  server.listen(config.port)
}

function startDebugServer() {
  let server = net.createServer(conn => {
    conn.setEncoding('binary')
    
    let wrapper = ConnectionManager.init(conn)
    wrapper.user = {
      name: 'DebugUser',
      module: 'Debug',
      terminal: 'ansi'
    }

    wrapper.setDebugModule()

    conn.on('end', () => {
      ConnectionManager.close(wrapper)
    })

    conn.on('data', async str => {
      await InputHandler.onData(wrapper, str)
    })

  })

  server.listen(config.debugPort)
}