### deploy.js

### install

```
npm install -g deploy.js
```

### use

➜  deploy git:(master) ✗ deploy -h
```
    Usage:
      deploy -r <dir>

    Options:
      -r, --root      set root path
      -v, --version   print the version of deploy
      -h, --help      display this message

    Examples:
      deploy -r /home/user/dir
```

- 服务端部署 receiver

    参见[fex-team/receiver](https://github.com/fex-team/receiver)

- 想上传部署的目录下放置配置文件 `deploy.js`

    :deploy.js:
    ```javascript
    module.exports = [
        {
            receiver: 'http://127.0.0.1:8999/receiver',
            from: '/',
            to: '/home/work/www'
        }
    ];
    ```

    > 具体配置可以参考FIS 2.x 的`deploy`配置方式
