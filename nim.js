#!/usr/bin/env node
// CLIENT
var tty = require('tty');
    tty.setRawMode(true);  
var net = require('net');
var fs = require('fs');
var url = require("url"); // for parsing nimbus_url
var argv = process.ARGV;

// --------- 
// Nim class
// ---------
var Nim = function (argv, argc) {
  var socket = null;
  var nimbus_id = null;
  var filepath = null;
  var host = null;
  var port = null;
  var nimbus_url = null;
  var buffer = 'buffer';
  var joining = function (_nimbus_url) {
    nimbus_url = _nimbus_url;
    console.log('Trying to reach a nimbus at: '+nimbus_url);
    var nu = url.parse(nimbus_url, true);
    nimbus_id = nu.pathname.slice(1, nu.pathname.length);
    host = nu.hostname;
    port = nu.port;
    socket = connect(host, port);
    socket.write('join_nimbus:'+nimbus_id);
  }
  var creating = function (_host, _port, _filepath) {
    filepath = _filepath;
    host = _host;
    port = _port;
    console.log('Starting up a new nimbus from '+filepath);
    socket = connect(host, port);
    socket.write('create_new_nimbus');
  }
  // -----

  var doKeypress = function (chunk, key) {
    if (key && key.name) {
      switch (key.name) {
        case 'c':
          if (key.ctrl) process.exit();
        case 'backspace': 
          // caret.delprev
        case 'delete':
          // caret.delnext
        case 'left':
          // caret.goleft
        default:
          // fall through to text inputting
          // for now, output debug data
          process.stdout.write('[chunk: '+chunk+'] ');
          console.log(key);
      }
    } else {
      return chunk;
    }
  }

  var initEditor = function () {
    console.log('Initializing editor...');
    if (buffer == null) {
      console.log('Buffer not found--requesting buffer for: '+nimbus_id);
      socket.write('join_nimbus:'+nimbus_id);
    } else {
      console.log('Buffer found: \n'+buffer);
      // do we need to use ncurses?
      console.log('window size: '+tty.getWindowSize(0));
      console.log('Nimbus URL: '+nimbus_url);
      process.openStdin();
      process.stdin.on('keypress', doKeypress);
    }
  }
  
  // -----
  var connect = function () {
    var client = net.createConnection(port, host);
    client.setEncoding("UTF8");
    client.addListener("connect", function () {
      console.log('Connected to nimbus network!');
    });
    client.addListener("data", function (data) {
      if (data[0] == '@') {
        // reserved for real time data exchange
      } else {
        var parts = data.split(':');
        var message = parts[0];
        var params = parts.slice(1, parts.length);
        switch (message) {
          case 'new_nimbus':{
            nimbus_id = params[0].slice(0,-1);
            nimbus_url = 'nim:'+host+':'+port+'/'+nimbus_id;
            console.log('Initialized a new nimbus: '+nimbus_url);
            fs.readFile(filepath, "binary", function (err, _buffer) {
              buffer = _buffer;
              socket.write('seed_buffer:'+nimbus_id+'>'+buffer);
              console.log('Sent buffer for nimbus: '+nimbus_id);
          	});
            break;
          }
          case 'seed_buffer':{
            buffer = data.slice(20, data.length);
            initEditor();
            break;
          }
          case 'buffer_seed_ok':{
            console.log('Server reported successful nimbus creation!');
            console.log('Switching into editor mode.');
            initEditor();
            break;
          }
          case 'error':{
            console.error('[server error] '+data);
            process.exit();
          }
          default:{
            console.log('Unknown message: '+message);
            console.log('Included params: '+params);
            process.exit();
          }
        }
      }
    });
    client.addListener("end", function () {
      console.log('Connection closed.');
      process.exit();
    })
    return client;
  };
  process.on('uncaughtException', function (err) {
    if (err.code == 'EAFNOSUPPORT')
      console.log('Invalid nimbus url: '+nimbus_url);
    else if (err.code == 'ENOTFOUND')
      console.log('Invalid hostname: '+host);
    else if (err.code == 'ECONNREFUSED')
      console.log('Connection refused');
    else { console.error(err.stack); process.exit(); }
  });
  this.startUp = function (argv, argc) {
    if (argc == 1) joining(argv[2]);
    else if (argc == 3) creating(argv[2], argv[3], argv[4]);
    else console.log('Usage: nim [<host> <port> <file> | <nimbus_url>]');
  }
}

var nim = new Nim().startUp(argv, argv.length-2);