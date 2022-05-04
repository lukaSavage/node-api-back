# node-api-back

## 介绍
> 此项目是一个纯后台开发的项目，用到的技术栈是node.js + express + mysql + 其他中间件

## 值得关注的点：

### 1.注册

#### 1.1、检测用户是否被占用

​	1.1.1.导入数据库操作模块	

```js
const db = require('../db/index')
```

​	1.1.2.定义SQL语句

```js
const sql = 'select * from user where username=?'
```

​	1.1.3.执行SQL语句并根据结果判断用户名是否被占用

```js
db.query(sql, [userinfo.username], (err, result)=> {
    // 执行sql失败
    if(err) {
        return res.send({ status: 1, message: err.message })
    }
    // 用户名被占用
    if(result.length > 0) {
        return res.send({
            code: 1,
            msg: '用户名被占用，请更换其他用户名'
        })
    }
})
```

#### 1.2、对密码进行加密处理

> 为了保证密码的安全性，不建议在数据库以`明文`的形式保存用户密码，推荐对密码进行`加密存储`

在当前项目中，使用`bcryptjs`对用户进行加密，优点如下：

- 加密后的密码，无法被逆向破解
- 同一明文密码多次加密，得到的加密结果各不相同，保证了安全性。

使用步骤如下↓↓↓

​	1.2.1.安装bcryptjs

```bash
npm i bcryptjs
```

​	1.2.2在`/router/user.js`中导入bcryptjs：

```js
const bcrypt = require('bcryptjs')
```

​	1.2.3.在注册用户的处理函数中，确认用户名可用之后，调用`bcrypt.hashSync(明文密码，随机盐的长度)`方法，对用户密码进行加密处理

```js
// 对用户的密码，进行bcrype加密，返回值是加密之后的密码字符串
userinfo.password = bcrypt.hashSync(userinfo.password, 10)
```

#### 1.3、表单数据验证

> 在实际开发中，前后端都需要对表单的数据进行合法性的验证，而且，后端作为数据合法性验证的最后一个关口，在拦截非法数据方面，起到了至关重要的作用。但单纯的使用if else来验证效率低下，推荐使用第三方数据验证模块来提高效率。

1.3.1.安装@hapi/joi

​		TODO...

### 2.优化res.send()代码

> 在处理函数中，需要多次调用res.send() 想客户端响应`处理失败`的结果，为了简化diamante，可以手动封装一个res.cc()函数。

2.1.在app.js中，所有路由之前，声明一个全局中间件，为res对象挂载一个res.cc()函数。如下↓↓↓

```js
// 响应数据的中间件
app.use((req, res, next)=> {
    // code = 0 为成功; code = 1为失败; 默认将status的值设置为1，方便处理失败的情况
    res.cc = (err, code = 1) {
        res.send({
            code,
            msg: err instanceof Error ? err.msg : err
        })
    }
    next()
})
```

### 3.登录

#### 	3.1.实现步骤

```tex
1. 检测表单数据是否合法
2. 根据用户名查询用户的数据
3. 判断用户输入的密码是否正确
4. 生成JWT的token字符串
```

#### 	3.2判断用户密码是否正确

> 核心实现思路： 调用 `bcrypt.compareSync(用户提交的密码， 数据库中的密码)`方法比较密码是否正确，其返回值是布尔值(true: 一致，false: 不一致)；

```js
// 拿着用户输入的密码，和数据库中存储的密码进行对比
const compareResult = bcrypt.compareSync(userinfo.password, result[0].password)
// 如果对比的结果等于false,则证明用户输入的密码错误
if(!compareResult) {
    return res.cc('登录失败！')
}
// TODO: 登录成功，生成Token

```

### 4.生成JWT的token字符串

> 核心注意点：在生成token字符串的时候，因为token是保存在客户端的，所以一定要剔除 `密码` 和 `头像` 的值，

#### 	4.1.通过ES6高级语法，剔除 `密码` 和 `头像`的值：

```js
// 剔除完毕之后，user中保留了用户的id,username,nickname,email这四个属性的值
const user = { ...results[0], password: '', user_pic: '' }
```

#### 	4.2.运行如下的命令，安装生成Token字符串的包：

```bash
npm i jsonwebtoken
```

#### 	4.3.在 `/router/user.js`模块的头部区域，导入jsonwebtoken

```js
// 用这个包来生成 Token 字符串
const jwt = require('jsonwebtoken')
```

#### 	4.4.创建 `config.js` 文件，并向外共享加密和还原token的`jwtSecretKey`字符串

```
module.exports = {
	jwtSecretKey: 'suibian ^_^'
}
```

#### 	4.5.将用户信息对象加密成token字符串：

```js
// 导入配置文件
const config = require('../config')
// 生成token字符串
const tokenStr = jwt.sign(user, config.jwtSecretKey, {
    expiresIn: '10h' // token有效期10小时
})
res.send({
    code: 0,
    msg: '登录成功',
    token: tokenStr,
});
```

### 5.配置解析token的中间件

#### 	5.1.运行如下的命令，安装解析token的中间件：

```bash
npm i express-jwt
```

#### 	5.2.在 `app.js`中注册路由之前，配置解析token的中间件：

```js
// 导入配置文件
const config = require('./config')
// 解析token的中间件
const expressJWT = require('express-jwt')
// 使用.unless({ path: [/^\/api\//] })指定哪些接口不需要进行token身份验证
app.use(expressJWT({secret: config.jwtSecretKey})).unless({ path: [/^\/api\//] })
```

#### 	5.3.在app.js中的 `错误级别中间件`里面，捕获并处理token认证失败后的错误：

```js
// 错误中间件
app.use((err, req, res, next)=> {
    //...省略其他代码
    // 捕获身份认证失败的错误
    if(err.name === 'UnauthorizedError') return res.cc('身份认证失败')
})
```

