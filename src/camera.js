import vect3 from "./vec3.js";

import glMatgrix from "./lib/gl-matrix.js"

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
  const zAxis = vect3.normalize(
    vect3.subtract(cameraPosition, target));
  const xAxis = vect3.normalize(vect3.cross(up, zAxis));
  const yAxis = vect3.normalize(vect3.cross(zAxis, xAxis));

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
  eye = [0, 0, 0],
  look = [0, 0, 0],
  up = [0, 1, 0],
  fieldOfViewInDegrees = 30,
  aspect = 1,
  near = 1,
  far = 1000
}) {
  let cameraMatrix = lookAt(eye, look, up);
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
      cameraMatrix = lookAt(newCameraPosition, look, up);
    },
    setTargetPosition(newTargetPosition) {
      cameraMatrix = lookAt(eye, newTargetPosition, up);
    },
    pivotAngle(xAngle, yAngle) {
      const cameraM = new DOMMatrixReadOnly().translate(...look).rotate(xAngle, yAngle).translate(...vect3.subtract(eye, look));
      eye = [cameraM.m41, cameraM.m42, cameraM.m43];
      cameraMatrix = lookAt(eye, look, up);
    },
    pivot(pitch = 0, yaw = 0) {
      const quatPitch = glMatgrix.quat4.fromAngleAxis(pitch * Math.PI / 180, [1, 0, 0]);
      const quatYaw = glMatgrix.quat4.fromAngleAxis(yaw * Math.PI / 180, [0, 1, 0]);

      const quatOrientation = glMatgrix.quat4.normalize(glMatgrix.quat4.multiply(quatPitch, quatYaw));

      glMatgrix.quat4.normalize(quatOrientation);
      const mat = glMatgrix.mat4.identity();
      glMatgrix.mat4.fromRotationTranslation(quatOrientation, look, mat);
      const sub = vect3.subtract(eye, look);
      console.log(sub)
      glMatgrix.mat4.translate(mat, sub);
      eye = [mat[12], mat[13], mat[14]];
      cameraMatrix = lookAt(eye, look, up);
    }
  }
};
