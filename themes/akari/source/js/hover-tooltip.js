(function () {
  const SELECTOR = '.hover-tip[data-tip]';
  const TOOLTIP_ID = 'global-hover-tooltip';
  const EDGE_GAP = 10;

  let tooltip = null;
  let activeTrigger = null;

  function ensureTooltip() {
    if (tooltip) return tooltip;

    tooltip = document.createElement('div');
    tooltip.id = TOOLTIP_ID;
    tooltip.setAttribute('role', 'tooltip');
    tooltip.setAttribute('aria-hidden', 'true');
    document.body.appendChild(tooltip);
    document.body.classList.add('has-global-tooltip');

    return tooltip;
  }

  function getTipText(el) {
    return (el.getAttribute('data-tip') || '').trim();
  }

  function setPosition(trigger) {
    if (!tooltip || !trigger) return;

    const rect = trigger.getBoundingClientRect();
    const tipRect = tooltip.getBoundingClientRect();

    let left = rect.left + (rect.width - tipRect.width) / 2;
    left = Math.max(EDGE_GAP, Math.min(left, window.innerWidth - tipRect.width - EDGE_GAP));

    let top = rect.top - tipRect.height - EDGE_GAP;
    if (top < EDGE_GAP) {
      top = rect.bottom + EDGE_GAP;
    }
    if (top + tipRect.height > window.innerHeight - EDGE_GAP) {
      top = window.innerHeight - tipRect.height - EDGE_GAP;
    }

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }

  function show(trigger) {
    const text = getTipText(trigger);
    if (!text) return;

    ensureTooltip();
    activeTrigger = trigger;
    tooltip.textContent = text;
    tooltip.classList.add('is-visible');
    tooltip.setAttribute('aria-hidden', 'false');
    setPosition(trigger);
  }

  function hide() {
    if (!tooltip) return;

    activeTrigger = null;
    tooltip.classList.remove('is-visible');
    tooltip.setAttribute('aria-hidden', 'true');
  }

  document.addEventListener('mouseenter', function (event) {
    const trigger = event.target.closest(SELECTOR);
    if (trigger) show(trigger);
  }, true);

  document.addEventListener('mousemove', function (event) {
    const trigger = event.target.closest(SELECTOR);
    if (trigger && trigger === activeTrigger && tooltip && tooltip.classList.contains('is-visible')) {
      setPosition(trigger);
    }
  }, true);

  document.addEventListener('mouseleave', function (event) {
    const trigger = event.target.closest(SELECTOR);
    if (trigger && trigger === activeTrigger) hide();
  }, true);

  document.addEventListener('focusin', function (event) {
    const trigger = event.target.closest(SELECTOR);
    if (trigger) show(trigger);
  });

  document.addEventListener('focusout', function (event) {
    const trigger = event.target.closest(SELECTOR);
    if (trigger && trigger === activeTrigger) hide();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') hide();
  });

  window.addEventListener('scroll', function () {
    if (activeTrigger) setPosition(activeTrigger);
  }, true);

  window.addEventListener('resize', function () {
    if (activeTrigger) setPosition(activeTrigger);
  });
})();
