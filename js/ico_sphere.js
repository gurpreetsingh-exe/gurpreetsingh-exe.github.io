const normalize = (vec) => {
    const length = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
    return [vec[0] / length, vec[1] / length, vec[2] / length];
}

const times = (v, t) => [v[0] * t, v[1] * t, v[2] * t];

const midpoint = (v1, v2) => normalize([
    (v1[0] + v2[0]) / 2,
    (v1[1] + v2[1]) / 2,
    (v1[2] + v2[2]) / 2
]);

class IcoSphere {
    constructor(subdivisions = 3, radius = 1) {
        const vertices = [
            [1.0, 0.0, 0.0],
            [0.447213595500, 0.894427191000, 0.0],
            [0.447213595500, 0.276393202252, 0.850650808354],
            [0.447213595500, -0.723606797748, 0.525731112119],
            [0.447213595500, -0.723606797748, -0.525731112119],
            [0.447213595500, 0.276393202252, -0.850650808354],
            [-0.447213595500, -0.894427191000, 0.0],
            [-0.447213595500, -0.276393202252, 0.850650808354],
            [-0.447213595500, 0.723606797748, 0.525731112119],
            [-0.447213595500, 0.723606797748, -0.525731112119],
            [-0.447213595500, -0.276393202252, -0.850650808354],
            [-           1.0, 0.0, 0.0]
        ];

        const indices = [
            [0, 1, 2],
            [0, 2, 3],
            [0, 3, 4],
            [0, 4, 5],
            [0, 5, 1],
            [1, 8, 2],
            [2, 7, 3],
            [3, 6, 4],
            [4, 10, 5],
            [5, 9, 1],
            [1, 9, 8],
            [2, 8, 7],
            [3, 7, 6],
            [4, 6, 10],
            [5, 10, 9],
            [11, 9, 10],
            [11, 8, 9],
            [11, 7, 8],
            [11, 6, 7],
            [11, 10, 6]
        ];

        const refined_indices = subdivisions === 0 ? indices : this.#subdivide(indices, vertices, subdivisions);
        this.vertices = [];
        this.indices = [];

        for (const v of vertices) {
            this.vertices.push(...times(v, radius));
        }
        for (const i of refined_indices) {
            this.indices.push(...i);
        }
    }

    #subdivide(indices, vertices, depth) {
        let new_indices = [];
        let midpoint_cache = {};

        const get_midpoint = (i1, i2) => {
            const smaller_index = Math.min(i1, i2);
            const larger_index = Math.max(i1, i2);
            const key = smaller_index + '_' + larger_index;
            if (!(key in midpoint_cache)) {
                const midpoint_vertex = midpoint(vertices[i1], vertices[i2]);
                midpoint_cache[key] = vertices.length;
                vertices.push(midpoint_vertex);
            }
            return midpoint_cache[key];
        }

        for (let tri of indices) {
            let [i1, i2, i3] = tri;

            let a = get_midpoint(i1, i2);
            let b = get_midpoint(i2, i3);
            let c = get_midpoint(i3, i1);

            new_indices.push([i1, a, c]);
            new_indices.push([i2, b, a]);
            new_indices.push([i3, c, b]);
            new_indices.push([a, b, c]);
        }

        return depth > 1
            ? this.#subdivide(new_indices, vertices, depth - 1)
            : new_indices;
    }


}
