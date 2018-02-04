#include <string>
#include <unordered_map>
#include <stdexcept>

// Copied over only the necessary code from the html5.h emscripten library
// https://github.com/kripken/emscripten/blob/master/system/include/emscripten/html5.h
// http://kripken.github.io/emscripten-site/docs/api_reference/html5.h
extern "C" {

    #define EM_BOOL int
    #define EMSCRIPTEN_RESULT int

    typedef int EMSCRIPTEN_WEBGL_CONTEXT_HANDLE;
    typedef struct EmscriptenWebGLContextAttributes {
        EM_BOOL alpha;
        EM_BOOL depth;
        EM_BOOL stencil;
        EM_BOOL antialias;
        EM_BOOL premultipliedAlpha;
        EM_BOOL preserveDrawingBuffer;
        EM_BOOL preferLowPowerToHighPerformance;
        EM_BOOL failIfMajorPerformanceCaveat;

        int majorVersion;
        int minorVersion;

        EM_BOOL enableExtensionsByDefault;
        EM_BOOL explicitSwapControl;
    } EmscriptenWebGLContextAttributes;

    extern EMSCRIPTEN_WEBGL_CONTEXT_HANDLE emscripten_webgl_create_context(const char *target, const EmscriptenWebGLContextAttributes *attributes);

    extern EMSCRIPTEN_RESULT emscripten_webgl_destroy_context(EMSCRIPTEN_WEBGL_CONTEXT_HANDLE context);

    extern EMSCRIPTEN_RESULT emscripten_webgl_make_context_current(EMSCRIPTEN_WEBGL_CONTEXT_HANDLE context);

}

class GPGPU {
public:

    bool ready = false;
    int height = 0;
    int width = 0;
    std::unordered_map<std::string, int> attribs;
    std::unordered_map<std::string, int> uniforms;

    GLuint program;
    std::vector<int> textures;

    EMSCRIPTEN_WEBGL_CONTEXT_HANDLE gl;

    float standardGeometryVals[20] = {
        -1.0,  1.0, 0.0, 0.0, 1.0,
        -1.0, -1.0, 0.0, 0.0, 0.0,
         1.0,  1.0, 0.0, 1.0, 1.0,
         1.0, -1.0, 0.0, 1.0, 0.0
    };

    std::string standardVertex = R"V0G0N(
        attribute vec3 position;
        attribute vec2 textureCoord;

        varying highp vec2 vTextureCoord;

