"use strict"

class GPGPU {

    constructor ({gl, height, width}) {

        this.ready = false
        this.height = height
        this.width = width
        this.attribs = {}
        this.uniforms = {}
        this.textures = []

        this.standardGeometryVals = new Float32Array([
            -1.0,  1.0, 0.0, 0.0, 1.0,  // top left
            -1.0, -1.0, 0.0, 0.0, 0.0,  // bottom left
             1.0,  1.0, 0.0, 1.0, 1.0,  // top right
             1.0, -1.0, 0.0, 1.0, 0.0   // bottom right
        ])

        this.standardVertex = `
            attribute vec3 position;
            attribute vec2 textureCoord;

            varying highp vec2 vTextureCoord;

            void main() {
                gl_Position = vec4(position, 1.0);
                vTextureCoord = textureCoord;
            }
        `

        if (gl) {
            this.gl = gl
            this.height = gl.drawingBufferHeight
            this.width = gl.drawingBufferWidth
        } else {
            const canvas = document.createElement("canvas")
            canvas.width = width
            canvas.height = height
            this.gl = canvas.getContext("webgl", {premultipliedAlpha: false})
        }

        const textureFloat = this.gl.getExtension("OES_texture_float")

        if (!textureFloat) {
            alert("Floating point textures not supported")
        }
    }

    makeTexture (data, width=this.width, height=this.height) {

        this.textures.push(this.gl.createTexture())
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[this.textures.length-1])

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE)

        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.FLOAT, data)
    }

    makeFrameBuffer (width=this.width, height=this.height) {

        const texture = this.gl.createTexture()

        this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.FLOAT, null)
        this.gl.bindTexture(this.gl.TEXTURE_2D, null)

        this.framebuffer = this.gl.createFramebuffer()
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer)
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0)

        // Check the frameBuffer status
        const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER)

        if (status != this.gl.FRAMEBUFFER_COMPLETE) {
            switch (status) {
                case this.gl.FRAMEBUFFER_UNSUPPORTED:
                    throw("FRAMEBUFFER_UNSUPPORTED")
                case this.gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
                    throw("FRAMEBUFFER_INCOMPLETE_ATTACHMENT")
                case this.gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
                    throw("FRAMEBUFFER_INCOMPLETE_DIMENSIONS")
                case this.gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
                    throw("FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT")
                default:
                    throw(`Framebuffer error: ${status}`)
            }
        }
    }

    buildProgram (fragmentSource, vertexSource=this.standardVertex) {
        this.program = this.gl.createProgram()
        const vertex = this.compileShader(vertexSource, this.gl.VERTEX_SHADER)
        const fragment = this.compileShader(fragmentSource, this.gl.FRAGMENT_SHADER)

        this.gl.attachShader(this.program, vertex)
        this.gl.attachShader(this.program, fragment)

        this.gl.linkProgram(this.program)
        this.gl.deleteShader(fragment)
        this.gl.deleteShader(vertex)

        this.gl.useProgram(this.program)

        const standardGeometry = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, standardGeometry)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.standardGeometryVals, this.gl.STATIC_DRAW)
    }

    compileShader (source, type) {
        const shader = this.gl.createShader(type)
        this.gl.shaderSource(shader, source)
        this.gl.compileShader(shader)

        const compileStatus = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)

        if (!compileStatus) {
            throw `${type} compilation failed: ${this.gl.getShaderInfoLog(shader)}`
        }

        return shader
    }

    addAttrib (name, {numElements=3, stride=20, offset=0}={}) {
        this.gl.useProgram(this.program)
        this.attribs[name] = this.gl.getAttribLocation(this.program, name)
        this.gl.enableVertexAttribArray(this.attribs[name])
        this.gl.vertexAttribPointer(this.attribs[name], numElements, this.gl.FLOAT, this.gl.FALSE, stride, offset)
    }

    addUniform (name, value, type="uniform1f") {
        this.uniforms[name] = this.gl.getUniformLocation(this.program, name)

        if (value != undefined) {
            this.gl[type](this.uniforms[name], value)
        }
    }

    draw (texture=this.textures[this.textures.length-1]) {

        this.gl.activeTexture(this.gl.TEXTURE0)
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture)

        if (!this.ready) {

            this.ready = true
            this.addUniform("texture0", 0, "uniform1i")

            const texToAdd = texture==this.textures[this.textures.length-1] ? this.textures.length-1 : this.textures.length

            for (let t=0; t<texToAdd; t++) {
                this.gl.activeTexture(this.gl[`TEXTURE${t+1}`])
                this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[t])
                this.addUniform(`texture${t+1}`, t+1, "uniform1i")
            }

            this.gl.activeTexture(this.gl.TEXTURE0)
        }

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)
    }

    getPixels (startX=0, startY=0, spanX=this.width-startX, spanY=this.height-startY) {
        const buffer = new Float32Array(spanX * spanY * 4)
        this.gl.readPixels(startX, startY, spanX, spanY, this.gl.RGBA, this.gl.FLOAT, buffer)
        return buffer
    }

    delete () {
        this.gl.deleteProgram(this.program)
        this.gl.deleteFramebuffer(this.framebuffer)

        for (let t=0; t<this.textures.length; t++) {
            this.gl.deleteTexture(this.textures[t])
        }

        this.gl.getExtension("WEBGL_lose_context").loseContext()
        delete this.gl
    }
}