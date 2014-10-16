/**
 * author: fansekey@gmail.com
 */

'use strict';

var path = require('path');
var fs = require('fs');
var glob = require('glob');
var Url = require('url');

function now(){
    var d = new Date(), str;
    str = [
        d.getHours(),
        d.getMinutes(),
        d.getSeconds()
    ].join(':').replace(/\b\d\b/g, '0$&');
    return str;
};


function parseUrl(url, opt){
    opt = opt || {};
    url = Url.parse(url);
    var ssl = url.protocol === 'https:';
    opt.host = opt.host
        || opt.hostname
        || ((ssl || url.protocol === 'http:') ? url.hostname : 'localhost');
    opt.port = opt.port || (url.port || (ssl ? 443 : 80));
    opt.path = opt.path || (url.pathname + (url.search ? url.search : ''));
    opt.method = opt.method || 'GET';
    opt.agent = opt.agent || false;
    return opt;
}

function map(obj, callback, merge){
    var index = 0;
    for(var key in obj){
        if(obj.hasOwnProperty(key)){
            if(merge){
                callback[key] = obj[key];
            } else if(callback(key, obj[key], index++)) {
                break;
            }
        }
    }
}

function upload(url, opt, data, content, subpath, callback){
    if(typeof content === 'string'){
        content = new Buffer(content, 'utf8');
    } else if(!(content instanceof  Buffer)){
        throw new Error('unable to upload content [' + (typeof content) + ']');
    }
    data = data || {};
    var endl = '\r\n';
    var boundary = '-----np' + Math.random();
    var collect = [];
    map(data, function(key, value){
        collect.push('--' + boundary + endl);
        collect.push('Content-Disposition: form-data; name="' + key + '"' + endl);
        collect.push(endl);
        collect.push(value + endl);
    });
    collect.push('--' + boundary + endl);
    collect.push('Content-Disposition: form-data; name="file"; filename="' + subpath + '"' + endl);
    collect.push(endl);
    collect.push(content);
    collect.push('--' + boundary + '--' + endl);

    var length = 0;
    collect.forEach(function(ele){
        length += ele.length;
    });

    opt = opt || {};
    opt.method = opt.method || 'POST';
    opt.headers = {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': length
    };
    opt = parseUrl(url, opt);
    var http = opt.protocol === 'https:' ? require('https') : require('http');
    var req = http.request(opt, function(res){
        var status = res.statusCode;
        var body = '';
        res
        .on('data', function(chunk){
            body += chunk;
        })
    .on('end', function(){
        if(status >= 200 && status < 300 || status === 304){
            callback(null, body);
        } else {
            callback(status);
        }
    })
    .on('error', function(err){
        callback(err.message || err);
    });
    });
    collect.forEach(function(d){
        req.write(d);
        if(d instanceof Buffer){
            req.write(endl);
        }
    });
    req.end();
}

(function main() {
    var root = process.cwd();

    var config = path.join(root, 'deploy.js');
    var opts = require(config);

    for (var i = 0, len = opts.length; i < len; i++) {
        var node = opts[i];
        var dir = path.join(root, node.from);
        glob(dir + '**', function (err, files) {
            if (err) {
                throw err;
            }
            for (var k = 0, ll = files.length; k < ll; k++) {
                var file = files[k];
                var subpath = '/' + file.replace(dir, '');
                var stat = fs.statSync(file);
                if (!stat.isFile()) {
                    continue;
                }
                (function (file, subpath) {
                    fs.readFile(file, function (err, content) {
                        if (err) {
                            throw err;
                        }
                        var to = path.join(node.to, subpath);
                        upload(
                            node['receiver'], 
                            {}, 
                            {
                                to: to
                            }, 
                            content, 
                            subpath,
                            function (err, body) {
                                if (err) {
                                    throw new Error(err);
                                }
                                console.log('[', now(), '] upload file ', file, ' > ', to, 'success');
                            }
                            );  
                    });
                })(file, subpath);
            }
        });
    }
})();
