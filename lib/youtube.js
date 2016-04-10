var querystring = require ('querystring');
var https = require ('https');

var YouTube = function () {
  var BASE_VIDEO_URL = 'https://www.youtube.com/watch?v=';
  var API_HOST = 'www.googleapis.com';
  var ENDPOINT_SEARCH = '/youtube/v3/search';
  var RICK_ROLL_CHANCE = 0.01;

  function listen (api_key, controller) {
    controller.hears (['(video|youtube|vid|vj)( me)?( of|:)? (.*)'], 'direct_message,direct_mention,mention',
      function (bot, message) {
        var query = message.match[4];
        search (api_key, query, function (title, video_url, thumbnail_url) {
          var reply = {
            'username': bot.identity.name,
            'text': ':robot_face: Looks like you want to see a video about "' + query + '"...',
            'attachments': [{
              'fallback': title + "\n" + video_url,
              'title': title,
              'title_link': video_url,
              'image_url': thumbnail_url
            }]
          };
          bot.reply(message, reply);
        }, function () {
          bot.reply(message, ':frowning: I\'m so sorry. I\'m new at this, and I got confused!');
        });
    });
  }
  function search (api_key, query, success, error) {
    api_call (ENDPOINT_SEARCH, {
      part: 'snippet',
      order: 'rating',
      q: query,
      type: 'video',
      key: api_key
    }, function (response_object) {
      if (response_object && response_object.items.length) {
        for (var i = 0; i < response_object.items.length; i++) {
          try {
            var item = response_object.items[i];
            var id = item.id.videoId;
            var thumbnail = item.snippet.thumbnails.medium.url;
            var title = item.snippet.title;
            if (item && id && thumbnail && title) {
              if (random_rick_roll ()) {
                id = 'dQw4w9WgXcQ';
              }
              success (title, BASE_VIDEO_URL + id, thumbnail);
              break;
            }
          }
          catch (e) {
            //  swallow and continue to the next one
          }
        }
      } else {
        error ();
      }
    });
  }

  function api_call (endpoint, params, success) {
    var options = {
      host: API_HOST,
      port: 443,
      path: endpoint + '?' + querystring.stringify (params),
      method: 'GET',
      headers: {  accept: '*/*' }
    };
   	https.get (options, function (result) {
      var response_body = '';
      result.setEncoding ('utf8');
      result.on ('data', function (data) {
        response_body += data;
      });

      result.on ('end', function () {
        var response_object = JSON.parse (response_body);
        success (response_object);
      });
    });
  }

  function random_rick_roll () {
    return (Math.random () <= RICK_ROLL_CHANCE);
  }

  return {
    init: function (api_key, controller) {
      listen (api_key, controller);
    }
  };
}();

module.exports = YouTube;