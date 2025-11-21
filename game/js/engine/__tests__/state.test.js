'use strict';

const assert = require('assert');
const { SessionEvaluator, bindControlHandlers } = require('../state');

function testSessionEvaluation() {
  const session = new SessionEvaluator({ requiredSaved: 2, totalZombies: 3, timeLimitMs: 1000 });
  session.recordSaved();
  session.recordDeath();
  assert.strictEqual(session.evaluate(), 'running', 'still running when goal unmet and time remains');
  session.recordSaved();
  assert.strictEqual(session.evaluate(), 'success', 'goal reached triggers success');
}

function createElement() {
  const listeners = {};
  return {
    addEventListener: (event, handler) => {
      listeners[event] = handler;
    },
    trigger: (event) => {
      if (listeners[event]) listeners[event]();
    },
  };
}

function testControlBindings() {
  const restart = createElement();
  const pause = createElement();
  const fast = createElement();

  const doc = {
    querySelector: (selector) => {
      if (selector === '[data-action="restart"]') return restart;
      if (selector === '[data-action="pause"]') return pause;
      if (selector === '[data-action="fast-forward"]') return fast;
      return null;
    },
  };

  let restartCalled = false;
  let pauseCalled = false;
  let fastCalled = false;

  bindControlHandlers(doc, {
    onRestart: () => {
      restartCalled = true;
    },
    onPause: () => {
      pauseCalled = true;
    },
    onFastForward: () => {
      fastCalled = true;
    },
  });

  restart.trigger('click');
  pause.trigger('click');
  fast.trigger('click');

  assert.ok(restartCalled && pauseCalled && fastCalled, 'control handlers should fire on click');
}

function run() {
  testSessionEvaluation();
  testControlBindings();
  console.log('state tests passed');
}

run();
