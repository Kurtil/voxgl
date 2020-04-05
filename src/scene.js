import mesh from "./mesh.js";
import { createVBO } from "./webglUtils.js";

const scene = {};

const makeNode = (children = []) => ({
  debug: false, // TODO is it usefull ?
  children,
  visit(graph) {
    //if(this.debug) debugger; // TODO is it usefull ?
    this.enter(graph);
    for (let child of children) {
      child.visit(graph);
    }
    this.exit(graph);
  },
  append(child) {
    this.children.push(child);
  },
  enter(graph) {
  },
  exit(graph) {
  }
});

const makeUniformsNode = (uniforms, children) => Object.assign(makeNode(children), {
  uniforms,
  enter(graph) {
    for (let uniform in this.uniforms) {
      const value = this.uniforms[uniform];
      if (value.bindTexture) {
        value.bindTexture(graph.pushTexture());
      }
    }
    graph.pushUniforms();
    extend(graph.uniforms, this.uniforms);
  },
  exit(graph) {
    for (let uniform in this.uniforms) {
      const value = this.uniforms[uniform];
      if (value.bindTexture) {
        value.unbindTexture();
        graph.popTexture();
      }
    }
    graph.popUniforms();
  }
});

const makeGraph = gl => ({
  root: makeNode(),
  uniforms: {},
  shaders: [],
  viewportWidth: 640, // TODO this value may be changed by resize
  viewportHeight: 480, // TODO this value may be changed by resize
  textureUnit: 0,
  statistics: {
    drawCalls: 0,
    vertices: 0
  },
  draw() {

    this.statistics.drawCalls = 0;
    this.statistics.vertices = 0;

    gl.viewport(0, 0, this.viewportWidth, this.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.root.visit(this);
  },
  pushUniforms() {
    this.uniforms = Object.create(this.uniforms);
  },
  popUniforms() {
    this.uniforms = Object.getPrototypeOf(this.uniforms);
  },
  pushTexture() {
    return this.textureUnit++;
  },
  popTexture() {
    this.textureUnit--;
  },
  pushShader(shader) {
    this.shaders.push(shader);
  },
  popShader() {
    this.shaders.pop();
  },
  getShader() {
    return this.shaders[this.shaders.length - 1];
  }
});

const makeMaterial = (shader, uniforms, children) => Object.assign(makeNode(children), {
  shader,
  uniforms,
  children,
  enter(graph) {
    graph.pushShader(this.shader);
    this.shader.use();
    scene.Uniforms.prototype.enter.call(this, graph);
  },
  exit(graph) {
    scene.Uniforms.prototype.exit.call(this, graph);
    graph.popShader();
  }
});

const makeRenderTarget = (fbo, children) => Object.assign(makeNode(children), {
  fbo,
  children,
  enter(graph) {
    this.fbo.bind();
    gl.viewport(0, 0, this.fbo.width, this.fbo.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  },
  exit(graph) {
    // TODO needed?
    this.fbo.unbind();
    gl.viewport(0, 0, graph.viewportWidth, graph.viewportHeight);
  }
});

const makeCamera = children => Object.assign(makeNode(children), {
  position: vec3.create([0, 0, 10]),
  pitch: 0.0,
  yaw: 0.0,
  near: 0.1,
  far: 5000,
  fov: 50,
  enter(graph) {
    const projection = this.getProjection(graph);
    const worldView = this.getWorldView();
    const wvp = mat4.create();

    graph.pushUniforms();
    mat4.multiply(projection, worldView, wvp);
    graph.uniforms.worldViewProjection = wvp;
    graph.uniforms.worldView = worldView;
    graph.uniforms.projection = projection;
    graph.uniforms.eye = this.position;
    //this.project([0, 0, 0, 1], scene);
  },
  project(point, graph) {
    const mvp = mat4.create();
    mat4.multiply(this.getProjection(graph), this.getWorldView(), mvp);
    const projected = mat4.multiplyVec4(mvp, point, vec4.create());
    vec4.scale(projected, 1 / projected[3]);
    return projected;
  },
  exit(graph) {
    graph.popUniforms();
  },
  getInverseRotation() {
    return mat3.toMat4(mat4.toInverseMat3(this.getWorldView()));
  },
  getRotationOnly() {
    return mat3.toMat4(mat4.toInverseMat3(this.getWorldView()));
  },
  getProjection(graph) {
    return mat4.perspective(this.fov, graph.viewportWidth / graph.viewportHeight, this.near, this.far);
  },
  getWorldView() {
    const matrix = mat4.identity(mat4.create());
    mat4.rotateX(matrix, this.pitch);
    mat4.rotateY(matrix, this.yaw);
    mat4.translate(matrix, vec3.negate(this.position, vec3.create()));
    return matrix;
  }
});

const makeSkybox = (scale, shader, uniforms) => {
  const mesh = new scene.SimpleMesh(new glUtils.VBO(mesh.cube(scale))); // TODO no news ... factories !
  const material = new scene.Material(shader, uniforms, [mesh]); // TODO no news ... factories !
  const children = [material];
  return Object.assign(makeNode(children), {
    enter(graph) {
      graph.pushUniforms();
      const worldViewProjection = mat4.create(),
        worldView = mat3.toMat4(mat4.toMat3(graph.uniforms.worldView));
      //mat4.identity(worldView);
      mat4.multiply(graph.uniforms.projection, worldView, worldViewProjection);
      graph.uniforms.worldViewProjection = worldViewProjection;
    },
    exit(graph) {
      graph.popUniforms();
    }
  });
}

const makePostprocess = (shader, uniforms) => {
  const mesh = new scene.SimpleMesh(new glUtils.VBO(mesh.screen_quad()));
  const material = new scene.Material(shader, uniforms, [mesh]);
  this.children = [material];
  return Object.assign(makeNode(children), {});
}

const makeTransform = (children = []) => Object.assign(makeNode(children), {
  children: children || [],
  matrix: mat4.identity(mat4.create()), // TODO thos should be simplifyed
  aux: mat4.create(),
  enter(graph) {
    graph.pushUniforms();
    if (graph.uniforms.modelTransform) {
      mat4.multiply(graph.uniforms.modelTransform, this.matrix, this.aux);
      graph.uniforms.modelTransform = this.aux;
    }
    else {
      graph.uniforms.modelTransform = this.matrix;
    }
  },
  exit(graph) {
    graph.popUniforms();
  }
});

function sign(x) {
  return x >= 0 ? 1 : -1;
}

const makeMirror = (plane, children) => {
  scene.Node.call(this, children); // TODO this may not work
  const a = plane[0];
  const b = plane[1];
  const c = plane[2];
  return Object.assign(makeNode(children), {
    _plane = vec4.create([plane[0], plane[1], plane[2], 0]),
    _viewPlane = vec4.create(),
    _q = vec4.create(),
    _c = vec4.create(),
    _projection = mat4.create(),
    _worldView = mat4.create([
      1.0 - (2 * a * a), 0.0 - (2 * a * b), 0.0 - (2 * a * c), 0.0,
      0.0 - (2 * a * b), 1.0 - (2 * b * b), 0.0 - (2 * b * c), 0.0,
      0.0 - (2 * a * c), 0.0 - (2 * b * c), 1.0 - (2 * c * c), 0.0,
      0.0, 0.0, 0.0, 1.0
    ]),
    _worldView_ = mat4.create(),
    _worldViewProjection = mat4.create(),
    enter(graph) {
      graph.pushUniforms();
      gl.cullFace(gl.FRONT);

      const worldView = graph.uniforms.worldView,
        projection = mat4.set(graph.uniforms.projection, this._projection),
        p = this._viewPlane,
        q = this._q,
        c = this._c,
        // TODO calculate proper distance
        w = -graph.uniforms.eye[1];

      mat4.multiplyVec4(worldView, this._plane, p);
      p[3] = w;
      graph.uniforms.worldView = mat4.multiply(graph.uniforms.worldView, this._worldView, this._worldView_);

      q[0] = (sign(p.x) + projection[8]) / projection[0];
      q[1] = (sign(p.y) + projection[9]) / projection[5];
      q[2] = -1;
      q[3] = (1.0 + projection[10]) / projection[14];

      // scaled plane
      const dotpq = p[0] * q[0] + p[1] * q[1] + p[2] * q[2] + p[3] * q[3];
      c = vec4.scale(p, 2.0 / dotpq);

      projection[2] = c[0];
      projection[6] = c[1];
      projection[10] = c[2] + 1.0;
      projection[14] = c[3];

      graph.uniforms.worldViewProjection = mat4.multiply(projection, this._worldView_, this._worldViewProjection);
      graph.uniforms.projection = projection;

    },
    exit(graph) {
      graph.popUniforms();
      gl.cullFace(gl.BACK);
    }
  });
}


const makeSimpleMesh = (vbo, mode) => Object.assign(makeNode(children), {
  vbo,
  mode: mode || gl.TRIANGLES, // TODO where does gl come from ?
  visit(graph) {
    const shader = graph.getShader();
    const location = shader.getAttribLocation('position');
    const stride = 0;
    const offset = 0;
    const normalized = false;

    this.vbo.bind();

    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 3, gl.FLOAT, normalized, stride, offset);

    shader.uniforms(graph.uniforms);

    graph.statistics.drawCalls++;
    graph.statistics.vertices += this.vbo.length / 3;

    this.draw();

    this.vbo.unbind();
  },
  draw() {
    this.vbo.draw(this.mode);
  }
});
