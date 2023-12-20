"use strict"

const fs = require("fs")
const http = require("http")
const express = require("express")

var app = express()
app.use(express.static("./public"))
app.use(express.urlencoded({ extended: false }))

http.createServer(app).listen(8000)

var show_clients = []

var show_url = "photo-camera.svg"

function update_show_clients() {
	for (let res of show_clients) {
		res.write("event: show\n")
		res.write("data: " + JSON.stringify(show_url) + "\n\n")
	}
}

app.get("/list", function (req, res) {
	console.log("LIST")
	let list = []
	for (let path of fs.readdirSync("./public/pictures")) {
		list.push("pictures/" + path)
	}
	res.json(list)
})

app.post("/show", function (req, res) {
	console.log("SHOW", JSON.stringify(req.body))
	show_url = req.body.url
	update_show_clients()
	res.send("SUCCESS")
})

app.get("/show-events", function (req, res) {
	console.log("SHOW-EVENTS OPEN")

	res.setHeader("Content-Type", "text/event-stream")
	res.setHeader("Connection", "keep-alive")

	// nedan behövs om man använder en reverse-proxy
	res.setHeader("X-Accel-Buffering", "no")

	show_clients.push(res)

	res.on("close", function () {
		console.log("SHOW-EVENTS CLOSE")
		let i = show_clients.indexOf(res)
		if (i >= 0)
			show_clients.splice(i, 1)
	})

	res.write("retry: 5000\n\n")
	res.write("event: show\n")
	res.write("data: " + JSON.stringify(show_url) + "\n\n")
})
