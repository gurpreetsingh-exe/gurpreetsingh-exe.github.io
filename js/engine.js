class Engine {
    #shader;
    #batch;
    #view;
    #projection;
    #model;
    #rotation;
    #quad;
    #framebuffer;
    #screen;
    #position;
    #direction;
    #time;

    constructor() {
        this.#shader = new Shader(vert, frag);
        this.#projection = mat4.create();
        this.#model = mat4.create();
        this.#view = mat4.create();
        this.#rotation = 0.0;
        this.#framebuffer = new FrameBuffer([
            new AttachmentSpec(gl.TEXTURE_2D, gl.RGBA8),
            new AttachmentSpec(gl.TEXTURE_2D, gl.DEPTH24_STENCIL8),
        ], canvas.width, canvas.height);
        this.#screen = new Shader(tri, planet);

        const mesh = new IcoSphere(4, 1.5);
        this.#batch = new Batch(this.#shader, mesh.vertices, mesh.indices);

        this.update_projection();
        this.#update_model();
        const quad = new Quad();
        this.#quad = new Batch(this.#screen, quad.vertices, quad.indices);

        this.#position = vec3.fromValues(0, 0, -6);
        this.#direction = vec3.create();
        vec3.negate(this.#direction, this.#position);
        this.#update_view();
        this.#time = 0.0;
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
        // mat4.translate(this.#model, this.#model, [0.0, 0.0, -6.0]);
        mat4.rotate(this.#model, this.#model, this.#rotation, [0, 0, 1]);
        mat4.rotate(this.#model, this.#model, this.#rotation * 0.7, [0, 1, 0]);
    }

    #update_view() {
        this.#view = mat4.create();
        const focus = vec3.create();
        vec3.add(focus, this.#position, this.#direction);
        vec3.normalize(focus, focus);
        mat4.lookAt(this.#view, this.#position, focus, vec3.fromValues(0, 1, 0));
    }

    update(delta_time) {
        this.#rotation += delta_time * 0.1 % 360;
        this.#update_model();
        this.#update_view();
        this.#screen.bind();
        this.#screen.upload_float("time", this.#time);
        this.#screen.upload_mat4("projection", this.#projection);
        this.#screen.upload_mat4("model", this.#model);
        this.#screen.upload_mat4("view", this.#view);
        this.#screen.upload_vec3("ray_origin", this.#position);
        this.#screen.upload_vec4("viewport", [0, 0, canvas.width, canvas.height]);
        this.#quad.draw();
        gl.disable(gl.DEPTH_TEST);
        this.#time += delta_time;
    }
}
