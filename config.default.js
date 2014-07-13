/** LOCALIZE CONFIGURATION AND RENAME TO 'config.js' */

module.exports = {
  climate: {
    port: 'B'
  },
  relay: {
    port: 'A'
  },
  socket: {
    host: 'localhost',
    interval: 1000, // 1 second
    offset: 30000, // TODO: leverage wifi api when it becomes available
    port: 1337,
    timeout: 5000
  }
};
