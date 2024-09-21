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
