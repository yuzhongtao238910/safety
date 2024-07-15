// 当用户登录后，返回一个标识 cookie
const express = require("express")
const app = express()
const path = require("path")
let bodyParser = require("body-parser")
let cookieParser = require("cookie-parser")

const svgCaptcha = require("svg-captcha")

app.use(express.static(path.join(__dirname, "public")))
app.use(express.static(path.join(__dirname)))
app.use(bodyParser.urlencoded({extended: true}))
app.use(cookieParser()) // req.cookies["connect.sid"]
let userList = [
	{
		username: "apple",
		password: "apple",
		money: 11111
	},
	{
		username: "238910",
		password: "238910",
		money: 33
	}
]
let SESSION_ID = "connect.sid"
let session = {}

app.post("/api/login", (req, res) => {
	let {
		username,
		password
	} = req.body
	console.log(username, password)
	let user = userList.find(user => {
		return user.username === username && user.password === password
	})
	if (user) {
		// 服务器需要在用户登录后，给一个信息 apple:110
		let cardId = Math.random() + Date.now()
		session[cardId] = {user}
		res.cookie(SESSION_ID, cardId, {
			httpOnly: false
		})
		res.json({
			code: 0
		})
	} else {
		res.json({
			code: 1,
			error: "用户不存在"
		})
	}
})
/*
Cookie：Cookie有一个明显的限制，即只能存储在设置Cookie的域名下，不能跨域使用。
Token：Token可以跨域使用，适用于分布式系统或跨域API请求。

为什么Token会比Cookie安全
 1- 加密与签名：
 	Token通常采用加密算法进行加密和签名，确保传输过程中的安全性，
 	并防止信息被篡改。而Cookie虽然也可以加密，但其加密和签名的机制通常不如Token严格。
 2- 验证机制：
 	Token的验证机制通常更加严格，如需要验证签名、过期时间等，
 	从而提高了整体的安全性。而Cookie的验证机制相对简单，容易被绕过。
 3- 跨域与存储位置：
 	Token可以跨域使用，并且不局限于存储在浏览器中，
 	这降低了被恶意软件攻击的风险。而Cookie存储在浏览器中，容易被恶意软件窃取或篡改。
 4- 有效期管理：
 	Token的有效期通常较短，需要频繁刷新，
 	这有助于减少安全风险。而Cookie的有效期可能很长，甚至永久有效，增加了被利用的风险。

*/
// 反射型 http://localhost:3000/welcome?type=<script>alert(document.cookie)</script>
// chrome 发现路径存在异常，会有xss脚本注入，浏览器会自动有屏蔽的功能
// 一般情况下：会让cookie在前端不可以获取，但是并不是解决xss的方案，但是并不是彻底解决xss的方案
// 只是降低受损的范围

// 诱导用户自己点开 一次性的，谁点开谁中招了


// 解决方案1： 查询参数可以加上：encodeURIComponent 方式解决
app.get("/welcome", (req, res) => {
	// 可以使用
	// encodeURIComponent
	res.send(`<h2>${encodeURIComponent(req.query.type)}</h2>`)
})


// 默认用户评论信息
let comments = [
{
	username: "apple",
	content: "welcome"
},
{
	username: "zhangsan",
	content: "xuanze"
}
]

app.get("/api/list", (req, res) => {
	res.json({
		code: 0,
		comments
	})
})

// xss 的存储形式 恶意的脚本存储到了服务器，所有人访问都会造成攻击的

app.post("/api/addcomment", (req, res) => {
	// 当你访问添加留言的时候
	let r = session[req.cookies[SESSION_ID]] || {} // {user: {username, password}}
	let user = r.user
	if (user) {
		// 前端发送过来的的内容是：<script>alert("1")<\/script>
		// 这个人登陆过
		comments.push({
			username: user.username,
			content: req.body.content
		})
		res.json({
			code: 0
		})
	} else {
		res.json({
			code: 1,
			error: "用户是没有登陆的"
		})
	}
})

app.get("/api/userinfo", (req, res) => {
	let r = session[req.cookies[SESSION_ID]] || {} // {user: {username, password}}
	let user = r.user
	// data 表示的是svg内容标识， text表示的是验证码对应的结果
	let {data, text} = svgCaptcha.create()
	r.text = text // 下次请求的时候 应该拿到返回的结果和上次存好的结果做对比

	if (user) {
		// 前端发送过来的的内容是：<script>alert("1")<\/script>
		// 这个人登陆过
		res.json({
			code: 0,
			user: {
				username: user.username,
				money: user.money,
				svg: data
			}
		})
	} else {
		res.json({
			code: 1,
			error: "用户是没有登陆的"
		})
	}
})
/*
1- 添加验证码 （体验不好）不是单纯的用户名字+密码
2- 判断来源refere 来源 如果是3001 -> 3000 那么肯定是伪造的
3- token的 第三方网站拿不到cookie的

如果两个都没有防护的话，就会造成生成比较严重的xsrf,就直接用了同源策略
xss+csrf => xsrf

*/
app.post("/api/transfer", (req, res) => {
	let r = session[req.cookies[SESSION_ID]] || {} // {user: {username, password}}
	let user = r.user

	// 直接判断来源  但是referer可以伪造 不靠谱，可以伪造的
	// let referer = req.headers["referer"] || ''
	// if (referer.includes("http://localhost:3000")) {

	// } else {
	// 	res.json({
	// 		code: 1,
	// 		error: "被别人攻击了"
	// 	})
	// 	return
	// }


	if (user) {
		// 前端发送过来的的内容是：<script>alert("1")<\/script>
		// 这个人登陆过
		let {target, money, code, token} = req.body
		// 'my_' + req.cookies[SESSION_ID] === token

		if ('my_' + req.cookies[SESSION_ID] !== token) {
			res.json({
				code: 1,
				error: "没有token"
			})
			return
		}

		if (code && code === r.text) {
			// 如果有验证码 并且验证码和我给你的一致，就说明是可以的
			money = Number(money)
		console.log(target, money)
		userList.forEach(u => {
			if (u.username === user.username) {
				u.money -= money
			}
			if (u.username === target) {
				u.money += money
			}
		})
		res.json({
			code: 0
		})
		} else {
			res.json({
				code: 1,
				error: "验证码不正确"
			})
		}
		
	} else {
		res.json({
			code: 1,
			error: "用户是没有登陆的"
		})
	}
})

// 什么是跨站脚本攻击啊？？？
// 跨站请求伪造 钓鱼网站
// 1- 有一个假的页面
// 2- 用户给一个吸引用户的网站

app.listen(3000)