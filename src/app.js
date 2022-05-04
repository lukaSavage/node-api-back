/*
 * @Descripttion: 后台接口入口
 * @Author: lukasavage
 * @Date: 2022-05-03 16:31:49
 * @LastEditors: lukasavage
 * @LastEditTime: 2022-05-04 16:24:20
 * @FilePath: \node-api-back\src\app.js
 */
const express = require('express');
const cors = require('cors');
const { expressjwt } = require('express-jwt');

const userRouter = require('./router/user');
const db = require('./db');
const config = require('./config/tokenKey');

const app = express();

// 解决跨域
app.use(cors());
// 解析表单
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
	expressjwt({ secret: config.jwtSecretKey }).unless({ path: [/^\/api\//] })
);

// 在路由模块之前添加一个自定义错误处理中间件
// 响应数据的中间件
app.use((req, res, next) => {
	// code = 0 为成功; code = 1为失败; 默认将status的值设置为1，方便处理失败的情况
	res.cc = (msg, code = 1) => {
		res.send({
			code,
			msg: msg instanceof Error ? msg.msg : msg,
		});
	};
	next();
});
// 路由模块
app.use('/api', userRouter);

app.get('/a', (req, res) => {
	db.query('select * from user', (err, result) => {
		if (err) return res.cc(err);
		res.cc(result, 0);
	});
});

// 定义错误级别中间件
app.use((err, req, res, next) => {
    // 身份认证失败后导致的错误
    if(err.name === 'UnauthorizedError') return res.cc('身份认证失败！')
    // 未知的错误
    res.cc(err)
});

app.listen(9999, () =>
	console.log(`服务器启动成功!请访问 http://localhost:9999`)
);
