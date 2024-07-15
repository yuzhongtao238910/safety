// 当用户登录后，返回一个标识 cookie
const express = require("express")
const app = express()
const path = require("path")
let bodyParser = require("body-parser")
let cookieParser = require("cookie-parser")

app.use(express.static(path.join(__dirname, "public")))
app.use(express.static(path.join(__dirname)))
app.use(bodyParser.urlencoded({extended: true}))
app.use(cookieParser()) // req.cookies["connect.sid"]


// 跨站请求伪造 钓鱼网站
// 1- 有一个假的页面
// 2- 用户给一个吸引用户的网站

// 3001 是盗版的网站
app.listen(3001)