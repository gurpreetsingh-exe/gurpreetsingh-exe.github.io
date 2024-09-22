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
precision highp float;

in vec3 color;

out vec4 fragColor;

void main() {
    fragColor = vec4(color, 1);
}
`;
