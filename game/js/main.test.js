const assert = require('assert');
const {
  init,
  setupButtonInteractions,
  setupTitleAnimation,
  toggleOptionsModal,
} = require('./main');

function createClassList() {
  return {
    _set: new Set(),
    add(token) {
      this._set.add(token);
    },
    remove(token) {
      this._set.delete(token);
    },
    toggle(token, force) {
      if (typeof force === 'boolean') {
        if (force) this._set.add(token);
        else this._set.delete(token);
        return force;
      }
      if (this._set.has(token)) {
        this._set.delete(token);
        return false;
      }
      this._set.add(token);
      return true;
    },
    contains(token) {
      return this._set.has(token);
    },
  };
}

function createButton() {
  return {
    listeners: {},
    addEventListener(type, handler) {
      this.listeners[type] = handler;
    },
    click() {
      if (this.listeners.click) {
        this.listeners.click();
      }
    },
  };
}

function createDocument() {
  const start = createButton();
  const options = createButton();
  const close = createButton();
  const modal = {
    classList: createClassList(),
    setAttribute(name, value) {
      this[name] = value;
    },
  };
  const body = { classList: createClassList() };

  return {
    body,
    elements: { start, options, close, modal },
    querySelector(selector) {
      switch (selector) {
        case '[data-action="start"]':
          return start;
        case '[data-action="options"]':
          return options;
        case '.options-modal':
          return modal;
        case '.game-title':
          return null;
        default:
          return null;
      }
    },
    querySelectorAll(selector) {
      if (selector === '[data-action="close-options"]') {
        return [close];
      }
      return [];
    },
  };
}

(function shouldToggleModalClassAndAria() {
  const doc = createDocument();
  toggleOptionsModal(doc, true);
  assert.strictEqual(doc.elements.modal.classList.contains('is-open'), true);
  assert.strictEqual(doc.elements.modal['aria-hidden'], 'false');

  toggleOptionsModal(doc, false);
  assert.strictEqual(doc.elements.modal.classList.contains('is-open'), false);
  assert.strictEqual(doc.elements.modal['aria-hidden'], 'true');
})();

(function shouldHookButtonsToBodyAndModal() {
  const doc = createDocument();
  setupButtonInteractions(doc);

  doc.elements.start.click();
  assert.strictEqual(doc.body.classList.contains('game-active'), true);

  doc.elements.options.click();
  assert.strictEqual(doc.elements.modal.classList.contains('is-open'), true);

  doc.elements.close.click();
  assert.strictEqual(doc.elements.modal.classList.contains('is-open'), false);
})();

(function shouldAnimateTitleWhenPresent() {
  let frameCount = 0;
  const raf = (fn) => {
    frameCount += 1;
    if (frameCount < 4) {
      fn();
    }
  };

  const doc = {
    querySelector(selector) {
      if (selector === '.game-title') {
        return { style: {} };
      }
      return null;
    },
  };

  setupTitleAnimation(doc, raf);
  assert.ok(frameCount >= 1, 'animation loop should run at least once');
})();

(function shouldInitWithoutCrashing() {
  const doc = createDocument();
  const api = init(doc);

  assert.strictEqual(typeof api.toggleOptionsModal, 'function');
  api.toggleOptionsModal(true);
  assert.strictEqual(doc.elements.modal.classList.contains('is-open'), true);
})();

console.log('All tests passed');
