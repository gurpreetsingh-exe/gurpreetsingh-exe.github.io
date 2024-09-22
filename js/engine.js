class Engine {
    #shader;
    #batch;
    #projection;
    #model;
    #rotation;
    #quad;
    #framebuffer;
    #screen;

    constructor() {
        this.#shader = new Shader(vert, frag);
        this.#projection = mat4.create();
        this.#model = mat4.create();
        this.#rotation = 0.0;
        this.#framebuffer = new FrameBuffer([
            new AttachmentSpec(gl.TEXTURE_2D, gl.RGBA8),
            new AttachmentSpec(gl.TEXTURE_2D, gl.DEPTH24_STENCIL8),
        ], canvas.width, canvas.height);
        this.#screen = new Shader(tri, texture_draw);

        const mesh = new IcoSphere(4, 1.5);
        this.#batch = new Batch(this.#shader, mesh.vertices, mesh.indices);

        this.update_projection();
        this.#update_model();
        const quad = new Quad();
        this.#quad = new Batch(this.#screen, quad.vertices, quad.indices);
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
        this.#rotation += delta_time * 0.1 % 360;
        this.#update_model();

        this.#framebuffer.bind();
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.#shader.bind();
        this.#shader.upload_mat4("projection", this.#projection);
        this.#shader.upload_mat4("model", this.#model);
        this.#batch.draw();
        this.#framebuffer.unbind();
        gl.disable(gl.DEPTH_TEST);

        gl.enable(gl.BLEND);
        this.#screen.bind();
        gl.bindTexture(gl.TEXTURE_2D, this.#framebuffer.get_texture(0));
        this.#quad.draw();
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.disable(gl.BLEND);
    }
}
