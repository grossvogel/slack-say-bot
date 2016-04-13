var Test = require('./helper');
var Tasks = require('../lib/tasks');

describe('Tasks', function() {
  it('should have an init function', function() {
    Test.assert.equal(typeof Tasks.init, 'function');
  });

  it('should initialize using a mock controller', function() {
    var controller = Test.get_mock_controller();
    Tasks.init(controller);
  });

  it('should create a task', function(done) {
    var controller = Test.get_mock_controller();
    var task_name = 'Task Number One';
    var test_message = get_add_message(task_name);
    Tasks.init(controller);
    Test.test_bot_reply(controller, Tasks.PATTERN_ADD, test_message, function(reply) {
      Test.assert.equal(reply, 'Created a task "' + task_name + '"');
      Tasks.get_tasks(controller, test_message.user, function(tasks) {
        Test.assert.equal(tasks.length, 1);
        Test.assert.equal(tasks[0].name, task_name);
        done();
      });
    });
  });
});

function get_add_message(task_name) {
  return Test.get_message([
    'new task ' + task_name,
    'new', task_name,
  ]);
}

function get_action_message(action, completed, task_number) {
  var full_match_base = action + ' task ';
  var c_match = undefined;
  if (completed) {
    full_match_base += 'C-';
    c_match = 'C-';
  }
  return Test.get_message([
    full_match_base + task_number,
    action, null, c_match, task_number
  ]);
}

function get_show_message(completed) {
  return Test.get_message([
    completed ? 'completed tasks' : 'tasks',
    null, null, null, null,
    completed ? 'completed' : undefined,
  ]);
}

