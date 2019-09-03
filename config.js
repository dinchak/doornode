/**
 * This is the doornode configuration file.  This file is for defining basic dosbox launch
 * configuration and setting up door modules.
 */

module.exports = {
  /**
   * Rlogin listen port
   */
  port: 513,

  /**
   * Use your terminal program to connect to this port and manually launch modules.
   */
  debugPort: 1234,

  /**
   * Dosbox launch configuration
   */
  dosbox: {
    // the path to the dosbox executable
    dosboxPath: '/usr/local/bin/dosbox',

    // the path to the dosbox config files
    configPath: __dirname + '/dosbox',

    // the path to the dosbox drive
    drivePath: __dirname + '/dosbox/drive',

    // communication is done using a nullmodem serial port mapping in dosbox
    // define the startpoint port number.  actual port numbers will be:
    // startPort + nodeNumber
    startPort: 10000,

    // launch dosbox instances in 'headless' mode (SDL_VIDEODRIVER=dummy)
    headless: true
  },

  /**
   * Define your door modules here.  Example:
   *
   * {
   *  // module name with no spaces
   *  name: 'ExampleDoor',
   * 
   *  // path to a .BAT file to load fossil drivers and launch the door.  see the examples folder.
   *  doorCmd: 'C:\\doors\\bin\\bre.bat',
   * 
   *  // drop file format, current supported formats are: DoorSys, DoorFileSR, DorInfo
   *  dropFileFormat: 'DoorFileSR',
   * 
   *  // where to write the dropfile (relative to drivePath)
   *  dropFileDir: '/doors/bre',
   * 
   *  // optional, if a lock file should be deleted after the user exits the door (relative to drivePath)
   *  removeLockFile: '/doors/bre/INUSE.FLG',
   * 
   *  // if the door has multinode support
   *  multinode: true
   * },
   */
  doors: [
  {
    name: 'BRE',
    doorCmd: 'C:\\doors\\bin\\bre.bat',
    dropFileFormat: 'DoorFileSR',
    dropFileDir: '/doors/bre',
    removeLockFile: '/doors/bre/INUSE.FLG'
  },
  {
    name: 'Exitilus',
    doorCmd: 'C:\\doors\\bin\\exitilus.bat',
    multiNode: true,
    dropFileFormat: 'DorInfo'
  },
  {
    name: 'LOD',
    doorCmd: 'C:\\doors\\bin\\lod.bat',
    multiNode: true,
    dropFileFormat: 'DorInfo'
  },
  {
    name: 'LORD',
    doorCmd: 'C:\\doors\\bin\\lord.bat',
    multiNode: true,
    dropFileFormat: 'DorInfo'
  },
  {
    name: 'SRE',
    doorCmd: 'C:\\doors\\bin\\sre.bat',
    dropFileFormat: 'DoorFileSR',
    dropFileDir: '/doors/sre',
    removeLockFile: '/doors/sre/INUSE.FLG'
  },
  {
    name: 'Pit',
    doorCmd: 'C:\\doors\\bin\\pit.bat',
    dropFileFormat: 'DorInfo',
    multiNode: true
  },
  {
    name: 'TW2002',
    doorCmd: 'C:\\doors\\bin\\tw2002.bat',
    dropFileFormat: 'DorInfo',
    multiNode: true
  },
  {
    name: 'Usurper',
    doorCmd: 'C:\\doors\\bin\\usurper.bat',
    dropFileFormat: 'DorInfo',
    multiNode: true
  }
  ]
}
