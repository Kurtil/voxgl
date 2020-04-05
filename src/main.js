import frag from "./shaders/basic/frag.js";
import vertex from "./shaders/basic/vertex.js";
import makeClock from "./clock.js";

export default async ({ canvasId }) => {

  const canvas = document.getElementById(canvasId);
  if (!canvas) throw "Cannot get canvas";
  const gl = canvas.getContext("webgl"); // TODO may options be usefull ? https://github.com/jwagner/voxelworlds/commit/54e3bad4fcf96cf080e3c15f69a4732af5e376cd#diff-d820049859e1e1a271603832a156bb56R106-R111
  if (!gl) throw "Cannot get webgl context";

  const clock = makeClock();
  clock.start();

  return null;
}
