import mesh from "./mesh.js";
import { makeVBO } from "./webglUtils.js";
import glMatrix from "./lib/gl-matrix.js";

const scene = {};

function extend() { // TODO what is is used for ???
  var target = arguments[0],
      i, argument, name, f, value;
  for(i = 1; i < arguments.length; i++) {
      argument = arguments[i];
      if(typeof argument == 'function'){
          argument = argument.prototype;
      }
      for(name in argument) {
          value = argument[name];
          if(value === undefined) continue;
          if(typeof value == 'function'){
              value.name = name;
          }
          target[name] = value;
      }
  }
  return target;
};

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

export const makeGraph = gl => ({
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

export const makeMaterial = (shader, uniforms, children) => Object.assign(makeNode(children), {
  shader,
  uniforms,
  children,
  enter(graph) {
    graph.pushShader(this.shader);
    this.shader.use();
    // uniforms enter method call
    for (var uniform in this.uniforms) {
      var value = this.uniforms[uniform];
      if (value.bindTexture) {
        value.bindTexture(graph.pushTexture());
      }
    }
    graph.pushUniforms();
    extend(graph.uniforms, this.uniforms); // TODO what is it for ?
  },
  exit(graph) {
    for (var uniform in this.uniforms) {
      var value = this.uniforms[uniform];
      if (value.bindTexture) {
        value.unbindTexture();
        graph.popTexture();
      }
    }
    graph.popUniforms();
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
    gl.viewport(0, 0, graph.viewportWidth, graph.viewportHeight); // TODO ???
  }
});

export const makeCamera = children => Object.assign(makeNode(children), {
  position: glMatrix.vec3.create([0, 0, 10]),
  pitch: 0.0,
  yaw: 0.0,
  near: 0.1,
  far: 5000,
  fov: 50,
  enter(graph) {
    const projection = this.getProjection(graph);
    const worldView = this.getWorldView();
    const wvp = glMatrix.mat4.create();

    graph.pushUniforms();
    glMatrix.mat4.multiply(projection, worldView, wvp);
    graph.uniforms.worldViewProjection = wvp;
    graph.uniforms.worldView = worldView;
    graph.uniforms.projection = projection;
    graph.uniforms.eye = this.position;
    //this.project([0, 0, 0, 1], scene);
  },
  project(point, graph) {
    const mvp = glMatrix.mat4.create();
    glMatrix.mat4.multiply(this.getProjection(graph), this.getWorldView(), mvp);
    const projected = glMatrix.mat4.multiplyVec4(mvp, point, vec4.create());
    vec4.scale(projected, 1 / projected[3]);
    return projected;
  },
  exit(graph) {
    graph.popUniforms();
  },
  getInverseRotation() {
    return glMatrix.mat3.toMat4(glMatrix.mat4.toInverseMat3(this.getWorldView()));
  },
  getRotationOnly() {
    return glMatrix.mat3.toMat4(glMatrix.mat4.toInverseMat3(this.getWorldView()));
  },
  getProjection(graph) {
    return glMatrix.mat4.perspective(this.fov, graph.viewportWidth / graph.viewportHeight, this.near, this.far);
  },
  getWorldView() {
    const matrix = glMatrix.mat4.identity(glMatrix.mat4.create());
    glMatrix.mat4.rotateX(matrix, this.pitch);
    glMatrix.mat4.rotateY(matrix, this.yaw);
    glMatrix.mat4.translate(matrix, glMatrix.vec3.negate(this.position, glMatrix.vec3.create()));
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
      const worldViewProjection = glMatrix.mat4.create(),
        worldView = glMatrix.mat3.toMat4(glMatrix.mat4.toMat3(graph.uniforms.worldView));
      //glMatrix.mat4.identity(worldView);
      glMatrix.mat4.multiply(graph.uniforms.projection, worldView, worldViewProjection);
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
  return Object.assign(makeNode(children), {
    children: [material]
  });
}

const makeTransform = (children = []) => Object.assign(makeNode(children), {
  children: children || [],
  matrix: glMatrix.mat4.identity(glMatrix.mat4.create()), // TODO thos should be simplifyed
  aux: glMatrix.mat4.create(),
  enter(graph) {
    graph.pushUniforms();
    if (graph.uniforms.modelTransform) {
      glMatrix.mat4.multiply(graph.uniforms.modelTransform, this.matrix, this.aux);
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
  // scene.Node.call(this, children); // TODO this may not work
  const a = plane[0];
  const b = plane[1];
  const c = plane[2];
  return Object.assign(makeNode(children), {
    _plane: vec4.create([plane[0], plane[1], plane[2], 0]),
    _viewPlane: vec4.create(),
    _q: vec4.create(),
    _c: vec4.create(),
    _projection: glMatrix.mat4.create(),
    _worldView: glMatrix.mat4.create([
      1.0 - (2 * a * a), 0.0 - (2 * a * b), 0.0 - (2 * a * c), 0.0,
      0.0 - (2 * a * b), 1.0 - (2 * b * b), 0.0 - (2 * b * c), 0.0,
      0.0 - (2 * a * c), 0.0 - (2 * b * c), 1.0 - (2 * c * c), 0.0,
      0.0, 0.0, 0.0, 1.0
    ]),
    _worldView_: glMatrix.mat4.create(),
    _worldViewProjection: glMatrix.mat4.create(),
    enter(graph) {
      graph.pushUniforms();
      gl.cullFace(gl.FRONT);

      const worldView = graph.uniforms.worldView;
      const projection = glMatrix.mat4.set(graph.uniforms.projection, this._projection);
      const p = this._viewPlane;
      const q = this._q;
      const c = this._c;
      // TODO calculate proper distance
      const w = -graph.uniforms.eye[1];

      glMatrix.mat4.multiplyVec4(worldView, this._plane, p);
      p[3] = w;
      graph.uniforms.worldView = glMatrix.mat4.multiply(graph.uniforms.worldView, this._worldView, this._worldView_);

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

      graph.uniforms.worldViewProjection = glMatrix.mat4.multiply(projection, this._worldView_, this._worldViewProjection);
      graph.uniforms.projection = projection;

    },
    exit(graph) {
      graph.popUniforms();
      gl.cullFace(gl.BACK);
    }
  });
}

export const makeSimpleMesh = (gl, vbo, mode) => ({
  vbo,
  mode: mode,
  visit(graph) {
    const shader = graph.getShader();
    const location = shader.getAttribLocation('a_position');
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
