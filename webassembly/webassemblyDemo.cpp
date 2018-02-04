#include <vector>
#include <stdlib.h>
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


std::string example4Fragment = R"V0G0N(
    #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
        uniform highp sampler2D texture1;
        uniform highp sampler2D texture2; // kernel
    #else
        precision mediump float;
        uniform mediump sampler2D texture1;
        uniform mediump sampler2D texture2; // kernel
    #endif

    varying vec2 vTextureCoord;
    uniform float w;

    void main() {

        const int kSpan = 3;
        const int spread = kSpan/2;

        // Gather the input values into a map
        vec4 n[kSpan*kSpan];

        for (int i=-spread; i<=spread; i++) {
            for (int j=-spread; j<=spread; j++) {

                vec4 value;

                // Zero out values out of bounds
                if ( (vTextureCoord.x + float(j)*w) > 1.0 ||
                     (vTextureCoord.x + float(j)*w) < 0.0 ||
                     (vTextureCoord.y + float(i)*w) > 1.0 ||
                     (vTextureCoord.y + float(i)*w) < 0.0 ) {
                    value.r = 0.0;
                } else {
                    value = texture2D( texture1, vTextureCoord + vec2(float(j)*w, float(i)*w) );
                }

                n[(j+spread)+(i+spread)*kSpan] = value;
            }
        }


        gl_FragColor.r = 0.0;

        float step = 1.0 / float(1 + kSpan);

        // Dot product against the kernel
        for (int i=0; i<kSpan; i++) {
            for (int j=0; j<kSpan; j++) {
                gl_FragColor.r += n[i*kSpan + j].r * texture2D( texture2, vec2(step * float(j+1), step * float(i+1) ) ).r;
            }
        }
    }
)V0G0N";

int main (int argc, char const *argv[]) {

    printf("WASM loaded\n");
    EM_ASM(window.dispatchEvent(new CustomEvent("wasmLoaded")););

    return 0;
}


extern "C" {

    EMSCRIPTEN_KEEPALIVE
    float* runExample1WAGPU (float *buf, int bufSize, int times) {

        EM_ASM(window.waRunTime = Date.now());

        GPGPU gpu = GPGPU(128, 128);
        gpu.makeFrameBuffer();
        gpu.makeTexture(buf);
        gpu.buildProgram(example1Fragment);

        gpu.addAttrib("position", 3, 20, 0);
        gpu.addAttrib("textureCoord", 2, 20, 12);

        for (int t=0; t<times; t++) {
            gpu.draw();
        }

        float* out = gpu.getPixels();

        gpu.deleteGL();

        EM_ASM(window.waRunTime = Date.now() - window.waRunTime);

        auto arrayPtr = &out[0];
        return arrayPtr;
    }

    EMSCRIPTEN_KEEPALIVE
    float* runExample2WAGPU (float *buf, int bufSize, int times) {

        EM_ASM(window.waRunTime = Date.now());

        GPGPU gpu = GPGPU(128, 128);
        gpu.makeFrameBuffer();
        gpu.makeTexture(buf);
        gpu.buildProgram(example2Fragment);

        gpu.addAttrib("position", 3, 20, 0);
        gpu.addAttrib("textureCoord", 2, 20, 12);

        for (int t=0; t<times; t++) {
            gpu.draw();
        }

        float* out = gpu.getPixels();

        gpu.deleteGL();

        EM_ASM(window.waRunTime = Date.now() - window.waRunTime);

        auto arrayPtr = &out[0];
        return arrayPtr;
    }

    EMSCRIPTEN_KEEPALIVE
    float* runExample3WAGPU (float *buf, int bufSize, int variable, int times) {

        EM_ASM(window.waRunTime = Date.now());

        GPGPU gpu = GPGPU(128, 128);
        gpu.makeFrameBuffer();
        gpu.makeTexture(buf);
        gpu.makeTexture(buf);
        gpu.makeTexture(buf);
        gpu.buildProgram(example3Fragment);

        gpu.addAttrib("position", 3, 20, 0);
        gpu.addAttrib("textureCoord", 2, 20, 12);

        gpu.addUniform("variable", variable);

        for (int t=0; t<times; t++) {
            gpu.draw();
        }

        float* out = gpu.getPixels();

        gpu.deleteGL();

        EM_ASM(window.waRunTime = Date.now() - window.waRunTime);

        auto arrayPtr = &out[0];
        return arrayPtr;
    }

    EMSCRIPTEN_KEEPALIVE
    float* runExample4WAGPU (float *inputData, int inputDataSize, float *kernel, int kernelSize, int times) {

        EM_ASM(window.waRunTime = Date.now());

        // printf("inputData\n");
        // printv(inputData, inputDataSize);
        // printf("kernel\n");
        // printv(kernel, kernelSize);


        GPGPU gpu = GPGPU(5, 5);
        gpu.makeFrameBuffer();
        gpu.makeTexture(inputData);
        gpu.makeTexture(kernel, 3, 3);
        gpu.buildProgram(example4Fragment);

        gpu.addAttrib("position", 3, 20, 0);
        gpu.addAttrib("textureCoord", 2, 20, 12);

        gpu.addUniform("w", 1.0/5.0);

        for (int t=0; t<times; t++) {
            gpu.draw();
        }

        float* out = gpu.getPixels();

        gpu.deleteGL();

        EM_ASM(window.waRunTime = Date.now() - window.waRunTime);

        auto arrayPtr = &out[0];
        return arrayPtr;
    }


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