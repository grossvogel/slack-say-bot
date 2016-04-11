var YouTube = require('../lib/youtube');
var assert = require('assert');
var nock = require('nock');

var TEST_BOT_NAME = 'test_bot';

describe('YouTube', function() {
  it('should have an init function', function() {
    assert.equal(typeof YouTube.init, 'function');
  });

  it('should initialize using a mock controller', function() {
    var controller = get_mock_controller();
    YouTube.init('test_api_key', controller);
  });

  it('should error if you call the real api with a bad key', function(done) {
    var controller = get_mock_controller();
    YouTube.init('test_api_key', controller);
    perform_search(controller, 'let me google that for you', function(reply) {
      assert.equal(reply, ':frowning: I\'m so sorry. I\'m new at this, and I got confused!');
      done();
    });
  });

  it('should reply with a video if the API is intercepted', function(done) {
    var controller = get_mock_controller();
    YouTube.init('test_api_key', controller);

    var scope = set_api_response([
      get_response_item('abc123', 'Sesame Street', 'https://thumbnail.com/url')
    ]);
    perform_search(controller, 'Find Sesame Street', function(reply) {
      assert.equal(reply.username, TEST_BOT_NAME);
      assert.equal(reply.text, ':robot_face: Looks like you want to see a video about "Find Sesame Street"...');
      assert.equal(reply.attachments[0].title, 'Sesame Street');
      assert.equal(reply.attachments[0].image_url, 'https://thumbnail.com/url');
      assert.equal(reply.attachments[0].title_link, 'https://www.youtube.com/watch?v=abc123');
      done();
    });
  });
});

function perform_search(controller, search_phrase, test) {
  var reply_callback = function(message, reply) {
    test(reply);
  };
  var bot = get_bot(TEST_BOT_NAME, reply_callback);
  var message = get_trigger_message(search_phrase);
  controller.run(bot, message);
}

function set_api_response(items) {
  var scope = nock('https://www.googleapis.com')
    .get('/youtube/v3/search')
    .query(true)
    .reply(200, {
      items: items,
    });
  return scope;
}

function get_response_item(videoId, title, thumbnail) {
  return {
    id: { videoId: videoId, },
    snippet: {
      title: title,
      thumbnails: {
        medium: { url: thumbnail, },
      },
    },
  };
}

function get_mock_controller() {
  var video_callback = null;
  return {
    hears: function(patterns, sources, callback) {
      video_callback = callback;
    },
    run: function(bot, message) {
      video_callback(bot, message);
    },
  };
}

function get_trigger_message(search_phrase) {
  return {
    match: [
      null, null, null, null,
      search_phrase
    ],
  };
}

function get_bot(name, reply_callback) {
  return {
    identity: { name: name },
    reply: reply_callback
  };
}
