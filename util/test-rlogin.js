const net = require('net')

let client = net.connect({port: 513}, () => {
  client.setEncoding('binary')
  client.on('data', data => {
    // this.out(data, true)
    process.stdout.write(data, 'binary')
  })
})

client.on('connect', () => {
  console.log(' -- client connected')
  client.write('TestUser\0LOD\0ansi', 'binary')
})

client.on('close', () => {
  console.log(' -- connection closed')
  process.exit()
})

process.stdin.setRawMode(true)

process.stdin.on('data', function (data) {
  data = String(data)
  if (data.charCodeAt(0) === 3) {
    process.exit()
  }
  client.write(data, 'binary')
})