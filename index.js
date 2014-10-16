/**
 * author: fansekey@gmail.com
 * create time: 2014-10-16 14:11:44
 */

var Rewatch = require('Rewatch');
var debug = require('debug')('deploy');
var util = require('util');
var glob = require('glob');
var fs = require('fs');

function Deploy(files, command, options) {
    var me = this;
    me.root = options['root'] || process.cwd();
    Rewatch.apply(me, arguments);
    me.removeAllListeners('change');
    me.on('change', function(o) {
        if (me.delay) {
            setTimeout(function() {
                me.execute(o.file);
            }, me.delay);
        } else {
            me.execute(o.file);
        }
    });
}

util.inherits(Deploy, Rewatch);

Deploy.prototype.watch = function(file) {
    var me = this;
    if (~file.indexOf('*')) {
        glob(file, function(err, files) {
            files.forEach(function(file) {
                me.watch(file);
            });
        });
    } else {
        // fs.watch is not reliable
        // https://github.com/joyent/node/issues/3172
        fs.watchFile(file, {interval: me.interval}, function() {
            me.emit('change', {
                file: file
            });
        });
    }
};

Deploy.prototype.execute = function (file) {
    var me = this;
    var now = new Date();
    var spawn = require('child_process').spawn;

    var commands = me._command.split(/\s+/);
    if (!me._time || now - me._time > me.interval) {
        me._time = now;
        if (me._child && me.signal) {
            me._child.kill(me.singal);
        }

        me._child = spawn(commands[0], commands.slice(1), {
            cwd: me.root,
            change_file: file
        });
        me._child.stdout.pipe(process.stdout);
        me._child.stderr.pipe(process.stderr);
    }
}



module.exports = Deploy;
