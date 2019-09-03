const ansi = require('ansi-escape-sequences')
const config = require('../config')
const ConnectionManager = require('./connection_manager')
const util = require('util')

class Debug {
  constructor(wrapper) {
    this.wrapper = wrapper
    this.inputMode = 'char'
    this.mode = 'main'
    this.monitorMode = 'command'
    this.localEcho = true
  }

  render() {
    if (this.mode == 'main') {
      this.wrapper.clearScreen()
      let out = `\n\r${ansi.styles(['green', 'bold'])}DoorNode ${ansi.styles(['normal', 'green'])}debug interface\n\r`
      out += `${ansi.styles(['normal', 'magenta'])}Username: ${ansi.styles(['bold', 'magenta'])}${this.wrapper.user.name}\n\r\n\r`
      out += `${ansi.styles(['normal', 'cyan'])}[${ansi.styles(['bold', 'cyan'])}M${ansi.styles(['normal', 'cyan'])}]onitor Connections\n\r`
      out += `${ansi.styles(['normal', 'cyan'])}[${ansi.styles(['bold', 'cyan'])}R${ansi.styles(['normal', 'cyan'])}]un Door\n\r`
      out += `${ansi.styles(['normal', 'cyan'])}[${ansi.styles(['bold', 'cyan'])}S${ansi.styles(['normal', 'cyan'])}]et Username\n\r`
      out += `${ansi.styles(['normal', 'cyan'])}[${ansi.styles(['bold', 'cyan'])}D${ansi.styles(['normal', 'cyan'])}]isconnect\n\r`
      out += `\n\r${ansi.styles(['reset'])}Command: ${ansi.styles(['bold', 'cyan'])}`
      this.wrapper.write(out)
    }

    if (this.mode == 'run') {
      let out = `\n\r\n\r${ansi.styles(['normal', 'cyan'])}Currently configured doors:\n\r`
      for (let door of config.doors) {
        out += `\n\r${ansi.styles(['bold', 'cyan'])}${door.name}`
      }
      out += `\n\r\n\r${ansi.styles(['reset'])}Run which door: ${ansi.styles(['bold', 'cyan'])}`
      this.wrapper.write(out)
    }

    if (this.mode == 'setuser') {
      this.wrapper.write(`\n\r\n\r${ansi.styles(['normal', 'magenta'])}Set username to: ${ansi.styles(['bold', 'magenta'])}`)
    }

    if (this.mode == 'monitor') {
      this.wrapper.clearScreen()
      let out = `Connection Monitor\n\r\n\r`
      out += util.format(`${ansi.styles(['bold', 'magenta'])}%s ${ansi.styles(['normal', 'magenta'])}| ${ansi.styles(['bold', 'magenta'])}%s ${ansi.styles(['normal', 'magenta'])}| ${ansi.styles(['bold', 'magenta'])}%s ${ansi.styles(['normal', 'magenta'])}| ${ansi.styles(['bold', 'magenta'])}%s ${ansi.styles(['normal', 'magenta'])}| ${ansi.styles(['bold', 'magenta'])}%s\n\r`, pad('Node', 4), pad('IP', 25), pad('Username', 30), pad('Module', 15), pad('Terminal', 15))
      for (let wrapper of ConnectionManager.wrappers) {
        out += util.format(`${ansi.styles(['bold', 'white'])}%s ${ansi.styles(['normal', 'magenta'])}| ${ansi.styles(['bold', 'white'])}%s ${ansi.styles(['normal', 'magenta'])}| ${ansi.styles(['bold', 'white'])}%s ${ansi.styles(['normal', 'magenta'])}| ${ansi.styles(['bold', 'white'])}%s ${ansi.styles(['normal', 'magenta'])}| ${ansi.styles(['bold', 'white'])}%s\n\r`, pad(wrapper.node, 4), pad(wrapper.remoteAddress, 25), pad(wrapper.user.name, 30), pad(wrapper.user.module, 15), pad(wrapper.user.terminal, 15))
      }
      out += '\n\r'

      if (this.monitorMode == 'command') {
        out += `${ansi.styles(['normal', 'cyan'])}E[${ansi.styles(['bold', 'cyan'])}X${ansi.styles(['normal', 'cyan'])}]it `
        out += `${ansi.styles(['normal', 'cyan'])}[${ansi.styles(['bold', 'cyan'])}D${ansi.styles(['normal', 'cyan'])}]isconnect `
        out += `${ansi.styles(['normal', 'cyan'])}[${ansi.styles(['bold', 'cyan'])}R${ansi.styles(['normal', 'cyan'])}]efresh`
        out += `\n\r${ansi.styles(['reset'])}Command: ${ansi.styles(['bold', 'cyan'])}`
      }

      if (this.monitorMode == 'disconnect') {
        out += `${ansi.styles(['reset'])}Disconnect node number: ${ansi.styles(['bold', 'cyan'])}`
      }

      this.wrapper.write(out)
    }
  }

