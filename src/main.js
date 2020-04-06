import frag from "./shaders/basic/frag.js";
import vertex from "./shaders/basic/vertex.js";
import makeClock from "./clock.js";
import makeInputHandler from "./input.js";
import makeShaderManager from "./shaderManager.js";
import { makeGraph, makeCamera, makeMaterial, makeSimpleMesh } from "./scene.js";
import makeMouseController from "./mouseController.js";
import { makeVBO, resize } from "./webglUtils.js";
import mesh from "./mesh.js";

export default ({ canvasId }) => {

  const canvas = document.getElementById(canvasId);
  if (!canvas) throw "Cannot get canvas";
  const gl = canvas.getContext("webgl"); // TODO may options be usefull ? https://github.com/jwagner/voxelworlds/commit/54e3bad4fcf96cf080e3c15f69a4732af5e376cd#diff-d820049859e1e1a271603832a156bb56R106-R111
  if (!gl) throw "Cannot get webgl context";

  const input = makeInputHandler(canvas);

  const shaderManager = makeShaderManager(gl);
  shaderManager.add({ name: "basic", frag, vertex });

  const graph = makeGraph(gl);
  const mousecontroller = makeMouseController(input, null);

  const clock = makeClock();
  clock.on("tick", td => {
    resize(canvas);
    mousecontroller.tick(td);
    graph.draw();
  });

  var shader = makeMaterial(shaderManager.get("basic"), {}, [
    makeSimpleMesh(gl, makeVBO(gl, mesh.cube()), gl.TRIANGLES)
  ]);
  const camera = makeCamera([shader]);
  graph.root.append(camera);
  mousecontroller.camera = camera;
  gl.clearColor(0.5, 0.6, 0.8, 1.0);
  graph.viewportWidth = canvas.clientWidth;
  graph.viewportHeight = canvas.clientHeight;

  clock.start();
};
