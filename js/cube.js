class Cube {
    constructor(size = 1) {
        size *= 0.5;
        this.vertices = [
            -size, -size, -size,
            size, -size, -size,
            size, size, -size,
            -size, size, -size,
            -size, -size, size,
            size, -size, size,
            size, size, size,
            -size, size, size,
        ];
        this.indices = [
            1, 2, 0, 2, 3, 0, 6, 2, 1, 1, 5, 6, 6, 5, 4, 4, 7, 6,
            6, 3, 2, 7, 3, 6, 3, 7, 0, 7, 4, 0, 5, 1, 0, 4, 5, 0
        ];
    }
}