  input(data) {
    let args = data.trim().split(/\s+/)
    let cmd = args.shift()

    if (this.mode == 'main') {
      if (cmd.toUpperCase() == 'R') {
        this.inputMode = 'line'
        this.mode = 'run'
      } else if (cmd.toUpperCase() == 'S') {
        this.inputMode = 'line'
        this.mode = 'setuser'
      } else if (cmd.toUpperCase() == 'M') {
        this.mode = 'monitor'
      } else if (cmd.toUpperCase() == 'D') {
        this.wrapper.write(`\n\r\n\r${ansi.styles(['bold', 'red'])}Goodbye...${ansi.styles(['reset'])}\n\r\n\r`)
        ConnectionManager.close(this.wrapper)
        return
      } else {
        this.wrapper.write(`\n\r\n\r${ansi.styles(['bold', 'red'])}Invalid command\n\r`)
      }
      this.render()
      return 
    }

    if (this.mode == 'monitor') {
      if (this.monitorMode == 'command') {
        if (cmd.toUpperCase() == 'X') {
          this.mode = 'main'
        }
        if (cmd.toUpperCase() == 'D') {
          this.monitorMode = 'disconnect'
          this.inputMode = 'line'
        }
        this.render()
        return
      }

      if (this.monitorMode == 'disconnect') {
        let wrapper = ConnectionManager.wrappers.find(w => w.node == parseInt(cmd, 10))
        if (wrapper) {
          ConnectionManager.close(wrapper)
        }
        this.monitorMode = 'command'
        this.inputMode = 'char'
        this.render()
        return
      }

    }

    if (this.mode == 'run') {
      let door = config.doors.find(d => d.name.toLowerCase() == cmd.toLowerCase())
      if (!door) {
        this.wrapper.write(`\n\r\n\r${ansi.styles(['bold', 'red'])}Door not found\n\r`)
        this.mode = 'main'
        this.inputMode = 'char'
        this.render()
        return
      }
      this.wrapper.write(`\n\r\n\r${ansi.styles(['bold', 'cyan'])}Running ${door.name}...\n\r`)
      this.wrapper.setModule(door.name)
      return
    }

    if (this.mode == 'setuser') {
      if (!cmd || cmd.length < 3 || cmd.length > 30) {
        this.wrapper.write(`\n\r\n\r${ansi.styles(['bold', 'red'])}Invalid name\n\r`)
      } else {
        this.wrapper.user.name = cmd
        this.wrapper.write(`\n\r\n\r${ansi.styles(['bold', 'magenta'])}Name set to ${cmd}\n\r`)
      }

      this.mode = 'main'
      this.inputMode = 'char'
      this.render()
      return
    }
  }

  destroy() {
  }
}

module.exports = Debug

function pad(str, length) {
  return String(str).padEnd(length, ' ')
}