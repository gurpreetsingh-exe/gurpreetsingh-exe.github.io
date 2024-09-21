class Engine {
    #shader;
    #batch;
    #projection;
    #model;
    #rotation

    constructor() {
        this.#shader = new Shader(vert, frag);
        this.#projection = mat4.create();
        this.#model = mat4.create();
        this.#rotation = 0.0;

        const mesh = new IcoSphere(4, 1.5);
        this.#batch = new Batch(this.#shader, mesh.vertices, mesh.indices);

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

    update(delta_time) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.#rotation += delta_time * 0.1 % 360;

        this.#update_model();

        this.#shader.bind();
        this.#shader.upload_mat4("projection", this.#projection);
        this.#shader.upload_mat4("model", this.#model);

        gl.viewport(0, 0, canvas.width, canvas.height);
        this.#batch.draw();
    }
}
