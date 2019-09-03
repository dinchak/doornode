const child_process = require('child_process')
const net = require('net')
const fs = require('fs')
const config = require('../config')
const ConnectionManager = require('./connection_manager')

const dropFileFormats = [
  'DoorSys', 'DorInfo', 'DoorFileSR'
]

class Door {

  constructor(doorConfig, wrapper) {
    this.wrapper = wrapper
    this.inputMode = 'char'
    this.localEcho = false

    if (!doorConfig.doorCmd) {
      throw new Error('doorCmd not specified')
    }

    if (!doorConfig.dropFileFormat) {
      throw new Error('dropFileFormat not specified')
    }

    if (dropFileFormats.indexOf(doorConfig.dropFileFormat) == -1) {
      throw new Error(doorConfig.dropFileFormat + ' must be one of: ' + dropFileFormats.toString())
    }

    if (!doorConfig.multiNode && !doorConfig.dropFileDir) {
      throw new Error('multiNode or dropFileDir must be specified')
    }

    this.client = null
    this.doorCmd = doorConfig.doorCmd
    this.dropFileFormat = doorConfig.dropFileFormat
    this.nodePort = config.dosbox.startPort + this.wrapper.node

    if (doorConfig.multiNode) {
      this.dropFileDir = `${config.dosbox.drivePath}/nodes/node${this.wrapper.node}`
      this.createNodeDir()
    } else {
      this.dropFileDir = `${config.dosbox.drivePath}${doorConfig.dropFileDir}`
    }

    if (doorConfig.removeLockFile) {
      let lockFile = `${config.dosbox.drivePath}${doorConfig.removeLockFile}`
      if (fs.existsSync(lockFile)) {
        fs.unlinkSync(lockFile)
      }
    }

    this.createDosboxConfig()
  }

  createDosboxConfig() {
    const node = this.wrapper.node
    const nodePort = 10000 + node
    const configFile = `${config.dosbox.configPath}/dosbox.conf`
    const nodeConfigFile = `${config.dosbox.configPath}/dosbox${node}.conf`

    if (fs.existsSync(nodeConfigFile)) {
      return
    }

    let content = fs.readFileSync(configFile)
    content = content.toString().replace('port:10000', `port:${nodePort}`)
    content += '\nSET NODE=' + node + '\n'
    fs.writeFileSync(nodeConfigFile, content)
  }

  createNodeDir() {
    if (!fs.existsSync(this.dropFileDir)) {
      fs.mkdirSync(this.dropFileDir)
    }
  }

  createDoorSys() {
    const dropFile = this.dropFileDir + '/DOOR.SYS'
    let contents = 'COM1:\r'
    contents += '38400\r'
    contents += '8\r'
    contents += this.wrapper.node + '\r'
    contents += '38400\r'
    contents += 'Y\r'
    contents += 'Y\r'
    contents += 'Y\r'
    contents += 'Y\r'
    contents += this.wrapper.user.name + '\r'
    contents += 'DoorNode\r'
    contents += '123 123-1234\r'
    contents += '123 123-1234\r'
    contents += 'PASSWORD\r'
    contents += '30\r'
    contents += '1\r'
    contents += '01/01/99\r'
    contents += '86400\r'
    contents += '1440\r'
    contents += 'GR\r'
    contents += '23\r'
    contents += 'Y\r'
    contents += '1,2,3,4,5,6,7\r'
    contents += '7\r'
    contents += '12/31/99\r'
    contents += this.wrapper.node + '\r'
    contents += 'Y\r'
    contents += '0\r'
    contents += '0\r'
    contents += '0\r'
    contents += '999999\r'
    contents += '01/01/81\r'
    contents += 'C:\\\r'
    contents += 'C:\\\r'
    contents += 'Sysop\r'
    contents += 'Sysop\r'
    contents += '00:05\r'
    contents += 'Y\r'
    contents += 'Y\r'
    contents += 'Y\r'
    contents += '14\r'
    contents += '999999\r'
    contents += '01/01/99\r'
    contents += '00:05\r'
    contents += '00:05\r'
    contents += '999\r'
    contents += '0\r'
    contents += '0\r'
    contents += '0\r'
    contents += 'DoorNode user\r'
    contents += '0\r'
    contents += '0\r'
    fs.writeFileSync(dropFile, contents)
  }

  createDorInfo() {
    const dropFile = this.dropFileDir + '/DORINFO1.DEF'
    let contents = 'DoorNode\r\n'
    contents += this.wrapper.user.name + '\r\n'
    contents += 'Lastname\r\n'
    contents += 'COM1\r\n'
    contents += '38400 BAUD,N,8,1\r\n'
    contents += '0\r\n'
    contents += this.wrapper.user.name + '\r\n'
    contents += '\r\n'
    contents += '123 Test Lane\r\n'
    contents += '1\r\n'
    contents += '30\r\n'
    contents += '32766\r\n'
    contents += '0\r\n'
    fs.writeFileSync(dropFile, contents)
  }

  createDoorFileSR() {
    const dropFile = this.dropFileDir + '/DOORFILE.SR'
    let contents = this.wrapper.user.name + '\r\n'
    contents += '1\r\n'
    contents += '0\r\n'
    contents += '23\r\n'
    contents += '38400\r\n'
    contents += '1\r\n'
    contents += '86400\r\n'
    contents += this.wrapper.user.name + '\r\n'
    fs.writeFileSync(dropFile, contents)
  }

  removeDoorFileSR() {
    const dropFile = this.dropFileDir + '/DOORFILE.SR'
    if (fs.existsSync(dropFile)) {
      fs.unlinkSync(dropFile)
    }
  }

  removeDorInfo() {
    const dropFile = this.dropFileDir + '/DORINFO1.DEF'
    if (fs.existsSync(dropFile)) {
      fs.unlinkSync(dropFile)
    }
  }

  removeDoorSys() {
    const dropFile = this.dropFileDir + '/DOOR.SYS'
    if (fs.existsSync(dropFile)) {
      fs.unlinkSync(dropFile)
    }
  }

  render() {
    this.wrapper.clearScreen()

    this['create' + this.dropFileFormat]()

    let env = {}

    if (config.dosbox.headless) {
      env = {
        SDL_VIDEODRIVER: 'dummy'
      }
    }

    let opts = [
      `${config.dosbox.drivePath}/bin/exit.bat`,
      '-c',
      this.doorCmd,
      '-conf',
      `dosbox${this.wrapper.node}.conf`,
      '-exit'
    ]

    this.process = child_process.spawn(config.dosbox.dosboxPath, opts, {
      cwd: config.dosbox.configPath,
      env
    })

    this.process.on('exit', () => {
      this.wrapper.socket.end()
    })

    let tries = 0
    let connectInterval = setInterval(() => {
      tries++

      if (tries >= 20) {
        console.log(`Failed to connect to port ${this.nodePort} after 20 tries, giving up`)
        clearInterval(connectInterval)
        ConnectionManager.close(this.wrapper)
        return
      }

      this.client = net.connect({port: this.nodePort})

      this.client.on('connect', () => {
        clearInterval(connectInterval)
        this.client.setEncoding('binary')
        this.client.on('data', data => {
          this.wrapper.write(data)
        })
        this.client.on('close', () => {
          this.client = null
          this['remove' + this.dropFileFormat]()
        })
      })

    }, 100)
  }

  input(input) {
    if (!this.client) {
      return
    }
    this.client.write(input)
  }

  destroy() {
    if (this.client) {
      this.client.end()
    }
    this.process.kill()
  }
}

module.exports = Door