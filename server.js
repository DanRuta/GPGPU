"use strict"

const http = require("http")
const fs = require("fs")
const url = require("url")

http.createServer((request, response) => {

    let path = url.parse(request.url).pathname
    let data

    path = (path=="/"?"/index.html":path)

    console.log(path)

    switch(path){
        case "/webassemblyDemo.wasm":
            try{
                data = fs.readFileSync(__dirname+"/webassembly"+path)
            }catch(e){}
            break
        default:
            try{
                data = fs.readFileSync(__dirname+path, "utf8")
            }catch(e){}
    }

    response.end(data)

}).listen(1337, () => console.log("Server Listening on port 1337"))

