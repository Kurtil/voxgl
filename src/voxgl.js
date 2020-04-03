import {
  createShader,
  createProgram,
  resize
} from "./webglUtils.js";

import makeClock from "./clock.js";

import { makePerspectiveCamera } from "./camera.js";

import { makeCube } from "./mesh.js";

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

  const modelMatrixUniformLocation = gl.getUniformLocation(program, "u_mMat");
  const viewMatrixUniformLocation = gl.getUniformLocation(program, "u_vMat");
  const projectionMatrixUniformLocation = gl.getUniformLocation(program, "u_pMat");
  const colorUniformLocation = gl.getUniformLocation(program, "u_color");

  const meshes = [];
  const cube1 = makeCube();
  const cube2 = makeCube({ position: [1, 0, 0], edge: 2, color: [1, 0, 0] });
  const cube3 = makeCube({ position: [3, 0, 0], color: [0, 1, 0] });
  const cube4 = makeCube({ position: [-4, 0, 0], edge: 3, color: [0, 0, 1] });
  const cube5 = makeCube({ position: [-7, 0, 0], edge: 2, color: [1, 1, 0] });

  meshes.push(cube1, cube2, cube3, cube4, cube5);

  const camera = makePerspectiveCamera({
    aspect: gl.canvas.clientWidth / gl.canvas.clientHeight,
    eye: [-5, 5, 20],
    look: [0, 0, -20]
  });

  const clock = makeClock();
  clock.start();

  // RENDERING

  clock.on("tick", () => {

    cube5.rotate(1);
    cube2.rotate(0, 2);

    // gobal state
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // mesh rendering
    meshes.forEach(mesh => {
      // set attributes
      gl.useProgram(program);
      gl.enableVertexAttribArray(positionAttributeLocation);

      const vertices = mesh.getTriFacesVertices();

      const verticesBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

      gl.vertexAttribPointer(
        positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

      // set matrices
      const projectionM = camera.getProjectionMatrix();
      const viewM = camera.getViewMatrix();
      gl.uniformMatrix4fv(modelMatrixUniformLocation, false, mesh.getTransform().toFloat32Array());
      gl.uniformMatrix4fv(viewMatrixUniformLocation, false, viewM.toFloat32Array());
      gl.uniformMatrix4fv(projectionMatrixUniformLocation, false, projectionM.toFloat32Array());
      gl.uniform3fv(colorUniformLocation, mesh.getColor());

      // draw
      gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);
    });
  });
}
