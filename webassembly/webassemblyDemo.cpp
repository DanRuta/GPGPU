#include <vector>
#include <emscripten.h>
#include "printv.h" // for logging out array data
#include <GLES3/gl3.h>
#include <EGL/egl.h>
#include "../GPGPU.h"

std::string example1Fragment = R"V0G0N(
    #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
    #else
        precision mediump float;
    #endif

    uniform sampler2D texture;
    varying vec2 vTextureCoord;

    void main() {
        gl_FragColor = texture2D(texture, vTextureCoord);
    }
)V0G0N";

std::string example2Fragment = R"V0G0N(
    #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
    #else
        precision mediump float;
    #endif

    uniform sampler2D texture;
    varying vec2 vTextureCoord;

    void main() {
        gl_FragColor = texture2D(texture, vTextureCoord) * texture2D(texture, vTextureCoord);
    }
)V0G0N";

std::string example3Fragment = R"V0G0N(
    #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
        uniform highp sampler2D texture1;
        uniform highp sampler2D texture2;
        uniform highp sampler2D texture3;
    #else
        precision mediump float;
        uniform mediump sampler2D texture1;
        uniform mediump sampler2D texture2;
        uniform mediump sampler2D texture3;
    #endif

    varying vec2 vTextureCoord;
    uniform float variable;

    void main() {

        vec4 pixel1 = texture2D(texture1, vTextureCoord);
        vec4 pixel2 = texture2D(texture2, vTextureCoord);
        vec4 pixel3 = texture2D(texture3, vTextureCoord);

        // pixel3.r = 1.0;

        gl_FragColor.r = pixel1.r + pixel2.r + pixel3.r + variable;
        gl_FragColor.g = pixel1.g + pixel2.g + pixel3.g + variable;
        gl_FragColor.b = pixel1.b + pixel2.b + pixel3.b + variable;
        gl_FragColor.a = pixel1.a + pixel2.a + pixel3.a + variable;
    }
)V0G0N";

int main (int argc, char const *argv[]) {

    printf("WASM loaded\n");
    EM_ASM(window.dispatchEvent(new CustomEvent("wasmLoaded")););

    return 0;
}


extern "C" {

    EMSCRIPTEN_KEEPALIVE
    void Example1 (void) {

        float data[16384*4];

        for (int i=0; i<16384*4; i++) {
            data[i] = (float)i;
        }

        printf("Data in:\n");
        printv(data, 16384*4);

        GPGPU gpu = GPGPU(128, 128);
        gpu.makeFrameBuffer();
        gpu.makeTexture(data);
        gpu.buildProgram(example1Fragment);

        gpu.addAttrib("position", 3, 20, 0);
        gpu.addAttrib("textureCoord", 2, 20, 12);

        gpu.draw();

        float* out = gpu.getPixels();
        printf("Data out:\n");
        printv(out, 16384*4);
    }


    EMSCRIPTEN_KEEPALIVE
    void Example2 (void) {
        float data[16384*4];

        for (int i=0; i<16384*4; i++) {
            data[i] = (float)i;
        }

        printf("Data in:\n");
        printv(data, 16384*4);

        GPGPU gpu = GPGPU(128, 128);
        gpu.makeFrameBuffer();
        gpu.makeTexture(data);
        gpu.buildProgram(example2Fragment);

        gpu.addAttrib("position", 3, 20, 0);
        gpu.addAttrib("textureCoord", 2, 20, 12);

        gpu.draw();

        float* out = gpu.getPixels();
        printf("Data out:\n");
        printv(out, 16384*4);
    }

    EMSCRIPTEN_KEEPALIVE
    void Example3 (void) {
        float data[16384*4];

        for (int i=0; i<16384*4; i++) {
            data[i] = (float)i;
        }

        printf("Data in:\n");
        printv(data, 16384*4);

        GPGPU gpu = GPGPU(128, 128);
        gpu.makeFrameBuffer();
        gpu.makeTexture(data);
        gpu.makeTexture(data);
        gpu.makeTexture(data);
        gpu.buildProgram(example3Fragment);

        gpu.addAttrib("position", 3, 20, 0);
        gpu.addAttrib("textureCoord", 2, 20, 12);
        gpu.addUniform("variable", 5, "uniform1f");

        gpu.draw();

        float* out = gpu.getPixels();
        printf("Data out:\n");
        printv(out, 16384*4);
    }
}