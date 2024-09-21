class Timer {
    constructor(delta_time = 1 / 30) {
        let accumulated_time = 0;
        let last_time = null;

        this.update_proxy = (time) => {
            if (last_time) {
                accumulated_time += (time - last_time) / 1000;
                if (accumulated_time > 1) {
                    accumulated_time = 1;
                }

                while (accumulated_time > delta_time) {
                    this.update(delta_time);
                    accumulated_time -= delta_time;
                }
            }

            last_time = time;
            this.enqueue();
        }
    }

    enqueue() {
        requestAnimationFrame(this.update_proxy);
    }

    start() {
        this.enqueue();
    }
}
