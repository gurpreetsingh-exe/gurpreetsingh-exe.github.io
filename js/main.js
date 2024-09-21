const canvas = document.getElementById("screen");
/** @type {WebGL2RenderingContext} */
const gl = canvas.getContext("webgl2");

self.onload = () => {
    canvas.width = self.innerWidth;
    canvas.height = self.innerHeight;
};

self.addEventListener("resize", () => {
    canvas.width = self.innerWidth;
    canvas.height = self.innerHeight;
});

class Shader {
    #id;
    #vert;
    #frag;
    #locations;

    constructor(vert, frag) {
        this.#id = gl.createProgram();
        this.#vert = this.#compile_shader(gl.VERTEX_SHADER, vert);
        this.#frag = this.#compile_shader(gl.FRAGMENT_SHADER, frag);
        gl.attachShader(this.#id, this.#vert);
        gl.attachShader(this.#id, this.#frag);
        gl.linkProgram(this.#id);
        this.#locations = new Map();
    }

    bind() {
        gl.useProgram(this.#id);
    }

    unbind() {
        gl.useProgram(0);
    }

    #compile_shader(type, src) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
        }
        return shader;
    }

    #get_uniform_location(name) {
        if (!this.#locations.has(name)) {
            this.#locations.set(name, gl.getUniformLocation(this.#id, name));
        }

        return this.#locations.get(name);
    }

    upload_mat4(name, mat4) {
        gl.uniformMatrix4fv(this.#get_uniform_location(name), false, mat4);
    }
}

const vert = `#version 300 es
in vec3 pos;
uniform mat4 model;
uniform mat4 projection;

out vec3 color;

void main() {
    color = pos;
    gl_Position = projection * model * vec4(pos, 1);
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

const shader = new Shader(vert, frag);

const positions = [
    -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1,
    -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
];
const position_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

const indices = [
    1, 2, 0, 2, 3, 0, 6, 2, 1, 1, 5, 6, 6, 5, 4, 4, 7, 6,
    6, 3, 2, 7, 3, 6, 3, 7, 0, 7, 4, 0, 5, 1, 0, 4, 5, 0
];
const index_buffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices), gl.STATIC_DRAW);

let last_time = 0;
let cube_rotation = 0;
function update(time) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let delta_time = time - last_time;
    const field_of_view = 45 * Math.PI / 180;
    const aspect = canvas.width / canvas.height;
    const zNear = 0.1;
    const zFar = 100.0;
    const mat4 = glMatrix.mat4;
    const projection = mat4.create();

    cube_rotation += (delta_time * 0.001) % 360;

    mat4.perspective(projection,
        field_of_view,
        aspect,
        zNear,
        zFar);

    const model = mat4.create();
    mat4.translate(model, model, [0.0, 0.0, -6.0]);
    mat4.rotate(model, model, cube_rotation, [0, 0, 1]);
    mat4.rotate(model, model, cube_rotation * 0.7, [0, 1, 0]);

    gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
    shader.bind();
    shader.upload_mat4("projection", projection);
    shader.upload_mat4("model", model);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    requestAnimationFrame(update);
    last_time = time;
}

update(0);
