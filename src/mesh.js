export const makeCube = ({ position = [0, 0, 0], edge = 1, color = [0, 0, 0] } = {}) => {
  const [x, y, z] = position;
  // points => 4 from bottom face, clockwise, starting at the top left, then right face, same order.
  const points = [
    // bottom face, clock wise from top left point
    [x, y, z],
    [x + edge, y, z],
    [x + edge, y, z + edge],
    [x, y, z + edge],
    // top face, clock wise from top left point
    [x, y + edge, z],
    [x + edge, y + edge, z],
    [x + edge, y + edge, z + edge],
    [x, y + edge, z + edge],
  ];

  let transform = new DOMMatrix();

  function getTriFacesVertices() {
    return [
      // bottom face
      points[1],
      points[2],
      points[3],
      points[1],
      points[3],
      points[0],
      // top face
      points[4],
      points[7],
      points[6],
      points[4],
      points[6],
      points[5],
      // left face
      points[4],
      points[0],
      points[3],
      points[4],
      points[3],
      points[7],
      // right face
      points[6],
      points[2],
      points[1],
      points[6],
      points[1],
      points[5],
      // front face
      points[7],
      points[3],
      points[2],
      points[7],
      points[2],
      points[6],
      // back face
      points[5],
      points[1],
      points[0],
      points[5],
      points[0],
      points[4],

    ].flat();
  }

  return {
    points,
    getTriFacesVertices,
    getTransform() {
      return transform;
    },
    getColor() {
      return color;
    },
    rotate(x = 0, y = 0, z = 0) {
      transform.rotateSelf(x, y, z);
    },
  }
}