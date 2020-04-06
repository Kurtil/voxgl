import { vec3, vec4, mat4, quat } from "gl-matrix";

const scene = {};

function extend() { // TODO what is is used for ???
  var target = arguments[0],
    i, argument, name, f, value;
  for (i = 1; i < arguments.length; i++) {
    argument = arguments[i];
    if (typeof argument == 'function') {
      argument = argument.prototype;
    }
    for (name in argument) {
      value = argument[name];
      if (value === undefined) continue;
      if (typeof value == 'function') {
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
  position: vec3.fromValues(0, 0, 10),
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
    mat4.multiply(wvp, projection, worldView);
    graph.uniforms.worldViewProjection = wvp;
    graph.uniforms.worldView = worldView;
    graph.uniforms.projection = projection;
    graph.uniforms.eye = this.position;
  },
  project(point, graph) {
    const mvp = mat4.create();
    mat4.multiply(mvp, this.getProjection(graph), this.getWorldView());
    const projected = vec4.transformMat4(vec4.create(), point, mvp);
    vec4.scale(projected, 1 / projected[3]);
    return projected;
  },
  exit(graph) {
    graph.popUniforms();
  },
  getInverseRotation() {
    return mat4.invert(mat4.create(), this.getRotation());
  },
  getRotation() {
    return mat4.fromQuat(mat4.create(), mat4.getRotation(quat.create(), this.getWorldView()));;
  },
  getProjection(graph) {
    return mat4.perspective(mat4.create(), this.fov, graph.viewportWidth / graph.viewportHeight, this.near, this.far);
  },
  getWorldView() {
    const matrix = mat4.identity(mat4.create());
    mat4.rotateX(matrix, matrix, this.pitch);
    mat4.rotateY(matrix, matrix, this.yaw);
    mat4.translate(matrix, matrix, vec3.negate(vec3.create(), this.position))
    return matrix;
  }
});

const makePostprocess = (shader, uniforms) => {
  const mesh = new scene.SimpleMesh(new glUtils.VBO(mesh.screen_quad()));
  const material = new scene.Material(shader, uniforms, [mesh]);
  return Object.assign(makeNode(children), {
    children: [material]
  });
}

const makeTransform = (children = []) => Object.assign(makeNode(children), {
  children: children || [],
  matrix: mat4.identity(mat4.create()),
  aux: mat4.create(),
  enter(graph) {
    graph.pushUniforms();
    if (graph.uniforms.modelTransform) {
      mat4.multiply(this.aux, graph.uniforms.modelTransform, this.matrix);
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
