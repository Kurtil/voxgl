import frag from "./shaders/basic/frag.js";
import vertex from "./shaders/basic/vertex.js";
import makeClock from "./clock.js";

export default async ({ canvasId }) => {

  const canvas = document.getElementById(canvasId);
  if (!canvas) throw "Cannot get canvas";
  const gl = canvas.getContext("webgl");
  if (!gl) throw "Cannot get webgl context";

  const clock = makeClock();
  clock.start();

  return null;
}
