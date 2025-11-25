"use client";

import { useEffect, useRef } from "react";

// --- CLASSES ---
class Pointer {
    id = -1;
    x = 0;
    y = 0;
    prevX = 0;
    prevY = 0;
    dx = 0;
    dy = 0;
    down = false;
    moved = false;
    color = [30, 0, 300]; // Initial color
}

class GLProgram {
    uniforms: Record<string, WebGLUniformLocation | null> = {};
    program: WebGLProgram;

    constructor(
        gl: WebGL2RenderingContext,
        vertexShader: WebGLShader,
        fragmentShader: WebGLShader
    ) {
        this.program = gl.createProgram()!;
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS))
            throw gl.getProgramInfoLog(this.program);

        const uniformCount = gl.getProgramParameter(
            this.program,
            gl.ACTIVE_UNIFORMS
        );
        for (let i = 0; i < uniformCount; i++) {
            const uniformName = gl.getActiveUniform(this.program, i)!.name;
            this.uniforms[uniformName] = gl.getUniformLocation(
                this.program,
                uniformName
            );
        }
    }
    bind(gl: WebGL2RenderingContext) {
        gl.useProgram(this.program);
    }
}

export default function LiquidGlassCursor() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // --- CONFIGURATION ---
        // Matches original HTML exactly
        const config = {
            TEXTURE_DOWNSAMPLE: 0,
            DENSITY_DISSIPATION: 0.97,
            VELOCITY_DISSIPATION: 0.98,
            PRESSURE_DISSIPATION: 0.9,
            PRESSURE_ITERATIONS: 40,
            CURL: 0,
            SPLAT_RADIUS: 0.002,
        };

        const pointers: Pointer[] = [];
        const splatStack: number[] = [];

        interface FBO {
            read: { texture: WebGLTexture; fbo: WebGLFramebuffer; texId: number };
            write: { texture: WebGLTexture; fbo: WebGLFramebuffer; texId: number };
            swap: () => void;
        }

        interface SingleFBO {
            texture: WebGLTexture;
            fbo: WebGLFramebuffer;
            texId: number;
        }

        let textureWidth: number;
        let textureHeight: number;
        let density: FBO;
        let velocity: FBO;
        let divergence: SingleFBO;
        let curl: SingleFBO;
        let pressure: FBO;
        let backgroundTexture: WebGLTexture | null;

        pointers.push(new Pointer());

        // --- WEBGL CONTEXT ---
        const { gl, ext } = getWebGLContext(canvas);

        if (!gl) {
            console.error("WebGL not supported");
            return;
        }
        console.log("WebGL Context initialized", gl);

        function getWebGLContext(canvas: HTMLCanvasElement) {
            const params = {
                alpha: true,
                depth: false,
                stencil: false,
                antialias: false,
                preserveDrawingBuffer: false,
            };

            let gl = canvas.getContext("webgl2", params) as WebGL2RenderingContext;
            const isWebGL2 = !!gl;
            if (!isWebGL2)
                gl = (canvas.getContext("webgl", params) ||
                    canvas.getContext(
                        "experimental-webgl",
                        params
                    )) as WebGL2RenderingContext;

            let halfFloat;
            let supportLinearFiltering;

            if (isWebGL2) {
                gl.getExtension("EXT_color_buffer_float");
                supportLinearFiltering = gl.getExtension("OES_texture_float_linear");
            } else {
                halfFloat = gl.getExtension("OES_texture_half_float");
                supportLinearFiltering = gl.getExtension(
                    "OES_texture_half_float_linear"
                );
            }

            gl.clearColor(0.0, 0.0, 0.0, 1.0);

            const halfFloatTexType = isWebGL2
                ? gl.HALF_FLOAT
                : halfFloat?.HALF_FLOAT_OES;

            let formatRGBA, formatRG, formatR;

            if (halfFloatTexType !== undefined) {
                if (isWebGL2) {
                    formatRGBA = getSupportedFormat(
                        gl,
                        gl.RGBA16F,
                        gl.RGBA,
                        halfFloatTexType
                    );
                    formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
                    formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
                } else {
                    formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
                    formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
                    formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
                }
            }

            return {
                gl,
                ext: {
                    formatRGBA,
                    formatRG,
                    formatR,
                    halfFloatTexType,
                    supportLinearFiltering,
                },
            };
        }

        function getSupportedFormat(
            gl: WebGL2RenderingContext,
            internalFormat: number,
            format: number,
            type: number
        ): { internalFormat: number; format: number } | null {
            if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
                switch (internalFormat) {
                    case gl.R16F:
                        return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
                    case gl.RG16F:
                        return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
                    default:
                        return null;
                }
            }
            return { internalFormat, format };
        }

        function supportRenderTextureFormat(
            gl: WebGL2RenderingContext,
            internalFormat: number,
            format: number,
            type: number
        ) {
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                internalFormat,
                4,
                4,
                0,
                format,
                type,
                null
            );
            const fbo = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER,
                gl.COLOR_ATTACHMENT0,
                gl.TEXTURE_2D,
                texture,
                0
            );
            const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            return status == gl.FRAMEBUFFER_COMPLETE;
        }

        function compileShader(type: number, source: string) {
            const shader = gl.createShader(type)!;
            gl.shaderSource(shader, source);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
                throw gl.getShaderInfoLog(shader);

            return shader;
        }

        const baseVertexShader = compileShader(
            gl.VERTEX_SHADER,
            `
            precision highp float;
            precision mediump sampler2D;
            attribute vec2 aPosition;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform vec2 texelSize;
            void main () {
                vUv = aPosition * 0.5 + 0.5;
                vL = vUv - vec2(texelSize.x, 0.0);
                vR = vUv + vec2(texelSize.x, 0.0);
                vT = vUv + vec2(0.0, texelSize.y);
                vB = vUv - vec2(0.0, texelSize.y);
                gl_Position = vec4(aPosition, 0.0, 1.0);
            }
        `
        );

        const clearShader = compileShader(
            gl.FRAGMENT_SHADER,
            `
            precision highp float;
            precision mediump sampler2D;
            varying vec2 vUv;
            uniform sampler2D uTexture;
            uniform float value;
            void main () {
                gl_FragColor = value * texture2D(uTexture, vUv);
            }
        `
        );

        // --- CSS ---
        // Ensure canvas is on top and allows clicks to pass through
        // canvas.style.zIndex = "9999"; // Removed to allow className -z-10 to work
        canvas.style.pointerEvents = "none"; // Already in className, but ensuring it


        // --- VIDEO SETUP ---
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.src = "https://pub-d24ed1d740a7460195197f5ee2413105.r2.dev/web_interactive_color.mp4";
        video.loop = true;
        video.muted = true;
        video.preload = "auto";
        video.playsInline = true;
        // video.pause(); // Removed pause, let's try load() and maybe play() to buffer

        let videoTexture: WebGLTexture | null = null;

        video.oncanplay = () => {
            console.log("Video can play!");
            if (!gl) return;
            if (!videoTexture) {
                videoTexture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, videoTexture);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            }
        };

        video.onerror = (e) => {
            console.error("Video error:", e, video.error);
        };

        // Force load
        video.load();
        // video.play().then(() => video.pause()); // Optional: play briefly to buffer? Let's stick to load() first.

        // --- SHADERS ---
        // ... (Previous shaders remain, updating displayShader)

        const displayShader = compileShader(
            gl.FRAGMENT_SHADER,
            `
            precision highp float;
            precision mediump sampler2D;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uTexture;
            uniform sampler2D uBackground; // The video texture
            uniform vec2 texelSize;

            void main () {
                vec3 L = texture2D(uTexture, vL).rgb;
                vec3 R = texture2D(uTexture, vR).rgb;
                vec3 T = texture2D(uTexture, vT).rgb;
                vec3 B = texture2D(uTexture, vB).rgb;
                vec3 C = texture2D(uTexture, vUv).rgb;

                float density = length(C);

                // Calculate normal
                float dx = length(R) - length(L);
                float dy = length(T) - length(B);
                vec3 n = normalize(vec3(dx, dy, 0.5));

                // Refraction
                vec2 refraction = n.xy * 0.05; // Strength of distortion
                vec2 finalUV = vUv + refraction;
                
                // Sample Video Background (Flip Y)
                vec2 bgUV = vec2(finalUV.x, 1.0 - finalUV.y);
                vec3 bg = texture2D(uBackground, bgUV).rgb;

                // Specular Highlight
                vec3 lightDir = normalize(vec3(1.0, 1.0, 2.0));
                float spec = pow(max(dot(n, lightDir), 0.0), 20.0);

                // Dynamic Highlight Color (tinted by background)
                // We sample the background at the *refracted* coordinate to get the color "under" the glass
                vec3 bgUnder = texture2D(uBackground, bgUV).rgb;
                vec3 highlightTint = mix(vec3(1.0), bgUnder, 0.5); // Mix white with background color

                // Combine
                // Background + Specular
                vec3 finalColor = bg + highlightTint * spec;

                gl_FragColor = vec4(finalColor, 1.0);
            }
        `
        );

        // ... (Other shaders and init logic)



        // ... rest of initialization ...

        // Ensure clear color is transparent
        gl.clearColor(0.0, 0.0, 0.0, 0.0);


        const splatShader = compileShader(
            gl.FRAGMENT_SHADER,
            `
            precision highp float;
            precision mediump sampler2D;
            varying vec2 vUv;
            uniform sampler2D uTarget;
            uniform float aspectRatio;
            uniform vec3 color;
            uniform vec2 point;
            uniform float radius;
            void main () {
                vec2 p = vUv - point.xy;
                p.x *= aspectRatio;
                vec3 splat = exp(-dot(p, p) / radius) * color;
                vec3 base = texture2D(uTarget, vUv).xyz;
                gl_FragColor = vec4(base + splat, 1.0);
            }
        `
        );

        const advectionManualFilteringShader = compileShader(
            gl.FRAGMENT_SHADER,
            `
            precision highp float;
            precision mediump sampler2D;
            varying vec2 vUv;
            uniform sampler2D uVelocity;
            uniform sampler2D uSource;
            uniform vec2 texelSize;
            uniform float dt;
            uniform float dissipation;
            vec4 bilerp (in sampler2D sam, in vec2 p) {
                vec4 st;
                st.xy = floor(p - 0.5) + 0.5;
                st.zw = st.xy + 1.0;
                vec4 uv = st * texelSize.xyxy;
                vec4 a = texture2D(sam, uv.xy);
                vec4 b = texture2D(sam, uv.zy);
                vec4 c = texture2D(sam, uv.xw);
                vec4 d = texture2D(sam, uv.zw);
                vec2 f = p - st.xy;
                return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
            }
            void main () {
                vec2 coord = gl_FragCoord.xy - dt * texture2D(uVelocity, vUv).xy;
                gl_FragColor = dissipation * bilerp(uSource, coord);
                gl_FragColor.a = 1.0;
            }
        `
        );

        const advectionShader = compileShader(
            gl.FRAGMENT_SHADER,
            `
            precision highp float;
            precision mediump sampler2D;
            varying vec2 vUv;
            uniform sampler2D uVelocity;
            uniform sampler2D uSource;
            uniform vec2 texelSize;
            uniform float dt;
            uniform float dissipation;
            void main () {
                vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
                gl_FragColor = dissipation * texture2D(uSource, coord);
                gl_FragColor.a = 1.0;
            }
        `
        );

        const divergenceShader = compileShader(
            gl.FRAGMENT_SHADER,
            `
            precision highp float;
            precision mediump sampler2D;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uVelocity;
            vec2 sampleVelocity (in vec2 uv) {
                vec2 multiplier = vec2(1.0, 1.0);
                if (uv.x < 0.0) { uv.x = 0.0; multiplier.x = -1.0; }
                if (uv.x > 1.0) { uv.x = 1.0; multiplier.x = -1.0; }
                if (uv.y < 0.0) { uv.y = 0.0; multiplier.y = -1.0; }
                if (uv.y > 1.0) { uv.y = 1.0; multiplier.y = -1.0; }
                return multiplier * texture2D(uVelocity, uv).xy;
            }
            void main () {
                float L = sampleVelocity(vL).x;
                float R = sampleVelocity(vR).x;
                float T = sampleVelocity(vT).y;
                float B = sampleVelocity(vB).y;
                float div = 0.5 * (R - L + T - B);
                gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
            }
        `
        );

        const curlShader = compileShader(
            gl.FRAGMENT_SHADER,
            `
            precision highp float;
            precision mediump sampler2D;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uVelocity;
            void main () {
                float L = texture2D(uVelocity, vL).y;
                float R = texture2D(uVelocity, vR).y;
                float T = texture2D(uVelocity, vT).x;
                float B = texture2D(uVelocity, vB).x;
                float vorticity = R - L - T + B;
                gl_FragColor = vec4(vorticity, 0.0, 0.0, 1.0);
            }
        `
        );

        const vorticityShader = compileShader(
            gl.FRAGMENT_SHADER,
            `
            precision highp float;
            precision mediump sampler2D;
            varying vec2 vUv;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uVelocity;
            uniform sampler2D uCurl;
            uniform float curl;
            uniform float dt;
            void main () {
                float T = texture2D(uCurl, vT).x;
                float B = texture2D(uCurl, vB).x;
                float C = texture2D(uCurl, vUv).x;
                vec2 force = vec2(abs(T) - abs(B), 0.0);
                force *= 1.0 / length(force + 0.00001) * curl * C;
                vec2 vel = texture2D(uVelocity, vUv).xy;
                gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
            }
        `
        );

        const pressureShader = compileShader(
            gl.FRAGMENT_SHADER,
            `
            precision highp float;
            precision mediump sampler2D;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uPressure;
            uniform sampler2D uDivergence;
            vec2 boundary (in vec2 uv) {
                uv = min(max(uv, 0.0), 1.0);
                return uv;
            }
            void main () {
                float L = texture2D(uPressure, boundary(vL)).x;
                float R = texture2D(uPressure, boundary(vR)).x;
                float T = texture2D(uPressure, boundary(vT)).x;
                float B = texture2D(uPressure, boundary(vB)).x;
                float C = texture2D(uPressure, vUv).x;
                float divergence = texture2D(uDivergence, vUv).x;
                float pressure = (L + R + B + T - divergence) * 0.25;
                gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
            }
        `
        );

        const gradientSubtractShader = compileShader(
            gl.FRAGMENT_SHADER,
            `
            precision highp float;
            precision mediump sampler2D;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uPressure;
            uniform sampler2D uVelocity;
            vec2 boundary (in vec2 uv) {
                uv = min(max(uv, 0.0), 1.0);
                return uv;
            }
            void main () {
                float L = texture2D(uPressure, boundary(vL)).x;
                float R = texture2D(uPressure, boundary(vR)).x;
                float T = texture2D(uPressure, boundary(vT)).x;
                float B = texture2D(uPressure, boundary(vB)).x;
                vec2 velocity = texture2D(uVelocity, vUv).xy;
                velocity.xy -= vec2(R - L, T - B);
                gl_FragColor = vec4(velocity, 0.0, 1.0);
            }
        `
        );

        // --- INITIALIZATION ---
        let clearProgram: GLProgram;
        let displayProgram: GLProgram;
        let splatProgram: GLProgram;
        let advectionProgram: GLProgram;
        let divergenceProgram: GLProgram;
        let curlProgram: GLProgram;
        let vorticityProgram: GLProgram;
        let pressureProgram: GLProgram;
        let gradienSubtractProgram: GLProgram;

        function initPrograms() {
            console.log("Initializing programs...");
            clearProgram = new GLProgram(gl, baseVertexShader, clearShader);
            displayProgram = new GLProgram(gl, baseVertexShader, displayShader);
            splatProgram = new GLProgram(gl, baseVertexShader, splatShader);
            advectionProgram = new GLProgram(
                gl,
                baseVertexShader,
                ext.supportLinearFiltering
                    ? advectionShader
                    : advectionManualFilteringShader
            );
            divergenceProgram = new GLProgram(gl, baseVertexShader, divergenceShader);
            curlProgram = new GLProgram(gl, baseVertexShader, curlShader);
            vorticityProgram = new GLProgram(gl, baseVertexShader, vorticityShader);
            pressureProgram = new GLProgram(gl, baseVertexShader, pressureShader);
            gradienSubtractProgram = new GLProgram(
                gl,
                baseVertexShader,
                gradientSubtractShader
            );
        }

        function initFramebuffers() {
            console.log("Initializing framebuffers...");
            textureWidth = gl.drawingBufferWidth >> config.TEXTURE_DOWNSAMPLE;
            textureHeight = gl.drawingBufferHeight >> config.TEXTURE_DOWNSAMPLE;

            const texType = ext.halfFloatTexType;
            const rgba = ext.formatRGBA;
            const rg = ext.formatRG;
            const r = ext.formatR;

            if (!rgba || !rg || !r || !texType) {
                console.error("Missing required texture formats or extensions", { rgba, rg, r, texType });
                isInitialized = false;
                return;
            }

            density = createDoubleFBO(
                2,
                textureWidth,
                textureHeight,
                rgba.internalFormat,
                rgba.format,
                texType,
                ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST
            );
            velocity = createDoubleFBO(
                0,
                textureWidth,
                textureHeight,
                rg.internalFormat,
                rg.format,
                texType,
                ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST
            );
            divergence = createFBO(
                4,
                textureWidth,
                textureHeight,
                r.internalFormat,
                r.format,
                texType,
                gl.NEAREST
            );
            curl = createFBO(
                5,
                textureWidth,
                textureHeight,
                r.internalFormat,
                r.format,
                texType,
                gl.NEAREST
            );
            pressure = createDoubleFBO(
                6,
                textureWidth,
                textureHeight,
                r.internalFormat,
                r.format,
                texType,
                gl.NEAREST
            );

            isInitialized = true;
        }

        function createFBO(
            texId: number,
            w: number,
            h: number,
            internalFormat: number,
            format: number,
            type: number,
            param: number
        ) {
            gl.activeTexture(gl.TEXTURE0 + texId);
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                internalFormat,
                w,
                h,
                0,
                format,
                type,
                null
            );
            const fbo = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER,
                gl.COLOR_ATTACHMENT0,
                gl.TEXTURE_2D,
                texture,
                0
            );
            gl.viewport(0, 0, w, h);
            gl.clear(gl.COLOR_BUFFER_BIT);
            return { texture, fbo, texId };
        }

        function createDoubleFBO(
            texId: number,
            w: number,
            h: number,
            internalFormat: number,
            format: number,
            type: number,
            param: number
        ) {
            let fbo1 = createFBO(texId, w, h, internalFormat, format, type, param);
            let fbo2 = createFBO(
                texId + 1,
                w,
                h,
                internalFormat,
                format,
                type,
                param
            );
            return {
                get read() {
                    return fbo1;
                },
                get write() {
                    return fbo2;
                },
                swap() {
                    const temp = fbo1;
                    fbo1 = fbo2;
                    fbo2 = temp;
                },
            };
        }
        function initBackgroundTexture() {
            gl.activeTexture(gl.TEXTURE0 + 8);
            backgroundTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                1,
                1,
                0,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 0, 0])
            );
        }

        const blit = (() => {
            gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
                gl.STATIC_DRAW
            );
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
            gl.bufferData(
                gl.ELEMENT_ARRAY_BUFFER,
                new Uint16Array([0, 1, 2, 0, 2, 3]),
                gl.STATIC_DRAW
            );
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(0);
            return (destination: WebGLFramebuffer | null) => {
                gl.bindFramebuffer(gl.FRAMEBUFFER, destination);
                gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
            };
        })();

        let lastTime = Date.now();
        let lastVideoUpdateTime = 0;

        let isInitialized = false;

        // --- MAIN LOOP ---
        function update() {
            if (!isInitialized) return;
            resizeCanvas();
            const dt = Math.min((Date.now() - lastTime) / 1000, 0.016);
            lastTime = Date.now();

            // --- VIDEO SCRUBBING ---
            if (video.duration && !isNaN(video.duration)) {
                const now = Date.now();
                // Throttle updates to ~30fps (33ms)
                // The user requested to prevent overwhelming the decoder.
                if (now - lastVideoUpdateTime > 33) {
                    const scrubTime = (pointers[0].x / window.innerWidth) * video.duration;
                    if (isFinite(scrubTime)) {
                        // Only update if the difference is significant to avoid tiny seeks? 
                        // For now, just time throttling is good.
                        if (Math.abs(video.currentTime - scrubTime) > 0.05) {
                            video.currentTime = scrubTime;
                            lastVideoUpdateTime = now;
                        }
                    }
                }
            }

            // --- UPDATE VIDEO TEXTURE ---
            if (videoTexture && video.readyState >= 2) {
                gl.activeTexture(gl.TEXTURE0 + 8);
                gl.bindTexture(gl.TEXTURE_2D, videoTexture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
            }

            gl.viewport(0, 0, textureWidth, textureHeight);

            if (splatStack.length > 0) multipleSplats(splatStack.pop()!);

            for (let i = 0; i < pointers.length; i++) {
                const pointer = pointers[i];
                if (pointer.moved) {
                    pointer.dx = (pointer.x - pointer.prevX) * 12.0;
                    pointer.dy = (pointer.y - pointer.prevY) * 12.0;
                    const dx = pointer.x - pointer.prevX;
                    const dy = pointer.y - pointer.prevY;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    const steps = Math.ceil(len / 5.0);
                    if (steps > 0) {
                        for (let j = 0; j < steps; j++) {
                            const t = j / steps;
                            const x = pointer.prevX + dx * t;
                            const y = pointer.prevY + dy * t;
                            splat(x, y, pointer.dx, pointer.dy, pointer.color);
                        }
                    }
                    pointer.prevX = pointer.x;
                    pointer.prevY = pointer.y;
                    pointer.moved = false;
                } else {
                    pointer.prevX = pointer.x;
                    pointer.prevY = pointer.y;
                }
            }

            curlProgram.bind(gl);
            gl.uniform2f(
                curlProgram.uniforms.texelSize,
                1.0 / textureWidth,
                1.0 / textureHeight
            );
            gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.texId);
            blit(curl.fbo);

            vorticityProgram.bind(gl);
            gl.uniform2f(
                vorticityProgram.uniforms.texelSize,
                1.0 / textureWidth,
                1.0 / textureHeight
            );
            gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.texId);
            gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.texId);
            gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
            gl.uniform1f(vorticityProgram.uniforms.dt, dt);
            blit(velocity.write.fbo);
            velocity.swap();

            divergenceProgram.bind(gl);
            gl.uniform2f(
                divergenceProgram.uniforms.texelSize,
                1.0 / textureWidth,
                1.0 / textureHeight
            );
            gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.texId);
            blit(divergence.fbo);

            clearProgram.bind(gl);
            let pressureTexId = pressure.read.texId;
            gl.activeTexture(gl.TEXTURE0 + pressureTexId);
            gl.bindTexture(gl.TEXTURE_2D, pressure.read.texture);
            gl.uniform1i(clearProgram.uniforms.uTexture, pressureTexId);
            gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE_DISSIPATION);
            blit(pressure.write.fbo);
            pressure.swap();

            pressureProgram.bind(gl);
            gl.uniform2f(
                pressureProgram.uniforms.texelSize,
                1.0 / textureWidth,
                1.0 / textureHeight
            );
            gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.texId);
            pressureTexId = pressure.read.texId;
            gl.uniform1i(pressureProgram.uniforms.uPressure, pressureTexId);
            gl.activeTexture(gl.TEXTURE0 + pressureTexId);
            for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
                gl.bindTexture(gl.TEXTURE_2D, pressure.read.texture);
                blit(pressure.write.fbo);
                pressure.swap();
            }

            gradienSubtractProgram.bind(gl);
            gl.uniform2f(
                gradienSubtractProgram.uniforms.texelSize,
                1.0 / textureWidth,
                1.0 / textureHeight
            );
            gl.uniform1i(
                gradienSubtractProgram.uniforms.uPressure,
                pressure.read.texId
            );
            gl.uniform1i(
                gradienSubtractProgram.uniforms.uVelocity,
                velocity.read.texId
            );
            blit(velocity.write.fbo);
            velocity.swap();

            advectionProgram.bind(gl);
            gl.uniform2f(
                advectionProgram.uniforms.texelSize,
                1.0 / textureWidth,
                1.0 / textureHeight
            );
            gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.texId);
            gl.uniform1i(advectionProgram.uniforms.uSource, velocity.read.texId);
            gl.uniform1f(advectionProgram.uniforms.dt, dt);
            gl.uniform1f(
                advectionProgram.uniforms.dissipation,
                config.VELOCITY_DISSIPATION
            );
            blit(velocity.write.fbo);
            velocity.swap();

            gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.texId);
            gl.uniform1i(advectionProgram.uniforms.uSource, density.read.texId);
            gl.uniform1f(
                advectionProgram.uniforms.dissipation,
                config.DENSITY_DISSIPATION
            );
            blit(density.write.fbo);
            density.swap();

            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            displayProgram.bind(gl);
            gl.uniform1i(displayProgram.uniforms.uTexture, density.read.texId);
            gl.uniform1i(displayProgram.uniforms.uBackground, 8); // Video texture unit
            gl.uniform2f(
                displayProgram.uniforms.texelSize,
                1.0 / textureWidth,
                1.0 / textureHeight
            );
            blit(null);

            requestAnimationFrame(update);
        }

        function splat(
            x: number,
            y: number,
            dx: number,
            dy: number,
            color: number[]
        ) {
            splatProgram.bind(gl);
            gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.texId);
            gl.uniform1f(
                splatProgram.uniforms.aspectRatio,
                canvas!.width / canvas!.height
            );
            gl.uniform2f(
                splatProgram.uniforms.point,
                x / canvas!.width,
                1.0 - y / canvas!.height
            );
            gl.uniform3f(splatProgram.uniforms.color, dx, -dy, 1.0);
            gl.uniform1f(splatProgram.uniforms.radius, config.SPLAT_RADIUS * 1.5);
            blit(velocity.write.fbo);
            velocity.swap();

            gl.uniform1i(splatProgram.uniforms.uTarget, density.read.texId);
            gl.uniform3f(
                splatProgram.uniforms.color,
                color[0] * 0.3,
                color[1] * 0.3,
                color[2] * 0.3
            );
            gl.uniform1f(splatProgram.uniforms.radius, config.SPLAT_RADIUS);
            blit(density.write.fbo);
            density.swap();
        }

        function multipleSplats(amount: number) {
            for (let i = 0; i < amount; i++) {
                const color = [
                    Math.random() * 10,
                    Math.random() * 10,
                    Math.random() * 10,
                ];
                const x = canvas!.width * Math.random();
                const y = canvas!.height * Math.random();
                const dx = 1000 * (Math.random() - 0.5);
                const dy = 1000 * (Math.random() - 0.5);
                splat(x, y, dx, dy, color);
            }
        }

        function resizeCanvas() {
            if (
                canvas!.width !== canvas!.clientWidth ||
                canvas!.height !== canvas!.clientHeight
            ) {
                canvas!.width = canvas!.clientWidth;
                canvas!.height = canvas!.clientHeight;
                initFramebuffers();
                initBackgroundTexture();
            }
        }

        // --- EVENT LISTENERS ---
        const handleMouseMove = (e: MouseEvent) => {
            // In original HTML: pointers[0].moved = pointers[0].down;
            // But for a cursor effect, we want it to move always.
            pointers[0].moved = true;
            pointers[0].x = e.clientX;
            pointers[0].y = e.clientY;
        };

        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            const touches = e.targetTouches;
            for (let i = 0; i < touches.length; i++) {
                let pointer = pointers[i];
                if (!pointer) pointer = pointers[i] = new Pointer();
                pointer.moved = true;
                pointer.down = true;
                pointer.x = touches[i].pageX;
                pointer.y = touches[i].pageY;
            }
        };

        const handleMouseDown = (e: MouseEvent) => {
            pointers[0].down = true;
            pointers[0].moved = true;
            pointers[0].x = pointers[0].prevX = e.clientX;
            pointers[0].y = pointers[0].prevY = e.clientY;
            pointers[0].color = [100.0, 100.0, 100.0];
        };

        const handleMouseUp = () => {
            pointers[0].down = false;
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("touchmove", handleTouchMove, { passive: false });
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);

        // --- START ---
        console.log("Starting Liquid Glass Cursor...");
        initPrograms();
        initFramebuffers();
        initBackgroundTexture();
        multipleSplats(parseInt((Math.random() * 20).toString()) + 5);
        update();

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed top-0 left-0 w-full h-full -z-10"
        />
    );
}
