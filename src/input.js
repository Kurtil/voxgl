function clamp(a, b, c) {
  return a < b ? b : (a > c ? c : a);
};

// mapping keycodes to names
const keyname = {
  32: 'SPACE',
  13: 'ENTER',
  9: 'TAB',
  8: 'BACKSPACE',
  16: 'SHIFT',
  17: 'CTRL',
  18: 'ALT',
  20: 'CAPS_LOCK',
  144: 'NUM_LOCK',
  145: 'SCROLL_LOCK',
  37: 'LEFT',
  38: 'UP',
  39: 'RIGHT',
  40: 'DOWN',
  33: 'PAGE_UP',
  34: 'PAGE_DOWN',
  36: 'HOME',
  35: 'END',
  45: 'INSERT',
  46: 'DELETE',
  27: 'ESCAPE',
  19: 'PAUSE'
};

function makeInputHandler(domElement) {
  let offset = { x: 0, y: 0 };
  let onClick = null;
  let onKeyUp = null;
  let onKeyDown = null;
  let hasFocus = true;
  let mouse = {};
  let keys = {};
  let width = 0; // TODO this value should be fixed
  let height = 0; // TODO this value should be fixed

  bind(domElement);
  reset();

  function bind(domElement) {
    const { x, y } = domElement.getBoundingClientRect();
    offset = { x, y };

    document.addEventListener("keydown", e =>
      !keyDown(e.keyCode)
    );

    document.addEventListener("keyup", e =>
      !keyUp(e.keyCode)
    );

    window.addEventListener("click", e => {
      if (e.target !== domElement) {
        blur();
      }
      else {
        focus();
      }
    });

    window.addEventListener("blur", blur);

    document.addEventListener("mousemove", e => {
      mouseMove(e.pageX, e.pageY);
    });
    document.addEventListener("mousedowb", () => {
      mosueDown();
    });
    document.addEventListener("mousemove", () => {
      mouseUp();
    });
    // prevent text selection in browsers that support it
    document.onselectstart = () => false;
  }

  function blur() {
    hasFocus = false;
    reset();
  }
  function focus() {
    if (!hasFocus) {
      hasFocus = true;
      reset();
    }
  }
  function reset() {
    keys = {};
    for (let i = 65; i < 128; i++) {
      keys[String.fromCharCode(i)] = false;
    }
    for (i in keyname) {
      keys[keyname[i]] = false;
    }
    mouse = { down: false, x: 0, y: 0 };
  }
  function keyDown(key) {
    const name = _getKeyName(key);
    const wasDown = keys[name];
    keys[name] = true;
    if (onKeyDown && !wasDown) {
      onKeyDown(name);
    }
    return hasFocus;
  }
  function keyUp(key) {
    const name = _getKeyName(key);
    keys[name] = false;
    if (onKeyUp) {
      onKeyUp(name);
    }
    return hasFocus;
  }
  function mouseDown() {
    mouse.down = true;
  }
  function mouseUp() {
    mouse.down = false;
    if (hasFocus && onClick) {
      onClick(mouse.x, mouse.y);
    }
  }
  function mouseMove(x, y) {
    mouse.x = clamp(x - offset.x, 0, width);
    mouse.y = clamp(y - offset.y, 0, height);
  }
  function _getKeyName(key) {
    if (key in keyname) {
      return keyname[key];
    }
    return String.fromCharCode(key);
  }
}