        void main() {
            gl_Position = vec4(position, 1.0);
            vTextureCoord = textureCoord;
        }
    )V0G0N";

    // TODO, accept existing context as parameter
    GPGPU(int h, int w) {

        height = h;
        width = w;

        // Context configurations
        EmscriptenWebGLContextAttributes attrs;
        attrs.explicitSwapControl = 0;
        attrs.depth = 1;
        attrs.stencil = 1;
        attrs.antialias = 1;
        attrs.majorVersion = 2;
        attrs.minorVersion = 0;

        char id[10] = "theCanvas";
        gl = emscripten_webgl_create_context(id, &attrs);
        emscripten_webgl_make_context_current(gl);

        // Check for the OES_texture_float extension support
        std::string availableExtensions = std::string((char*)glGetString(GL_EXTENSIONS));

        if (availableExtensions.find("OES_texture_float") == std::string::npos) {
            printf("Floating point textures not supported\n");
        }
    };

    ~GPGPU() {
        emscripten_webgl_destroy_context(gl);
    };

    void makeTexture (void) {
        makeTexture({});
    }
    void makeTexture (float* buffer) {
        makeTexture(buffer, width, height);
    }

    void makeTexture (float* buffer, int w, int h) {

        GLuint texId;
        glGenTextures(1, &texId);
        glBindTexture(GL_TEXTURE_2D, texId);

        glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
        glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
        glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
        glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);

        glTexImage2D( GL_TEXTURE_2D, 0, GL_RGBA32F, w, h, 0, GL_RGBA, GL_FLOAT, buffer);
        textures.push_back(texId);
    }

    void makeFrameBuffer (void) {
        makeFrameBuffer(width, height);
    }

    void makeFrameBuffer (int w, int h) {

        GLuint texId;
        glGenTextures(1, &texId);
        glBindTexture(GL_TEXTURE_2D, texId);
        glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA32F, w, h, 0, GL_RGBA, GL_FLOAT, 0);
        glBindTexture(GL_TEXTURE_2D, 0);

        GLuint fbId;
        glGenFramebuffers(1, &fbId);
        glBindFramebuffer(GL_FRAMEBUFFER, fbId);
        glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, texId, 0);

        int status = glCheckFramebufferStatus(GL_FRAMEBUFFER);

        if (status != GL_FRAMEBUFFER_COMPLETE) {
            switch (status) {
                case GL_FRAMEBUFFER_UNSUPPORTED:
                    printf("FRAMEBUFFER_UNSUPPORTED\n");
                    break;
                case GL_FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
                    printf("GL_FRAMEBUFFER_INCOMPLETE_ATTACHMENT\n");
                    break;
                case GL_FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
                    printf("GL_FRAMEBUFFER_INCOMPLETE_DIMENSIONS\n");
                    break;
                case GL_FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
                    printf("GL_FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT\n");
                    break;
                default:
                    printf("Framebuffer error: %d\n", status);
            }
        }
    }

    void buildProgram (std::string &fragmentSource) {
        buildProgram(fragmentSource, standardVertex);
    }

    void buildProgram (std::string &fragmentSource, std::string &vertexSource) {

        program = glCreateProgram();
        GLuint vertex = compileShader(&vertexSource, GL_VERTEX_SHADER);
        GLuint fragment = compileShader(&fragmentSource, GL_FRAGMENT_SHADER);

        glAttachShader(program, vertex);
        glAttachShader(program, fragment);

        glLinkProgram(program);
        glDeleteShader(vertex);
        glDeleteShader(fragment);

        glUseProgram(program);

        GLuint standardGeometry;

        glGenBuffers(1, &standardGeometry);
        glBindBuffer(GL_ARRAY_BUFFER, standardGeometry);
        glBufferData(GL_ARRAY_BUFFER, 20*4, standardGeometryVals, GL_STATIC_DRAW);
    }

    GLuint compileShader (std::string *source, GLenum type) {

        const GLchar* sourceString[1];
        GLint sourceStringLengths[1];

        sourceString[0] = source->c_str();
        sourceStringLengths[0] = source->length();
        GLuint shader = glCreateShader(type);

        glShaderSource(shader, 1, sourceString, sourceStringLengths);
        glCompileShader(shader);

        // Check if there were errors
        int infoLen = 0;
        glGetShaderiv(shader, GL_INFO_LOG_LENGTH, &infoLen);

        if (infoLen > 1) {

            char infoLog[infoLen];

            // And print them out
            glGetShaderInfoLog(shader, infoLen, NULL, infoLog);
            printf("%s\n", infoLog);

            free(infoLog);
        }

        return shader;
    }

    void addAttrib (std::string name, int numElements=3, int stride=20, int offset=0) {
        glUseProgram(program);
        int loc = glGetAttribLocation(program, name.c_str());
        attribs[name] = loc;
        glEnableVertexAttribArray(loc);
        glVertexAttribPointer(loc, numElements, GL_FLOAT, GL_FALSE, stride, (GLvoid*)offset);
    }

    template<class T>
    void addUniform (std::string name, T value=0, std::string type="uniform1f") {
        int loc = glGetUniformLocation(program, name.c_str());
        uniforms[name] = loc;

        if (type=="uniform1f") {
            glUniform1f(loc, value);
        } else if (type=="uniform1i") {
            glUniform1i(loc, value);
        }
    }

    void draw (int texture=-1) {

        if (texture==-1) texture = textures[textures.size()-1];

        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, texture);

        if (!ready) {

            ready = true;
            addUniform("texture0", 0, "uniform1i");

            int texToAdd = texture==textures[textures.size()-1] ? textures.size()-1 : textures.size();

            for (int t=0; t<texToAdd; t++) {
                glActiveTexture(GL_TEXTURE0+t+1);
                glBindTexture(GL_TEXTURE_2D, textures[t]);
                addUniform("texture"+std::to_string(t+1), (int)t+1, "uniform1i");
            }

            glActiveTexture(GL_TEXTURE0);

            GLenum error = glGetError();

            while (error != GL_NO_ERROR) {
                switch (error) {

                    case GL_INVALID_ENUM:
                        printf("GL_INVALID_ENUM\n");
                        break;
                    case GL_INVALID_VALUE:
                        printf("GL_INVALID_VALUE\n");
                        break;
                    case GL_INVALID_OPERATION:
                        printf("GL_INVALID_OPERATION\n");
                        break;
                    case GL_INVALID_FRAMEBUFFER_OPERATION:
                        printf("GL_INVALID_FRAMEBUFFER_OPERATION\n");
                        break;
                    case GL_OUT_OF_MEMORY:
                        printf("GL_OUT_OF_MEMORY\n");
                        break;
                }

                error = glGetError();
            }
        }

        glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
    }

    float* getPixels (int startX=0, int startY=0, int spanX=-1, int spanY=-1) {

        if (spanX==-1) spanX = width-startX;
        if (spanY==-1) spanY = width-startY;


        float* buffer = (float*) malloc(spanX * spanY * 4 * sizeof(float));

        glReadPixels(startX, startY, spanX, spanY, GL_RGBA, GL_FLOAT, buffer);
        return buffer;
    }

    void deleteGL () {
        emscripten_webgl_make_context_current(gl);
        glDeleteProgram(program);
    }
};


