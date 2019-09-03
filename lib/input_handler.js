const ansi = require('ansi-escape-sequences')

function nextInput(wrapper) {
  const item = wrapper.inputQueue.shift()

  if (!item) {
    return
  }

  if (item.running) {
    nextInput(wrapper)
    return
  }

  if (!item.running) {
    item.running = true
    item.func()
  }
}

async function sendInput(wrapper, input) {
  const inputFunc = async () => {
    await wrapper.module.input(input)
    nextInput(wrapper)
  }

  const item = {
    running: false,
    func: inputFunc
  }

  wrapper.inputQueue.push(item)

  if (wrapper.inputQueue.length == 1) {
    item.running = true
    await item.func()
  }
}

async function handleCharInput(wrapper, char) {
  if (char.charCodeAt(0) == 127) {
    char = String.fromCharCode(8)
  }
  if (wrapper.module.localEcho) {
    wrapper.write(char)
  }
  await sendInput(wrapper, char)
}

async function handleLineInput(wrapper, char) {
  let charCode = char.charCodeAt(0)

  if (charCode == 13) {
    await sendInput(wrapper, wrapper.inputBuffer)
    wrapper.inputBuffer = ''
    return
  }

  if (charCode == 8 || charCode == 127) {
    if (!wrapper.inputBuffer.length) {
      return
    }
    wrapper.inputBuffer = wrapper.inputBuffer.substring(0, wrapper.inputBuffer.length - 1)
    renderBackspace(wrapper)
    return
  }

  if (charCode < 32 || charCode > 126) {
    return
  }

  if (wrapper.module.localEcho) {
    wrapper.write(char)
  }
  wrapper.inputBuffer += char
}

function detectScreenSize(wrapper, char) {
  var index = char.indexOf(String.fromCharCode(255) + String.fromCharCode(250) + String.fromCharCode(31))
  if (index > -1) {
    wrapper.width = (char.charCodeAt(index + 3) * 256) + char.charCodeAt(index + 4)
    wrapper.height = (char.charCodeAt(index + 5) * 256) + char.charCodeAt(index + 6)
    return true
  }
}

function detectCursorPosition(wrapper, char) {
  const index = char.indexOf('\x1b[')
  if (index > -1) {
    let coords = char.replace('\x1b[', '').replace('R', '').split(';')
    wrapper.cursor = [parseInt(coords[0], 10), parseInt(coords[1], 10)]
    return true
  } else {
    let charCode = char.charCodeAt(0)
    if (charCode < 32 || charCode > 126) {
      return
    }
    wrapper.write('\x1b[6n')
  }
}

function renderBackspace(wrapper) {
  if (wrapper.cursor[1] === 0) {
    wrapper.cursor[0]--
    wrapper.cursor[1] = wrapper.width
  }
  wrapper.write(ansi.cursor.position(wrapper.cursor[0], wrapper.cursor[1]))
  wrapper.write(' ')
  wrapper.write(ansi.cursor.position(wrapper.cursor[0], wrapper.cursor[1]))
  wrapper.cursor[1]--
}

function rloginAuth(wrapper, str) {
  if (wrapper.user) {
    return true
  }

  let pieces = str.split('\0').filter(s => s.length)

  if (pieces.length != 3) {
    console.log(`Unable to negotiate rlogin connection, received: ${str}`)
    wrapper.socket.end()
    return
  }

  wrapper.user = {
    name: pieces[0],
    module: pieces[1],
    terminal: pieces[2]
  }

  wrapper.write('\0')
  wrapper.setModule(wrapper.user.module)
  console.log(`User ${wrapper.user.name} launched ${wrapper.user.module}`)
  return
}

exports.onData = async function(wrapper, str) {
  if (detectScreenSize(wrapper, str)) {
    return
  }

  if (detectCursorPosition(wrapper, str)) {
    return
  }

  if (!rloginAuth(wrapper, str)) {
    return
  }

  // ignore telnet negotiation
  if (str.charCodeAt(0) == 255) {
    return
  }

  if (wrapper.module.inputMode == 'char') {
    await handleCharInput(wrapper, str)
    return
  }

  if (wrapper.module.inputMode == 'line') {
    await handleLineInput(wrapper, str)
    return
  }
}
