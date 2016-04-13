var TEST_BOT_NAME = 'test_bot';
var TEST_DB_PATH = __dirname + '/test_db';
var TEST_USER = 'test_user';
var simple_storage = require('../node_modules/botkit/lib/storage/simple_storage');
var rimraf = require('rimraf');
var assert = require('assert');

function get_mock_bot(name, reply_callback) {
  return {
    identity: { name: name },
    reply: reply_callback
  };
}

module.exports = {
  get_mock_controller: function() {
    rimraf.sync(TEST_DB_PATH);
    var callbacks = {};
    return {
      hears: function(patterns, sources, callback) {
        for (var i = 0; i < patterns.length; i++) {
          var pattern = patterns[i];
          callbacks[pattern] = callback;
        }
      },
      run: function(pattern, bot, message) {
        if (callbacks[pattern]) {
          callbacks[pattern].call(null, bot, message);
        }
      },
      storage: simple_storage({ path: TEST_DB_PATH }),
    };
  },
  test_bot_reply: function(controller, pattern, test_message, test_callback) {
    var reply_callback = function(message, reply) {
      test_callback(reply);
    };
    var bot = get_mock_bot(TEST_BOT_NAME, reply_callback);
    controller.run(pattern, bot, test_message);
  },
  get_message: function(matches) {
    return {
      user: TEST_USER,
      match: matches,
    };
  },
  assert: assert,
  get_mock_bot: get_mock_bot,
};
