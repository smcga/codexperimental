(function () {
  function toggleOptionsModal(doc, open = true) {
    const modal = doc.querySelector('.options-modal');
    if (!modal) return;

    modal.classList.toggle('is-open', open);
    modal.setAttribute('aria-hidden', String(!open));
  }

  function setupButtonInteractions(doc) {
    const startButton = doc.querySelector('[data-action="start"]');
    const optionsButton = doc.querySelector('[data-action="options"]');
    const closeButtons = Array.from(doc.querySelectorAll('[data-action="close-options"]'));

    if (startButton) {
      startButton.addEventListener('click', () => {
        doc.body.classList.add('game-active');
      });
    }

    if (optionsButton) {
      optionsButton.addEventListener('click', () => toggleOptionsModal(doc, true));
    }

    closeButtons.forEach((btn) =>
      btn.addEventListener('click', () => toggleOptionsModal(doc, false))
    );
  }

  function setupTitleAnimation(doc, raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : null) {
    const title = doc.querySelector('.game-title');
    if (!title || !raf) return;

    let direction = 1;
    let offset = 0;

    const animate = () => {
      offset += 0.08 * direction;
      if (Math.abs(offset) > 0.6) {
        direction *= -1;
      }
      title.style.transform = `translateY(${offset.toFixed(2)}rem)`;
      raf(animate);
    };

    raf(animate);
  }

  function init(doc = document) {
    setupButtonInteractions(doc);
    setupTitleAnimation(doc);

    return {
      toggleOptionsModal: (open) => toggleOptionsModal(doc, open),
    };
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => init(document));
    } else {
      init(document);
    }
  }

  if (typeof module !== 'undefined') {
    module.exports = {
      init,
      setupButtonInteractions,
      setupTitleAnimation,
      toggleOptionsModal,
    };
  }
})();
