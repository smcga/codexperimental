'use strict';

const assert = require('assert');
const { setupButtonInteractions, toggleOptionsModal } = require('./main');

function createElement() {
  const listeners = {};
  const attributes = {};
  const classSet = new Set();

  return {
    style: {},
    classList: {
      add: (name) => classSet.add(name),
      remove: (name) => classSet.delete(name),
      toggle: (name, force) => {
        if (typeof force === 'boolean') {
          if (force) {
            classSet.add(name);
            return true;
          }
          classSet.delete(name);
          return false;
        }

        if (classSet.has(name)) {
          classSet.delete(name);
          return false;
        }

        classSet.add(name);
        return true;
      },
      contains: (name) => classSet.has(name),
    },
    addEventListener: (event, handler) => {
      listeners[event] = handler;
    },
    dispatchEvent: (eventName) => {
      if (listeners[eventName]) {
        listeners[eventName]();
      }
    },
    setAttribute: (name, value) => {
      attributes[name] = value;
    },
    getAttribute: (name) => attributes[name],
  };
}

function createDoc() {
  const modal = createElement();
  modal.classList.add('options-modal');

  const startButton = createElement();
  const optionsButton = createElement();
  const closeButton = createElement();
  const body = createElement();

  const nodeMap = {
    '.options-modal': modal,
    '[data-action="start"]': startButton,
    '[data-action="options"]': optionsButton,
  };

  const listMap = {
    '[data-action="close-options"]': [closeButton],
  };

  return {
    body,
    modal,
    startButton,
    optionsButton,
    closeButton,
    querySelector: (selector) => nodeMap[selector] || null,
    querySelectorAll: (selector) => listMap[selector] || [],
  };
}

function testToggleOptionsModal() {
  const doc = createDoc();

  toggleOptionsModal(doc, true);
  assert.ok(doc.modal.classList.contains('is-open'));
  assert.strictEqual(doc.modal.getAttribute('aria-hidden'), 'false');

  toggleOptionsModal(doc, false);
  assert.ok(!doc.modal.classList.contains('is-open'));
  assert.strictEqual(doc.modal.getAttribute('aria-hidden'), 'true');
}

function testSetupButtonInteractions() {
  const doc = createDoc();
  setupButtonInteractions(doc);

  doc.startButton.dispatchEvent('click');
  assert.ok(doc.body.classList.contains('game-active'));

  doc.optionsButton.dispatchEvent('click');
  assert.ok(doc.modal.classList.contains('is-open'));
  assert.strictEqual(doc.modal.getAttribute('aria-hidden'), 'false');

  doc.closeButton.dispatchEvent('click');
  assert.ok(!doc.modal.classList.contains('is-open'));
  assert.strictEqual(doc.modal.getAttribute('aria-hidden'), 'true');
}

function run() {
  testToggleOptionsModal();
  testSetupButtonInteractions();
  console.log('All tests passed');
}

run();
