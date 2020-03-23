import vec3 from "./vec3.js";

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

function lookAt(cameraPosition, target, up) {
  const zAxis = vec3.normalize(
    vec3.subtract(cameraPosition, target));
  const xAxis = vec3.normalize(vec3.cross(up, zAxis));
  const yAxis = vec3.normalize(vec3.cross(zAxis, xAxis));

  return new Float32Array([
    xAxis[0], xAxis[1], xAxis[2], 0,
    yAxis[0], yAxis[1], yAxis[2], 0,
    zAxis[0], zAxis[1], zAxis[2], 0,
    cameraPosition[0],
    cameraPosition[1],
    cameraPosition[2],
    1,
  ]);
}

export function makePerspectiveCamera({
  cameraPosition = [0, 0, 0],
  targetPosition = [0, 0, 0],
  up = [0, 1, 0],
  fieldOfViewInDegrees = 30,
  aspect = 1,
  near = 1,
  far = 1000
}) {
  let position = cameraPosition;
  let target = targetPosition;
  let cameraMatrix = lookAt(position, target, up);
  let projectionMatrix = perspective(fieldOfViewInDegrees, aspect, near, far);

  // TODO camera should not be dependant of DOMMatrixReadOnly

  return {
    getViewMatrix() {
      return DOMMatrixReadOnly.fromFloat32Array(cameraMatrix).inverse();
    },
    getProjectionMatrix() {
      return DOMMatrixReadOnly.fromFloat32Array(projectionMatrix);
    },
    setCameraPosition(newCameraPosition) {
      cameraMatrix = lookAt(newCameraPosition, target, up);
    },
    setTargetPosition(newTargetPosition) {
      cameraMatrix = lookAt(position, newTargetPosition, up);
    },
    pivot(xAngle = 0, yAngle = 0) {
      const cameraM = new DOMMatrixReadOnly().translate(...target).rotate(xAngle, yAngle).translate(...vec3.subtract(position, target));
      position = [cameraM.m41, cameraM.m42, cameraM.m43];
      cameraMatrix = lookAt(position, target, up);
    }
  }
}
