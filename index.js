
if (!process.env.token) {
  console.log('Error: "token" expected in environment!');
  process.exit(1);
}

var Botkit = require('botkit');
var Basics = require('./lib/basics');
var Tasks = require('./lib/tasks');
var storage_enabled = false;
var config = {
  debug: true,
};

if (process.env.file_store) {
  config.json_file_store = process.env.file_store;
  storage_enabled = true;
} else if (process.env.redis_url) {
  config.storage = require('botkit-storage-redis')({
    url: process.env.redis_url,
  });
  storage_enabled = true;
}

var controller = Botkit.slackbot(config);
var bot = controller.spawn({
  token: process.env.token,
}).startRTM();

if (process.env.youtube_key) {
  var YouTube = require('./lib/youtube');
  YouTube.init(process.env.youtube_key, controller);
}

if (storage_enabled) {
  Tasks.init(controller);
}

Basics.init(controller);
