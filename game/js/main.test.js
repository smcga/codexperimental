'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
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

function testStylesheetHasDecorations() {
  const cssPath = path.join(__dirname, '../css/styles.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  assert.ok(cssContent.includes('--muted'), 'should define muted palette color');
  assert.ok(
    cssContent.includes('.zombie-hair.blue') && cssContent.includes('.zombie-hair.green'),
    'should include zombie hair variants'
  );
  assert.ok(cssContent.includes('@keyframes climb'), 'should include climb animation');
  assert.ok(cssContent.includes('.btn.zombie-held'), 'should keep zombie held button effect');
}

function run() {
  testToggleOptionsModal();
  testSetupButtonInteractions();
  testStylesheetHasDecorations();
  console.log('All tests passed');
}

run();
