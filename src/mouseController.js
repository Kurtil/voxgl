import glMatrix from "./lib/gl-matrix.js";

export default (input, camera) => ({
  input,
  camera,
  velocity: 1.0,
  tick(td) {
    if (this.camera == null) return;
    if (this.input.mouse.down) {
      const x = this.input.mouse.x - this.input.element.width * 0.5;
      const y = this.input.mouse.y - this.input.element.height * 0.5;
      this.camera.yaw += 0.001 * x * td / 1000;
      this.camera.pitch += 0.001 * y * td / 1000;
    }

    const inverseRotation = this.camera.getInverseRotation();
    const direction = glMatrix.vec3.create();

    if (this.input.keys.W || this.input.keys.UP) {
      direction[2] = -1;
    }
    else if (this.input.keys.S || this.input.keys.DOWN) {
      direction[2] = 1;
    }
    if (this.input.keys.A || this.input.keys.LEFT) {
      direction[0] = -1;
    }
    else if (this.input.keys.D || this.input.keys.RIGHT) {
      direction[0] = 1;
    }
    glMatrix.vec3.scale(glMatrix.vec3.normalize(direction), td / 1000 * this.velocity);
    glMatrix.mat4.multiplyVec3(inverseRotation, direction);
    glMatrix.vec3.add(this.camera.position, direction);
  }
});
