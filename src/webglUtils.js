export function resize(canvas) {
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    if (canvas.width != displayWidth ||
        canvas.height != displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }
    return canvas;
}

export function createTexture2D(gl, image) {
    const texture = gl.createTexture();
    bindTexture();
    let unit = -1;

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.generateMipmap(gl.TEXTURE_2D);

    function bindTexture(unitToBind) {
        if (unitToBind !== undefined) {
            gl.activeTexture(gl.TEXTURE0 + unitToBind);
            unit = unitToBind;
        }
        gl.bindTexture(gl.TEXTURE_2D, texture);
    }
    function unbindTexture() {
        gl.activeTexture(gl.TEXTURE0 + unit); // TODO is it really necessary ?
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    function uniform(location) { // TODO should we use it ?
        gl.uniform1i(location, unit);
    }
    function equals(value) { // TODO should we use it ?
        return unit === value;
    }
    function set(obj, name) { // TODO should we use it ?
        obj[name] = unit;
    }

    return {
        // TODO what should we expose ?
    }
}

export function createVBO(gl, data) {
    const buffer = gl.createBuffer();
    bind();
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    unbind();
    const length = data.length;

    function bind() {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    }
    function unbind() {
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
    function draw(mode) {
        gl.drawArrays(mode, 0, length / 3);
    }

    return {
        draw
    }
}

export function createFBO(gl, width, height, format) {
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, format || gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const depth = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    let unit = -1; // TODO is it really usefull ?

    function bind() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    }
    function unbind() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    // TODO should we extend texture2D ?

    return {
        bind,
        unbind
    }
}
