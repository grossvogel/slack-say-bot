var PATTERN_ADD = '(new|add|save) task (.*)';
var PATTERN_SHOW = '((list|show) )?(my )?((outstanding|pending|incomplete|completed|finished|done) )?tasks';
var PATTERN_ACTION = '(delete|complete) task ((C-)?([0-9]+))';

function listen(controller) {
  controller.hears([PATTERN_ADD],
  'direct_message,direct_mention,mention',
    function(bot, message) {
      var task = message.match[2];
      add_task(controller, message.user, task, function() {
        bot.reply(message, 'Created a task "' + task + '"');
      });
    }
  );

  controller.hears([PATTERN_SHOW],
  'direct_message,direct_mention,mention',
    function(bot, message) {
      var completed = false;
      if (message.match[5]) {
        var type = message.match[5].toLowerCase();
        if (type == 'completed' || type == 'finished' || type == 'done') {
          completed = true;
        }
      }
      show_tasks(controller, bot, message, completed);
    }
  );

  controller.hears([PATTERN_ACTION],
  'direct_message,direct_mention,mention',
    function(bot, message) {
      var task_number = message.match[4];
      var completed = !!(message.match[3] && message.match[3].toLowerCase() == 'c-');
      var deleting = message.match[1].toLowerCase() == 'delete';
      if (deleting) {
        delete_task(controller, message.user, task_number, completed, function(task_name) {
          bot.reply(message, ':robot_face: Deleted task number ' + task_number + ': *' + task_name + '*');
          show_tasks(controller, bot, message, completed);
        }, function(error_reply) {
          bot.reply(message, error_reply);
        });
      } else {
        if (completed) {
          bot.reply(message, ':robot_face: That task is already completed');
        } else {
          complete_task(controller, message.user, task_number, completed, function(task_name) {
            bot.reply(message, ':robot_face: Completed task number ' + task_number + ': *' + task_name + '*');
            show_tasks(controller, bot, message, completed);
          }, function(error_reply) {
            bot.reply(message, error_reply);
          });
        }
      }
    }
  );

  //  @TODO: assign tasks to others
  //  @TODO: edit tasks
  //  @TODO: re-order tasks?
  //  @TODO: TESTS!!!
}

function show_tasks(controller, bot, message, completed) {
  get_tasks(controller, message.user, function(tasks) {
    var type = completed ? 'completed' : 'pending';
    var reply = ':robot_face: Your ' + type + ' tasks:\n';
    if (tasks.length > 0) {
      var count = 0;
      for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i];
        if (task.completed == completed) {
          var prefix = completed ? 'C-' : '';
          reply += '[' + prefix + ++count + '] ' + task.name + '\n';
        }
      }
    }
    if (count == 0) {
      var reply = ':robot_face: You don\'t have any ' + type + ' tasks.\n' +
        'Say *new task XYZ* to create a new task called XYZ';
    } else {
      var task_number = completed ? 'C-{n}' : '{n}';
      reply += 'To complete a task, say *complete task ' + task_number + '* using the numbers above\n';
      reply += 'To delete a task, say *delete task ' + task_number + '* using the numbers above\n';
      if (!completed) {
        reply += 'To view completed tasks, say *completed tasks*\n';
      }
    }
    bot.reply(message, reply);
  });
}

function add_task(controller, user, task, callback) {
  get_tasks(controller, user, function(tasks) {
    tasks.push({
      name: task,
      completed: false,
    });
    save_tasks(controller, user, tasks, callback);
  });
}

function delete_task(controller, user, task_number, completed, success, failure) {
  operate_on_task(controller, user, task_number, completed, success, failure, function(tasks, index) {
    tasks.splice(index, 1);
  });
}

function complete_task(controller, user, task_number, completed, success, failure) {
  operate_on_task(controller, user, task_number, completed, success, failure, function(tasks, index) {
    tasks[index].completed = true;
  });
}

function operate_on_task(controller, user, task_number, completed, success, failure, action) {
  get_tasks(controller, user, function(tasks) {
    var matching_count = 0;
    var task_index = null;
    var task_name = null;
    for (var i = 0; i < tasks.length; i++) {
      if (tasks[i].completed == completed) {
        if (matching_count == (task_number - 1)) {
          task_index = i;
          task_name = tasks[i].name;
          break;
        }
        matching_count++;
      }
    }
    if (task_index !== null) {
      action(tasks, task_index);
      save_tasks(controller, user, tasks, function() { success(task_name); });
    } else {
      failure(':robot_face: I\'m sorry, I couldn\'t find task number ' + task_number);
    }
  });
}

function get_tasks(controller, user, callback) {
  controller.storage.users.get(storage_key(user), function(err, data) {
    if (err) {
      console.log(err);
    }
    var tasks = data ? data.tasks : [];
    callback(tasks);
  });
}

function save_tasks(controller, user, tasks, callback) {
  var data = {
    id: storage_key(user),
    tasks: tasks,
  };
  controller.storage.users.save(data, function() {
    if (typeof callback == 'function') {
      callback();
    }
  });
}

function storage_key(user) {
  return 'tasks:' + user;
}

module.exports = {
  init: function(controller) {
    listen(controller);
  },
  get_tasks: get_tasks,
  PATTERN_ADD: PATTERN_ADD,
  PATTERN_SHOW: PATTERN_SHOW,
  PATTERN_ACTION: PATTERN_ACTION,
};
