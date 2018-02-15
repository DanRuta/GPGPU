"use strict"

let setupTimer
let timer

window.addEventListener("load", () => {

    let testData
    let mapSize
    let mapSpan
    let log = true
    let times = parseInt(counterInput.value)
    let charts = []

    const vals = [0,0,2,2,2,
                  1,1,0,2,0,
                  1,2,1,1,2,
                  0,1,2,2,1,
                  1,2,0,0,1]

    const kernelVals = [-1, 0,-1,
                         1, 0, 1,
                         1,-1, 0]

    const eg4Data = new Float32Array(vals.length * 4)
    const kernel = new Float32Array(kernelVals.length * 4)

    for (let i=0; i<vals.length; i++) {
        eg4Data[i*4] = vals[i]
    }

    for (let i=0; i<kernelVals.length; i++) {
        kernel[i*4] = kernelVals[i]
    }


    const generateData = () => {

        testData = new Float32Array(mapSize*4)

        for (let i=0; i<mapSize*4; i++) {
            testData[i] = i
        }
    }
    mapSize = 1024
    mapSpan = Math.sqrt(mapSize)
    generateData()

    window.runExample1GPU = () => {
        setupTimer = Date.now()

        const gpu = new GPGPU({height: mapSpan, width: mapSpan})
        gpu.makeFrameBuffer()
        gpu.makeTexture(testData)
        gpu.buildProgram(example1Fragment)

        gpu.addAttrib("position", {numElements: 3, stride: 20, offset: 0})
        gpu.addAttrib("textureCoord", {numElements: 2, stride: 20, offset: 12})
        timer = Date.now()

        for (let t=0; t<times; t++) {
            // testData[0]++
            // gpu.updateTexture(0, testData)
            // console.log(gpu.getPixels())
            gpu.draw()
        }

        const end = Date.now()

        if (log) {
            console.log(`Example 1 (GPU - ${times} times): `, gpu.getPixels(), `\nElapsed set-up: ${timer-setupTimer}\nElapsed run: ${end-timer}`)
        }

        gpu.delete()
        return [timer-setupTimer, end-timer]
    }

    window.runExample1JS = () => {
        timer = Date.now()

        const data = new Float32Array(mapSize*4)

        for (let t=0; t<times; t++) {
            for (let i=0; i<mapSize*4; i++) {
                data[i] = testData[i]
            }
        }

        if (log) {
            console.log("Example 1 (GPU) data:", data, `\nElapsed (${times} times): ${Date.now()-timer}`)
        }
        return [Date.now()-timer]
    }

    window.runExample1WAGPU = () => {
        setupTimer = Date.now()

        const result = ccallArrays("runExample1WAGPU", "array", ["array", "number"], [testData, times], {heapIn: "HEAPF32", heapOut: "HEAPF32", returnArraySize: mapSize*4})
        const setUpTime = Date.now() - setupTimer - waRunTime

        if (log) {
            console.log(`Example 1 (WA GPU - ${times} times): `, result, `\nElapsed set-up: ${setUpTime}\nElapsed run: ${waRunTime}`)
        }

        return [setUpTime, waRunTime]
    }

    window.runExample1WA = () => {
        setupTimer = Date.now()

        const result = ccallArrays("runExample1WA", "array", ["array", "number"], [testData, times], {heapIn: "HEAPF32", heapOut: "HEAPF32", returnArraySize: mapSize*4})
        const setUpTime = Date.now() - setupTimer - waRunTime

        if (log) {
            console.log(`Example 1 (WA - ${times} times): `, result, `\nElapsed set-up: ${setUpTime}\nElapsed run: ${waRunTime}`)
        }
        return [setUpTime, waRunTime]
    }

    window.runExample2GPU = () => {
        setupTimer = Date.now()

        const gpu = new GPGPU({height: mapSpan, width: mapSpan})
        gpu.makeFrameBuffer()
        gpu.makeTexture(testData)
        gpu.buildProgram(example2Fragment)

        gpu.addAttrib("position", {numElements: 3, stride: 20, offset: 0})
        gpu.addAttrib("textureCoord", {numElements: 2, stride: 20, offset: 12})

        timer = Date.now()

        for (let t=0; t<times; t++) {
            gpu.draw()
        }

        const end = Date.now()

        if (log) {
            console.log(`Example 2 (GPU - ${times} times): `, gpu.getPixels(), `\nElapsed set-up: ${timer-setupTimer}\nElapsed run: ${end-timer}`)
        }

        gpu.delete()
        return [timer-setupTimer, end-timer]
    }

    window.runExample2JS = () => {
        timer = Date.now()

        const data = new Float32Array(mapSize*4)

        for (let t=0; t<times; t++) {
            for (let i=0; i<mapSize*4; i++) {
                data[i] = testData[i] * testData[i]
            }
        }

        if (log) {
            console.log("Example 2 (JS) data:", data, `\nElapsed (${times} times): ${Date.now()-timer}`)
        }
        return [Date.now()-timer]
    }

    window.runExample2WAGPU = () => {
        setupTimer = Date.now()

        const result = ccallArrays("runExample2WAGPU", "array", ["array", "number"], [testData, times], {heapIn: "HEAPF32", heapOut: "HEAPF32", returnArraySize: mapSize*4})
        const setUpTime = Date.now() - setupTimer - waRunTime

        if (log) {
            console.log(`Example 2 (WA GPU - ${times} times): `, result, `\nElapsed set-up: ${setUpTime}\nElapsed run: ${waRunTime}`)
        }

        return [setUpTime, waRunTime]
    }

    window.runExample2WA = () => {
        setupTimer = Date.now()

        const result = ccallArrays("runExample2WA", "array", ["array", "number"], [testData, times], {heapIn: "HEAPF32", heapOut: "HEAPF32", returnArraySize: mapSize*4})
        const setUpTime = Date.now() - setupTimer - waRunTime

        if (log) {
            console.log(`Example 2 (WA - ${times} times): `, result, `\nElapsed set-up: ${setUpTime}\nElapsed run: ${waRunTime}`)
        }

        return [setUpTime, waRunTime]
    }


    window.runExample3GPU = () => {
        setupTimer = Date.now()

        const gpu = new GPGPU({height: mapSpan, width: mapSpan})
        gpu.makeFrameBuffer()
        gpu.makeTexture(testData)
        gpu.makeTexture(testData)
        gpu.makeTexture(testData)
        gpu.buildProgram(example3Fragment)

        gpu.addAttrib("position", {numElements: 3, stride: 20, offset: 0})
        gpu.addAttrib("textureCoord", {numElements: 2, stride: 20, offset: 12})

        gpu.addUniform("variable", parseFloat(varInput.value))

        timer = Date.now()

        for (let t=0; t<times; t++) {
            gpu.draw()
        }

        const end = Date.now()

        if (log) {
            console.log(`Example 3 (GPU - ${times} times): `, gpu.getPixels(), `\nElapsed set-up: ${timer-setupTimer}\nElapsed run: ${end-timer}`)
        }

        gpu.delete()
        return [timer-setupTimer, end-timer]
    }

    window.runExample3JS = () => {
        timer = Date.now()

        const data = new Float32Array(mapSize*4)
        let variable = parseFloat(varInput.value)

        for (let t=0; t<times; t++) {
            for (let i=0; i<mapSize*4; i++) {
                data[i] = testData[i] + testData[i] + testData[i] + variable
            }
        }

        if (log) {
            console.log("Example 3 (JS) data:", data, `\nElapsed (${times} times): ${Date.now()-timer}`)
        }
        return [Date.now()-timer]
    }

    window.runExample3WAGPU = () => {
        setupTimer = Date.now()

        let variable = parseFloat(varInput.value)
        const result = ccallArrays("runExample3WAGPU", "array", ["array", "number", "number"], [testData, variable, times], {heapIn: "HEAPF32", heapOut: "HEAPF32", returnArraySize: mapSize*4})
        const setUpTime = Date.now() - setupTimer - waRunTime

        if (log) {
            console.log(`Example 3 (WA GPU- ${times} times): `, result, `\nElapsed set-up: ${setUpTime}\nElapsed run: ${waRunTime}`)
        }

        return [setUpTime, waRunTime]
    }

    window.runExample3WA = () => {
        setupTimer = Date.now()

        let variable = parseFloat(varInput.value)
        const result = ccallArrays("runExample3WA", "array", ["array", "number", "number"], [testData, variable, times], {heapIn: "HEAPF32", heapOut: "HEAPF32", returnArraySize: mapSize*4})
        const setUpTime = Date.now() - setupTimer - waRunTime

        if (log) {
            console.log(`Example 3 (WA - ${times} times): `, result, `\nElapsed set-up: ${setUpTime}\nElapsed run: ${waRunTime}`)
        }

        return [setUpTime, waRunTime]
    }


    window.runExample4GPU = () => {
        setupTimer = Date.now()

        const gpu = new GPGPU({height: 5, width: 5})
        gpu.makeFrameBuffer()
        gpu.makeTexture(eg4Data)
        gpu.makeTexture(kernel, 3, 3)
        gpu.buildProgram(example4Fragment)

        gpu.addAttrib("position", {numElements: 3, stride: 20, offset: 0})
        gpu.addAttrib("textureCoord", {numElements: 2, stride: 20, offset: 12})
        gpu.addUniform("w", 1/5)

        timer = Date.now()

        for (let t=0; t<times; t++) {
            gpu.draw()
        }

        const end = Date.now()
        const expected = [[-1,2,3,2,4], [0,-2,2,-4,-1], [1,0,-1,3,0], [-2,-1,2,0,0], [1,-1,-1,-2,-2]]

        if (log) {
            console.log(`Example 4 (GPU - ${times} times): `, gpu.getPixels(), `\nElapsed set-up: ${timer-setupTimer}\nElapsed run: ${end-timer}`)
        }

        gpu.delete()
        return [timer-setupTimer, end-timer]
    }


    window.runExample4JS = () => {
        const data = new Float32Array(5*5*4)
        timer = Date.now()
        const inputSpan = 5
        const kSpan = 3
        const spread = 1

        for (let t=0; t<times; t++) {
            // For every pixel
            for (let y=0; y<inputSpan; y++) {
                for (let x=0; x<inputSpan; x++) {

                    let sum = 0
                    const n = []

                    // Gather input data
                    for (let j=-spread; j<=spread; j++) {
                        for (let k=-spread; k<=spread; k++) {

                            const yCoord = y + j
                            const xCoord = x + k

                            if (yCoord >= 0 && yCoord < inputSpan &&
                                xCoord >= 0 && xCoord < inputSpan) {
                                n[(j+spread)*kSpan+(k+spread)] = eg4Data[(yCoord*inputSpan + xCoord) * 4]
                            } else {
                                n[(j+spread)*kSpan+(k+spread)] = 0
                            }
                        }
                    }

                    for (let j=0; j<kSpan; j++) {
                        for (let k=0; k<kSpan; k++) {
                            sum += kernel[(j*kSpan+k) * 4] * n[j*kSpan+k]
                        }
                    }

                    data[(y*inputSpan+x) * 4 ] = sum
                }
            }
        }

        if (log) {
            console.log("Example 4 (JS) data:", data, `\nElapsed (${times} times): ${Date.now()-timer}`)
        }

        return [Date.now()-timer]
    }

    window.runExample4WAGPU = () => {
        setupTimer = Date.now()

        const result = ccallArrays("runExample4WAGPU", "array", ["array", "array", "number"], [eg4Data, kernel, times], {heapIn: "HEAPF32", heapOut: "HEAPF32", returnArraySize: 100})
        const setUpTime = Date.now() - setupTimer - waRunTime

        if (log) {
            console.log(`Example 4 (WA GPU - ${times} times): `, result, `\nElapsed set-up: ${setUpTime}\nElapsed run: ${waRunTime}`)
        }

        return [setUpTime, waRunTime]
    }

    window.runExample4WA = () => {
        setupTimer = Date.now()

        const result = ccallArrays("runExample4WA", "array", ["array", "array", "number"], [eg4Data, kernel, times], {heapIn: "HEAPF32", heapOut: "HEAPF32", returnArraySize: 100})
        const setUpTime = Date.now() - setupTimer - waRunTime

        if (log) {
            console.log(`Example 4 (WA - ${times} times): `, result, `\nElapsed set-up: ${setUpTime}\nElapsed run: ${waRunTime}`)
        }

        return [setUpTime, waRunTime]
    }



    example1GPU.addEventListener("click", runExample1GPU)
    example1JS.addEventListener("click", runExample1JS)
    example1WAGPU.addEventListener("click", runExample1WAGPU)
    example1WA.addEventListener("click", runExample1WA)

    example2GPU.addEventListener("click", runExample2GPU)
    example2JS.addEventListener("click", runExample2JS)
    example2WAGPU.addEventListener("click", runExample2WAGPU)
    example2WA.addEventListener("click", runExample2WA)

    example3GPU.addEventListener("click", runExample3GPU)
    example3JS.addEventListener("click", runExample3JS)
    example3WAGPU.addEventListener("click", runExample3WAGPU)
    example3WA.addEventListener("click", runExample3WA)

    example4GPU.addEventListener("click", runExample4GPU)
    example4JS.addEventListener("click", runExample4JS)
    example4WAGPU.addEventListener("click", runExample4WAGPU)
    example4WA.addEventListener("click", runExample4WA)


    mapSizeInput.addEventListener("change", () => {
        mapSize = parseInt(mapSizeInput.value)
        generateData()
    })

    mapSizeInput.addEventListener("keyup", () => {
        mapSize = parseInt(mapSizeInput.value)
        generateData()
    })

    counterInput.addEventListener("change", () => {
        times = parseInt(counterInput.value)
        generateData()
    })

    counterInput.addEventListener("keyup", () => {
        times = parseInt(counterInput.value)
        generateData()
    })

    const makeChart = () => {

        const canvas = document.createElement("canvas")
        canvas.width = window.innerWidth * 0.9
        canvas.height = 300

        return [canvas, new Chart(canvas.getContext("2d"), {
            type: "line",
            data: {
                datasets: [{
                    label: "GPU",
                    borderColor: "rgba(150, 26, 31, 0.5)",
                    backgroundColor: "rgba(150, 26, 31, 0.5)",
                    data: [],
                    pointRadius: 0
                },{
                    label: "GPU (set-up time)",
                    borderDash: [5, 5],
                    borderColor: "rgba(150, 26, 31, 0.5)",
                    backgroundColor: "rgba(150, 26, 31, 0.5)",
                    fill: false,
                    data: [],
                    pointRadius: 0
                },{
                    label: "JS",
                    borderColor: "rgba(250, 222, 52, 0.5)",
                    backgroundColor: "rgba(250, 222, 52, 0.5)",
                    data: [],
                    pointRadius: 0
                },{
                    label: "WebAssembly + GPU (set-up time)",
                    borderDash: [5, 5],
                    borderColor: "rgba(126, 53, 136, 0.5)",
                    backgroundColor: "rgba(126, 53, 136, 0.5)",
                    fill: false,
                    data: [],
                    pointRadius: 0
                },{
                    label: "WebAssembly + GPU",
                    borderColor: "rgba(126, 53, 136, 0.5)",
                    backgroundColor: "rgba(126, 53, 136, 0.5)",
                    data: [],
                    pointRadius: 0
                },{
                    label: "WebAssembly",
                    borderColor: "rgba(101, 79, 240, 0.5)",
                    backgroundColor: "rgba(101, 79, 240, 0.5)",
                    data: [],
                    pointRadius: 0
                },{
                    label: "WebAssembly (set-up time)",
                    borderDash: [5, 5],
                    borderColor: "rgba(101, 79, 240, 0.5)",
                    backgroundColor: "rgba(101, 79, 240, 0.5)",
                    fill: false,
                    data: [],
                    pointRadius: 0
                }]
            },
            options: {
                scales: {
                    xAxes: [{
                        type: "linear",
                        position: "bottom"
                    }],
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        }
                    }]
                },
                tooltips: {
                    enabled: false
                },
                responsive: false
            }
        })]
    }

    const plot = (i, chartI, egI) => {
        log = false
        times = Math.min(Math.floor(Math.pow(2, i/6)), parseInt(maxPlotItsInput.value))
        const [setUp, elapsed] = window[`runExample${egI+1}GPU`]()
        const [jsElapsed] = window[`runExample${egI+1}JS`]()
        const [waGPUSetUp, waGPUElapsed] = window[`runExample${egI+1}WAGPU`]()

        charts[chartI].data.datasets[0].data.push({x: times, y: elapsed})
        charts[chartI].data.datasets[1].data.push({x: times, y: setUp})
        charts[chartI].data.datasets[2].data.push({x: times, y: jsElapsed})
        charts[chartI].data.datasets[3].data.push({x: times, y: waGPUSetUp})
        charts[chartI].data.datasets[4].data.push({x: times, y: waGPUElapsed})

        if (window[`runExample${egI+1}WA`]) {
            const [waSetUp, waElapsed] = window[`runExample${egI+1}WA`]()
            charts[chartI].data.datasets[5].data.push({x: times, y: waElapsed})
            charts[chartI].data.datasets[6].data.push({x: times, y: waSetUp})
        }

        charts[chartI].update()

        if (++i<=100) {
            setTimeout(() => plot(i, chartI, egI), 0)
        } else {
            if (chartI<charts.length-1) {
                setTimeout(() => plot(25, chartI+1, egI+1), 0)
            } else {
                times = parseInt(counterInput.value)
                log = true
            }
        }
    }

    benchmarkExample1Button.addEventListener("click", () => {
        const [iterationsCanvas, identityChart] = makeChart()
        identityChartIterations.innerHTML = ""
        identityChartIterations.appendChild(iterationsCanvas)
        charts = [identityChart]
        plot(25, 0, 0)
    })

    benchmarkExample2Button.addEventListener("click", () => {
        const [quadraticCanvas, quadraticChart] = makeChart()
        quadraticChartIterations.innerHTML = ""
        quadraticChartIterations.appendChild(quadraticCanvas)
        charts = [quadraticChart]
        plot(25, 0, 1)
    })


    benchmarkExample3Button.addEventListener("click", () => {
        const [ewAdd3p1Canvas, ewAdd3p1Chart] = makeChart()
        ewAdd3p1ChartIterations.innerHTML = ""
        ewAdd3p1ChartIterations.appendChild(ewAdd3p1Canvas)
        charts = [ewAdd3p1Chart]
        plot(25, 0, 2)
    })

    benchmarkExample4Button.addEventListener("click", () => {
        const [conv3x3_5x5Canvas, conv3x3_5x5Chart] = makeChart()
        conv3x3_5x5ChartIterations.innerHTML = ""
        conv3x3_5x5ChartIterations.appendChild(conv3x3_5x5Canvas)
        charts = [conv3x3_5x5Chart]
        plot(25, 0, 3)
    })

    plotBenchmarkButton.addEventListener("click", () => {
        charts = []

        const [iterationsCanvas, identityChart] = makeChart()
        identityChartIterations.innerHTML = ""
        identityChartIterations.appendChild(iterationsCanvas)

        const [quadraticCanvas, quadraticChart] = makeChart()
        quadraticChartIterations.innerHTML = ""
        quadraticChartIterations.appendChild(quadraticCanvas)

        const [ewAdd3p1Canvas, ewAdd3p1Chart] = makeChart()
        ewAdd3p1ChartIterations.innerHTML = ""
        ewAdd3p1ChartIterations.appendChild(ewAdd3p1Canvas)

        const [conv3x3_5x5Canvas, conv3x3_5x5Chart] = makeChart()
        conv3x3_5x5ChartIterations.innerHTML = ""
        conv3x3_5x5ChartIterations.appendChild(conv3x3_5x5Canvas)

        charts.push(identityChart)
        charts.push(quadraticChart)
        charts.push(ewAdd3p1Chart)
        charts.push(conv3x3_5x5Chart)

        plot(25, 0, 0)
    })
})