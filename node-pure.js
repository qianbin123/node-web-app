const child_process = require('child_process');

debugger
/* parent.js */
var child = child_process.spawn('node', [ 'child.js' ], {
  stdio: [ 0, 1, 2, 'ipc' ]
});

child.on('message', function (msg) {
  debugger
  console.log(msg);
});

child.send({ hello: 'hello' });

/* child.js */
process.on('message', function (msg) {
  debugger
  msg.hello = msg.hello.toUpperCase();
  process.send(msg);
});