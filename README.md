# GPGPU

Small library for running arbitrary calculations on the GPU, using JavaScript or WebAssembly.

## Usage
Check the ```example/script.js``` file for a few examples for both JavaScript and WebAssembly, as well as some benchmarks for a few examples, to see which one will suit your needs most.

### Common
The general structure of the set up code is as follows:
1. Define the GPGPU instance with the size (and context, optionally)
2. Create the framebuffer (with optional custom dimensions). This is the outgoing array of data.
3. Add your textures (arrays)
4. Build program with your shader(s)
5. Add any attribs/uniform variables you need in your shaders
6. Run the computations (draw)
7. Update the texture data, if needed
8. Read the data
9. Delete to clean up

##### Quick JavaScript example:
```javascript
const testData = new Float32Array(100*4)

for (let i=0; i<100*4; i++) {
    testData[i] = i
}
// 1
const gpu = new GPGPU({height: 100, width: 100})
// 2
gpu.makeFrameBuffer()
// 3
gpu.makeTexture(testData)
// 4
gpu.buildProgram(`
        precision highp float;

        uniform sampler2D texture;
        varying vec2 vTextureCoord;

        void main() {
            gl_FragColor = texture2D(texture, vTextureCoord);
        }`)
// 5
gpu.addAttrib("position", {numElements: 3, stride: 20, offset: 0})
gpu.addAttrib("textureCoord", {numElements: 2, stride: 20, offset: 12})
// 6
gpu.draw()
// 7
testData[0]++
gpu.updateTexture(0, testData)
gpu.draw()
// 8
const results = gpu.getPixels()
// 9
gpu.delete()
```

##### Quick WebAssembly (C++) example:
*Note: Currently, when using the WebAssembly version, you must currently have a canvas element on the page (can be hidden with CSS) with id ```theCanvas```. In the future this hopefully shouldn't be required.*
```C++
std::string example1Fragment = R"V0G0N(
    precision highp float;

    uniform sampler2D texture;
    varying vec2 vTextureCoord;

    void main() {
        gl_FragColor = texture2D(texture, vTextureCoord);
    }
)V0G0N";

float data[16384*4];

for (int i=0; i<16384*4; i++) {
    data[i] = (float)i;
}

// 1
GPGPU gpu = GPGPU(128, 128);
// 2
gpu.makeFrameBuffer();
// 3
gpu.makeTexture(data);
//4
gpu.buildProgram(example1Fragment);
// 5
gpu.addAttrib("position", 3, 20, 0);
gpu.addAttrib("textureCoord", 2, 20, 12);
// 6
gpu.draw();
// 7
float* out = gpu.getPixels();
// 8
gpu.deleteGL();
```

## API

### JS: GPGPU({gl, height, width})
### C++: GPGPU(height, width)
_int_ **height** - Height of the context in pixels (not used when gl is given)
_int_ **width** - Width of the context in pixels (not used when gl is given)
_webgl context_ **gl** - Use an existing context. The height and width will be set to the given gl context's. (optional)

This will create the webgl context with the given size.


### makeFrameBuffer(), makeFrameBuffer(width, height)
_int_ **height** - Height of the frameBuffer in pixels (optional - will default to the context height)
_int_ **width** - Width of the frameBuffer in pixels (optional - will default to the context width)

This will init the outgoing array data. If your shader increases/reduces the data cardinality, you can set the size of the framebuffer to something bigger/smaller.

### makeTexture(data),  makeTexture(data, width, height)
_Float32Array_ **data** - The data buffer to be read as a texture by the shader
_int_ **height** - Height of the texture in pixels (optional - will default to the context height)
_int_ **width** - Width of the texture in pixels (optional - will default to the context width)

This will add a texture (incoming data array) to the computation. You can call this several times, with different arrays, for multiple arrays/textures to be loaded by the shader. When writing your shader, you will be able to access your textures incrementally, as ```texture0```, ```texture1```, ```texture2```, etc. You can set different dimensions if their size differs from the context's (eg a second, kernel texture).

### updateTexture(data), updateTexture(data, index)
_int_ **index** - The index of the texture to replace. Defaults to 0.
_Float32Array_ **data** - The data buffer to update with

This will update the data used as a texture. The index of the texture matches the order in which the textures were defined.

### buildProgram(fragment), buildProgram(fragment, vertex)
_string_ **fragment** - The GLSL fragment shader to carry out the compute for each pixel
_string_ **vertex** - The GLSL vertex shader (Optional) This defaults to a standard vertex shader:
```glsl
attribute vec3 position;
attribute vec2 textureCoord;

varying highp vec2 vTextureCoord;

void main() {
    gl_Position = vec4(position, 1.0);
    vTextureCoord = textureCoord;
}
```
This will bind the two shaders to the context, compile them, and throw any errors.

### JS: addAttrib(name), addAttrib(name, {numElements, stride, offset})
### C++: addAttrib(name), addAttrib(name, numElements, stride, offset)
_string_ **name** - The name of the attribute
_int_ **numElements** - How many elements in the vector (Optional - will default to 3). Can be 1-4.
_int_ **stride** - The stride in bytes (Optional - will default to 20)
_int_ **offset** - Pointer/offset (Optional - will default to 0)

This will set a read-only global variable which may change per vertex (used in the vertex shader).

### addUniform(name), addUniform(name, value), addUniform(name, value, type)
_string_ **name** - The name of the uniform
_number_ **value** - The value assigned to the uniform
_string_ **type** - Override for the function used to set the uniform (Optional - defaults to "uniform1f")

This will set a global variable for use in the fragment shader. It is unchanged for the entire draw call.

### draw(), draw(texture)
_webgl texture_ **texture** - You can set a different GPGPU's framebuffer as an input, and the shader will take it as input , instead of the first given texture (Optional)

This will bind all the textures (once) and will run the shaders on the input texture(s).

### getPixels(), getPixels(startX, startY, spanX, spanY)
_int_ **startX** - The x position in the framebuffer to start reading from (Optional - will default to 0)
_int_ **startY** - The y position in the framebuffer to start reading from (Optional - will default to 0)
_int_ **spanX** - How many x pixels to read from the framebuffer (Optional - will default to the end)
_int_ **spanY** - How many y pixels to read from the framebuffer (Optional - will default to the end)

Once the ```draw()``` function was called, this can be used to read the data from the framebuffer.

### delete() - C++: deleteGL()

This will clean up by deleting the context and associated data.

## Demos

Run ```node server``` and go to ```localhost:1337``` to see some basic demos with performance comparison vs javascript.

## Compiling

To edit/compile the C++ demo, first run ```node runner.js``` to watch for file changes and automatically compile.