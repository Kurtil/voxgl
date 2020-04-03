import {
  createShader,
  createProgram,
  resize
} from "./webglUtils.js";

import makeClock from "./clock.js";

import { makePerspectiveCamera } from "./camera.js";

// INITIALIZATION

export default () => {
  const canvas = document.getElementById("canvas3d");
  canvas.width = 800;
  canvas.height = 600;
  const gl = canvas.getContext("webgl");

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.8, 0.8, 0.8, 1.0);

  const vertexShaderSource = document.getElementById("2d-vertex-shader").text;
  const fragmentShaderSource = document.getElementById("2d-fragment-shader").text;

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  const program = createProgram(gl, vertexShader, fragmentShader);

  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  const colorAttributeLocation = gl.getUniformLocation(program, "a_color");

  const modelMatrixUniformLocation = gl.getUniformLocation(program, "u_mMat");
  const viewMatrixUniformLocation = gl.getUniformLocation(program, "u_vMat");
  const projectionMatrixUniformLocation = gl.getUniformLocation(program, "u_pMat");

  const verticesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

  // three 2d points
  const vertices = [
    // Front face
    0, 0, 0, 1, 0, 0,
    1, 0, 0, 1, 0, 0,
    0, 1, 0, 1, 0, 0,
    0, 1, 0, 1, 0, 0,
    1, 0, 0, 1, 0, 0,
    1, 1, 0, 1, 0, 0,
    // Back face
    1, 0, -1, 0, 1, 0,
    0, 0, -1, 0, 1, 0,
    1, 1, -1, 0, 1, 0,
    1, 1, -1, 0, 1, 0,
    0, 0, -1, 0, 1, 0,
    0, 1, -1, 0, 1, 0,
    // Top face
    0, 1, 0, 0, 0, 1,
    1, 1, 0, 0, 0, 1,
    0, 1, -1, 0, 0, 1,
    0, 1, -1, 0, 0, 1,
    1, 1, 0, 0, 0, 1,
    1, 1, -1, 0, 0, 1,
    // Bottom face
    0, 0, -1, 1, 1, 0,
    1, 0, -1, 1, 1, 0,
    0, 0, 0, 1, 1, 0,
    0, 0, 0, 1, 1, 0,
    1, 0, -1, 1, 1, 0,
    1, 0, 0, 1, 1, 0,
    // Right face
    1, 0, 0, 1, 0, 1,
    1, 0, -1, 1, 0, 1,
    1, 1, 0, 1, 0, 1,
    1, 1, 0, 1, 0, 1,
    1, 0, -1, 1, 0, 1,
    1, 1, -1, 1, 0, 1,
    // Left face
    0, 0, -1, 0, 1, 1,
    0, 0, 0, 0, 1, 1,
    0, 1, -1, 0, 1, 1,
    0, 1, -1, 0, 1, 1,
    0, 0, 0, 0, 1, 1,
    0, 1, 0, 0, 1, 1,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  const camera = makePerspectiveCamera({
    aspect: gl.canvas.clientWidth / gl.canvas.clientHeight,
    eye: [0.5, 0.5, 0],
    look: [0, 0, -20]
  });

  const clock = makeClock();
  clock.start();

  // RENDERING

  const modelM = new DOMMatrix().translate(0, 0, -20);

  clock.on("tick", () => {

    // gobal state
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // object state
    // set attributes
    gl.useProgram(program);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.enableVertexAttribArray(colorAttributeLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.vertexAttribPointer(
      positionAttributeLocation, 3, gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * 6, 0);
    gl.vertexAttribPointer(
      colorAttributeLocation, 3, gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * 6, Float32Array.BYTES_PER_ELEMENT * 3);

    // set matrices
    const projectionM = camera.getProjectionMatrix();
    const viewM = camera.getViewMatrix();
    gl.uniformMatrix4fv(modelMatrixUniformLocation, false, modelM.toFloat32Array());
    gl.uniformMatrix4fv(viewMatrixUniformLocation, false, viewM.toFloat32Array());
    gl.uniformMatrix4fv(projectionMatrixUniformLocation, false, projectionM.toFloat32Array());

    // draw
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 6);
  });
}
