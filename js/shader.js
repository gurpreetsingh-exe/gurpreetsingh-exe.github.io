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

    upload_mat4(name, mat) {
        gl.uniformMatrix4fv(this.#get_uniform_location(name), false, mat);
    }

    upload_float(name, f) {
        gl.uniform1f(this.#get_uniform_location(name), f);
    }

    upload_vec3(name, vec) {
        gl.uniform3f(this.#get_uniform_location(name), ...vec);
    }

    upload_vec4(name, vec) {
        gl.uniform4f(this.#get_uniform_location(name), ...vec);
    }

    upload_sampler(name, sampler) {
        gl.uniform1i(this.#get_uniform_location(name), sampler);
    }
}
