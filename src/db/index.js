/*
 * @Descripttion: 连接mysql数据库入口模块
 * @Author: lukasavage
 * @Date: 2022-05-03 17:16:43
 * @LastEditors: lukasavage
 * @LastEditTime: 2022-05-03 17:25:16
 * @FilePath: \node-api-back\src\db\index.js
 */

// 导入mysql模块
const mysql = require('mysql2');

// 创建数据库连接对象
const db = mysql.createConnection({
	host: 'localhost', //域名
	port: 3306, //mysql的默认端口号
	database: 'my_first_database', //数据库名称
	user: 'root',
	password: 'tu141811',
});

module.exports = db;
