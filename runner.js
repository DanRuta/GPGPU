"use strict"
// https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color

const fs = require("fs")
const {exec, execSync} = require("child_process")


let willExecute
let start
const watchers = []
const toChange = new Set()


const finish = () => {
    willExecute = false
    const elapsed = Date.now() - start
    console.log("\x1b[32m", "\x1b[1m", `\nDone\x1b[0m in \x1b[36m${elapsed/1000}s\x1b[0m at \x1b[36m${new Date().toTimeString().split(" ")[0]}\x1b[0m`, " Watching...\n")
}

const compile = () => {

    console.log("")
    start = Date.now()

    const tasks = []

    for (const dir of toChange) {
        const solNum = dir.split("\\")[0]

        tasks.push(new Promise((resolve, reject) => {

            // const command = `g++ -std=c++17 solutions/${solNum}/main.cpp -o solutions/${solNum}/out`
            const command = `C:/emsdk/emsdk_env.bat & echo Building... & emcc -o ./webassembly/webassemblyDemo.js ./webassembly/webassemblyDemo.cpp -O3 -s DISABLE_EXCEPTION_CATCHING=2 -s WASM=1 -s NO_EXIT_RUNTIME=1 -std=c++14`
            console.log(`[${solNum}] Running...  `, `\x1b[4m${command}\x1b[0m`)

            exec(command, (error, stdout, stderr) => {

                if (error) {
                    console.log("\n\x1b[31m", "\x1b[43m", "ERROR", "\x1b[0m Code:", error.code, "running", `\x1b[4m${command}\x1b[0m\n`)
                    console.log("\x1b[0m", new Error(error))
                    return void reject()
                }

                if (stdout) console.log(stdout)
                if (stderr) console.log(stderr)
                resolve()
            })
        }))


        toChange.delete(dir)
    }

    Promise.all(tasks).then(finish).catch(finish)
}


fs.watch("./", {recursive: true, persistent: true}, (eventType, filename) => {

    if (eventType=="change" && /\.(cpp|c|h|hpp)$/.test(filename) && !toChange.has(filename)) {
        if (!willExecute) {

            console.log(`\x1b[0m${filename}\x1b[0m`, "changed")

            toChange.add(filename)
            willExecute = true
            setTimeout(compile, 1000)
        }
    }
})


console.log("\x1b[32m", "\x1b[1m", "\nWatching...\x1b[0m")