export function perspective(fieldOfViewInDegrees, aspect, near, far) {
  const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInDegrees * Math.PI / 180);
  const rangeInv = 1.0 / (near - far);

  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * rangeInv, -1,
    0, 0, near * far * rangeInv * 2, 0
  ]);
};
