class AttachmentSpec {
    constructor(type, format) {
        this.type = type;
        this.format = format;
    }
}

class FrameBuffer {
    #id;
    #spec;
    #color_attachments;
    #depth_attachment;

    constructor(spec, width, height) {
        this.#id = gl.createFramebuffer();
        this.width = width;
        this.height = height;
        this.#spec = spec;
        this.#color_attachments = [];
        this.#depth_attachment = null;
        this.#invalidate();
    }

    #invalidate() {
        this.bind();

        for (const c of this.#color_attachments) {
            gl.deleteTexture(c);
        }
        gl.deleteTexture(this.#depth_attachment);

        for (const s of this.#spec) {
            const texture = gl.createTexture();
            gl.bindTexture(s.type, texture);
            gl.texStorage2D(s.type, 1, s.format, this.width, this.height);
            if (s.format === gl.DEPTH24_STENCIL8) {
                if (this.#depth_attachment) {
                    console.error("depth texture already created");
                }
                gl.framebufferTexture2D(gl.FRAMEBUFFER,
                    gl.DEPTH_STENCIL_ATTACHMENT, s.type, texture, 0);
                this.#depth_attachment = texture;
            } else {
                gl.framebufferTexture2D(gl.FRAMEBUFFER,
                    gl.COLOR_ATTACHMENT0 + this.#color_attachments.length,
                    s.type, texture, 0);
                this.#color_attachments.push(texture);
            }
        }
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
            console.error(`FrameBuffer status incomplete: ${status}`);
        }
        this.unbind();
    }

    bind() {
        gl.viewport(0, 0, this.width, this.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.#id);
    }

    unbind() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    get_texture = (i) => this.#color_attachments[i];

    get_depth() {
        if (this.#depth_attachment) {
            return this.#depth_attachment;
        }
        console.error("depth attachment not found");
    }
}
