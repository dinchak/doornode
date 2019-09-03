# DoorNode - BBS Door Game Server
DoorNode is a node.js application for launching BBS door games using [Dosbox](https://www.dosbox.com/) on modern operating systems.  It's designed to be used with MajorBBS/WorldGroup software to launch non-MBBS doors via the RLogin module, but it could be easily adapted to other use cases.  It has been tested on Ubuntu Linux and OSX.

## Features
* Run BBS door games on a modern operating system using Dosbox
* Supports popular drop file formats including DOOR.SYS, DORINFO1.DEF, and DOORFILE.SR
* Supports multi-node operation
* RLogin server for easy MajorBBS/WorldGroup integration
* Debug server included

## Demo
DoorNode is running behind the scenes on [The Funknown BBS](http://fubbs.servebeer.com) to launch non-MBBS door games such as Barren Realms Elite (BRE), Solar Realms Elite (SRE), The Pit, Legend of the Red Dragon (LORD), Exitilus, Usurper, Land of Devastation (LOD) and more.  Go to the Games menu and select any of the above listed games to see it in action.

## Installation
DoorNode has been tested on Ubuntu Linux and OSX but should work on any modern operating system.

1. Install the latest stable version of [node.js](https://nodejs.org/en/download/)
2. Clone the DoorNode repository: `git clone https://github.com/dinchak/doornode`
3. Modify `config.js` to match your preferences.  See the configuration section below.
4. Copy your door installation files to somewhere in `dosbox/drive`.
5. Run `dosbox` from the `dosbox` folder and install your doors.  See the configuration section below.
6. Run `node app.js` to run DoorNode.
7. Connect to the Debug port by running `telnet localhost 1234` or by using your favorite terminal program.
8. Run a door from the Debug port to test if everything is working as expected.
9. Configure your BBS software to connect to DoorNode via RLogin.

## Configuration
There are three types of configuration that need to happen: DoorNode configuration, the actual door program configuration, and MBBS/WorldGroup configuration.

### DoorNode Configuration
The `config.js` file in the root of the DoorNode repository should be all you need to modify.  Here's an overview of the available configuration parameters:

* `port` - The RLogin port, defaults to 513.  You will probably need to elevate node.js port access which can be done by running the following command: 

```
sudo setcap 'cap_net_bind_service=+ep' `which node`
```

Please note that elevating node's security like this can have security consequences, please make sure you're aware of the implications.  You can also listen on a non-privileged port and setup port forwarding, or any other solution you prefer.

* `debugPort` - The Debug port, defaults to 1234.  You can connect to this port using `telnet` or any terminal application to monitor usage and test launching door applications.

* `dosbox.dosboxPath` - The full path to the dosbox executable.  Just run `which dosbox` from a terminal if you aren't sure.

* `dosbox.configPath` - The path to the dosbox configuration files.  Defaults to the `dosbox` folder included in the repository.

* `dosbox.drivePath` - The path to the dosbox drive.  Defaults to the `dosbox/drive` folder included in the repository.

* `dosbox.startPort` - Dosbox communication is handled over a virtual serial port that listens on a TCP/IP port.  Each node is launched on a separate port which DoorNode then connects to in order to facilitate communciation.  This value plus the node number is the port Dosbox should listen on.

* `dosbox.headless` - Controls Dosbox being launched in headless mode, which just sets the SDL_VIDEODRIVER variable to `dummy` preventing the window from coming up on the DoorNode server.  Defaults to `true` but can be set to `false` for debugging.

#### Door Module Configuration
* `name` - The name of the module.  For MajorBBS/WorldGroup it's important that the name not contain spaces or special characters.

* `doorCmd` - The DOS path to the file that should be executed to launch the door.  Many example batch files have been included.

* `dropFileFormat` - Currently supported formats are `DoorFileSR`, `DorInfo`, and `DoorSys`.

* `dropFileDir` - The location to write the dropfile relative to `dosbox.drivePath`.

* `multinode` - `true` or `false`.  If `true`, `dropFileDir` is ignored and dropfiles will instead be written to `C:\NODES\NODEx` where `x` is the node number.

* `removeLockFile` - If you need to delete a lock file after the door terminates then set this to a path relative to `dosbox.drivePath`.

### Door Game Configuration
The supplied `dosbox/dosbox.conf` file is a template that will be copied to `dosbox/dosbox1.conf`, `dosbox/dosbox2.conf`, etc. for each node.  The `dosbox/drive` image comes pre-supplied with a few utilities including `FAKESHAR.EXE`, `BNU.COM`, and `PKUNZIP.EXE`.  This should be all that's needed to install most door games.

Each door game is configured a little differently, but generally speaking you'll want to install door games as follows:

* Find the door game you want to install online and download the .ZIP file.  Create a folder for it in `drive/dosbox/doors` and decompress it, either in your host operating system or within Dosbox.

* Run `dosbox` from the `drive/dosbox` folder to start it with the supplied `dosbox.conf` file.  This is an easy way to run setup programs and get door games ready to go.

* Some door games support multi-node operation.  If so, configure it to look for drop files in `C:\NODES\NODEx` where `x` is the node number.  For example, node 1's dropfile would be `C:\NODES\NODE1\DORINFO1.DEF`.

* The `C:\DOORS\BIN` folder has many example batch files for popular door games and should help you get started.

### MajorBBS/WorldGroup Configuration
DoorNode was designed to work with MajorBBS/WorldGroup where it's difficult to run these games.  Integrating with the RLogin module is easy:

* Create a new menu item for each door game
* Edit the menu item and set it to a Module Page
* Set the Module Name to RLogin
* Set the command string as follows: `l <doornode ip> %U <module name> ansi`

For example, if DoorNode was running on `192.168.1.200` and I was setting up the `BRE` door, I would set the command string to:

`l 192.168.1.200 %U BRE ansi`

Just repeat the above process for each door module.

## Questions?

Feel free to open an issue or get ahold of me on [The Funknown BBS](http://fubbs.servebeer.com) and I'll be happy to help!