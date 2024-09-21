const canvas = document.getElementById("screen");
/** @type {WebGL2RenderingContext} */
const gl = canvas.getContext("webgl2");

window.onload = () => {
    main();
};

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

    get_attribute(name) {
        return this.#get_uniform_location(name);
    }

    upload_mat4(name, mat4) {
        gl.uniformMatrix4fv(this.#get_uniform_location(name), false, mat4);
    }
}

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

class GenericBuffer {
    #id;
    #kind;

    constructor(kind) {
        this.#id = gl.createBuffer();
        this.#kind = kind;
    }

    bind() {
        gl.bindBuffer(this.#kind, this.#id);
    }

    unbind() {
        gl.bindBuffer(this.#kind, 0);
    }

    upload_data(data) {
        this.bind();
        gl.bufferData(this.#kind, data, gl.STATIC_DRAW);
    }
}

class Batch {
    #shader;
    #id;
    #buffers;
    #index_buffer;
    #has_indices;
    #count;

    constructor(shader, positions, indices = []) {
        this.#shader = shader;
        this.#id = gl.createVertexArray();
        gl.bindVertexArray(this.#id);
        this.#buffers = [];
        this.add_buffer("position", positions, 3);
        this.#has_indices = indices.length !== 0;
        this.#index_buffer = undefined;
        if (this.#has_indices) {
            this.#index_buffer = new GenericBuffer(gl.ELEMENT_ARRAY_BUFFER);
            this.#index_buffer.bind();
            this.#index_buffer.upload_data(new Uint16Array(indices));
        }
        gl.bindVertexArray(null);
        this.#count = this.#has_indices ? indices.length : (positions.length / 3);
    }

    add_buffer(name, data, size) {
        const buffer = new GenericBuffer(gl.ARRAY_BUFFER);
        buffer.bind();
        const buf = new Float32Array(data);
        buffer.upload_data(buf);
        const attr = this.#shader.get_attribute(name);
        gl.enableVertexAttribArray(attr);
        gl.vertexAttribPointer(attr, size, gl.FLOAT, false, 0, 0);
        this.#buffers.push(buffer);
    }

    draw() {
        gl.bindVertexArray(this.#id);
        gl.drawElements(gl.TRIANGLES, this.#count, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }
}

class MainLoop {
    #shader;
    #batch;
    #projection;
    #model;
    #rotation
    #last_time;

    constructor() {
        this.#shader = new Shader(vert, frag);
        this.#projection = mat4.create();
        this.#model = mat4.create();
        this.#rotation = 0.0;
        this.#last_time = 0;

        const positions = [
            -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1,
            -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
        ];
        const indices = [
            1, 2, 0, 2, 3, 0, 6, 2, 1, 1, 5, 6, 6, 5, 4, 4, 7, 6,
            6, 3, 2, 7, 3, 6, 3, 7, 0, 7, 4, 0, 5, 1, 0, 4, 5, 0
        ];
        this.#batch = new Batch(this.#shader, positions, indices);

        this.update_projection();
        this.#update_model();
    }

    update_projection() {
        mat4.perspective(
            this.#projection,
            toRadian(45.0),
            canvas.width / canvas.height,
            0.1, 100.0
        );
    }

    #update_model() {
        this.#model = mat4.create();
        mat4.translate(this.#model, this.#model, [0.0, 0.0, -6.0]);
        mat4.rotate(this.#model, this.#model, this.#rotation, [0, 0, 1]);
        mat4.rotate(this.#model, this.#model, this.#rotation * 0.7, [0, 1, 0]);
    }

    update(time = 0) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let delta_time = time - this.#last_time;
        this.#rotation += (delta_time * 0.001) % 360;

        this.#update_model();

        this.#shader.bind();
        this.#shader.upload_mat4("projection", this.#projection);
        this.#shader.upload_mat4("model", this.#model);

        gl.viewport(0, 0, canvas.width, canvas.height);
        this.#batch.draw();
        requestAnimationFrame(t => this.update(t));
        this.#last_time = time;
    }
}

const main = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const main_loop = new MainLoop();
    main_loop.update();
    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        main_loop.update_projection();
    });
};
