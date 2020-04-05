function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    return shader;
  } else {
    throw `Shader compilation fails : ${gl.getShaderInfoLog(shader)}`;
  }
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return program;
  } else {
    throw `Program linking fails : ${gl.getProgramInfoLog(program)}`;
  }
}

function makeShaderProgram(gl, vertexSource, fragmentSource) {
  const program = createProgram(gl, vertexSource, fragmentSource);

  const uniformLocations = {};
  const uniformValues = {};
  let uniformNames = [];
  const attributeLocations = {};

  function use() {
    gl.useProgram(program);
  }

  function prepareUniforms(values) {
    uniformNames = Object.keys(values);
    for (let uniformName of uniformNames) {
      uniformLocations[uniformName] = gl.getUniformLocation(program, uniformName);
    }
  }

  function uniforms(values) {
    if (uniformNames.length === 0) {
      prepareUniforms(values);
    }
    for (let uniformName of uniformNames) {
      const location = uniformLocations[uniformName];
      const value = values[uniformName];

      if (location === null) continue;

      if (value.uniform) {
        if (!value.equals(uniformValues[uniformName])) {
          value.uniform(location);
          value.set(uniformValues, uniformName);
        }
      }
      else if (value.length) {
        const value2 = uniformValues[uniformName];
        if (value2 !== undefined) {
          for (let j = 0, l = value.length; j < l; j++) {
            if (value[j] != value2[j]) break;
          }
          // already set
          if (j == l) {
            continue;
          }
          else {
            for (j = 0, l = value.length; j < l; j++) {
              value2[j] = value[j];
            }
          }
        }
        else {
          uniformValues[uniformName] = new Float32Array(value);
        }
        switch (value.length) {
          case 2:
            gl.uniform2fv(location, value);
            break;
          case 3:
            gl.uniform3fv(location, value);
            break;
          case 4:
            gl.uniform4fv(location, value);
            break;
          case 9:
            gl.uniformMatrix3fv(location, false, value);
            break;
          case 16:
            gl.uniformMatrix4fv(location, false, value);
            break;

        }
      }
      else {
        if (value != uniformValues[uniformName]) {
          gl.uniform1f(location, value);
          uniformValues[uniformName] = value;
        }

      }
    }
  }

  function getUniformLocation(name) {
    if (uniformLocations[name] === undefined) {
      uniformLocations[name] = gl.getUniformLocation(program, name);
    }
    return uniformLocations[name];
  }
  function getAttribLocation(name) {
    if (!(name in attributeLocations)) {
      const location = gl.getAttribLocation(program, name);
      if (location < 0) {
        throw 'undefined attribute ' + name;
      }
      attributeLocations[name] = location;
    }
    return attributeLocations[name];
  }

}

function makeShaderManager(resources) {
  const shaderPrograms = [];

  // TODO create propert shader manager
}