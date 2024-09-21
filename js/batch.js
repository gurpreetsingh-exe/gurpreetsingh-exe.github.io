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
