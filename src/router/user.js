/*
 * @Descripttion: 路由模块 - 只存放客户端的请求与处理函数之间的映射关系
 * @Author: lukasavage
 * @Date: 2022-05-03 16:31:49
 * @LastEditors: lukasavage
 * @LastEditTime: 2022-05-04 15:45:24
 * @FilePath: \node-api-back\src\router\user.js
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRouter = express.Router();

const db = require('../db');
const config = require('../config/tokenKey');

userRouter.post('/regist', (req, res) => {
	const { username, password } = req.body;
	// 1.对表单中的数据，进行合法性校验
	if (!username || !password) {
		return res.send({
			code: 1,
			msg: '用户名或者密码不合法！',
		});
	}
	// 2.判断注册名是否被占用
	const sql = 'select * from user where username=?';
	db.query(sql, username, (err, result) => {
		console.log(result.affectedRows);
		// 执行SQL语句失败
		if (err) {
			return res.send({ code: 1, msg: err.message });
		}
		// 用户名被占用
		if (result.length) {
			return res.send({
				code: 1,
				msg: '用户名被占用,请更换其他用户名!',
			});
		}
		let newPassword;
		// 调用bcrypt.hashSync()对密码进行加密
		newPassword = bcrypt.hashSync(password, 10);

		// 插入用户数据
		const sql = 'insert into user set ?';
		db.query(sql, { username, password: newPassword }, (err, result) => {
			// 判断sql语句是否执行成功
			if (err) return res.send({ code: 1, msg: err.message });
			// 判断影响行数是否为1
			if (result.affectedRows !== 1)
				return res.send({ code: 1, msg: '注册用户失败，请稍后再试！' });
			// 注册用户成功
			res.send({ code: 0, msg: '注册成功！' });
		});
	});
});

userRouter.post('/login', (req, res) => {
	const sql = 'select * from user where username=?';
	db.query(sql, req.body.username, (err, result) => {
		if (err) return res.cc(err);
		// 执行SQL语句成功，但是获取到的数据条数不等于1
		if (result.length !== 1) return res.cc('登录失败！');

		// 判断密码是否正确
		const compareResult = bcrypt.compareSync(
			req.body.password,
			result[0].password
		);
		if (!compareResult) return res.cc('密码不正确!');
		// 最后一步，还需要在服务器端生成token的字符串
		const user = { ...result[0], user_pic: '', password: '' };
		const tokenStr = jwt.sign(user, config.jwtSecretKey, {
			expiresIn: '10h',
		});
		res.send({
			code: 0,
			msg: '登录成功',
			token: tokenStr,
		});
	});
});

module.exports = userRouter;
