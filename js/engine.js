class Engine {
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
