const canvas = document.getElementById("screen");
/** @type {WebGL2RenderingContext} */
const gl = canvas.getContext("webgl2", { antialias: false });

const tri = `#version 300 es
in vec3 position;
out vec2 uv;

void main(void) {
    uv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position, 1);
}
`;

const main = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthFunc(gl.LEQUAL);
    const timer = new Timer();
    const engine = new Engine();
    timer.update = engine.update.bind(engine);
    timer.start();
    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        engine.update_projection();
    });
};

window.onload = main;
