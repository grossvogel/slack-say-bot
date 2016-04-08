
if (!process.env.token) {
  console.log ('Error: "token" expected in environment!');
  process.exit (1);
}

var Botkit = require ('botkit');
var os = require ('os');

var controller = Botkit.slackbot ({
  debug:true
});
var bot = controller.spawn({
  token: process.env.token
}).startRTM ();

controller.hears (['hello', 'hi', 'sup'], 'direct_message,direct_mention,mention',
  function (bot, message) {
    bot.api.reactions.add({
      timestamp: message.ts,
      channel: message.channel,
      name: 'robot_face'
    }, function (err, res) {
      if (err) {
        bot.botkit.log ('Failed to add emoji reaction to "hi" message', err);
      }
    });
});

controller.hears (['uptime', 'who are you', 'what is your name'],
  'direct_message,direct_mention,mention', function (bot, message) {
    var hostname = os.hostname ();
    var uptime = process.uptime ();
    bot.reply(message,
      ':robot_face: I am a bot named <@' + bot.identity.name + '>.' +
      'I have been running for ' + uptime + ' seconds on ' + hostname + '.'
    );
});

controller.hears (['say:? (.*)'], 'direct_message,direct_mention,mention',
  function (bot, message) {
    bot.reply(message,
      ':robot_face: ' + message.match[1] + "\n\n" +
      '(Stop toying with me... I\'m just a helpless bot!)'
    );
});
