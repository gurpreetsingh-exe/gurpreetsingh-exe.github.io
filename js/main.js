const canvas = document.getElementById("screen");
/** @type {WebGL2RenderingContext} */
const gl = canvas.getContext("webgl2");

const vert = `#version 300 es
in vec3 position;
uniform mat4 model;
uniform mat4 projection;

out vec3 color;

void main() {
    color = position;
    gl_Position = projection * model * vec4(position, 1);
}
`;

const frag = `#version 300 es
precision mediump float;

in vec3 color;

out vec4 fragColor;

void main() {
    fragColor = vec4(color, 1);
}
`;

const main = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const engine = new Engine();
    engine.update();
    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        engine.update_projection();
    });
};

window.onload = main;
