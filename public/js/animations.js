/* ============================================================
   animations.js — Anime.js wrappers for consistent UI motion
   ============================================================ */

const Anim = (() => {
  const ease = 'easeOutCubic';
  const easeBounce = 'easeOutBack';

  function fadeInUp(targets, delay = 0, duration = 380) {
    return anime({
      targets,
      opacity:      [0, 1],
      translateY:   [18, 0],
      duration,
      delay:        typeof delay === 'number' ? delay : anime.stagger(delay),
      easing:       ease,
    });
  }

  function staggerIn(targets, stagger = 55) {
    return anime({
      targets,
      opacity:    [0, 1],
      translateY: [16, 0],
      scale:      [0.96, 1],
      duration:   360,
      delay:      anime.stagger(stagger),
      easing:     ease,
    });
  }

  function slideInRight(target) {
    return anime({
      targets:      target,
      translateX:   ['100%', '0%'],
      opacity:      [0, 1],
      duration:     340,
      easing:       ease,
    });
  }

  function slideOutRight(target, cb) {
    return anime({
      targets:    target,
      translateX: ['0%', '100%'],
      opacity:    [1, 0],
      duration:   280,
      easing:     'easeInCubic',
      complete:   cb,
    });
  }

  function popIn(target) {
    return anime({
      targets:  target,
      opacity:  [0, 1],
      scale:    [0.8, 1],
      duration: 320,
      easing:   easeBounce,
    });
  }

  function popOut(target, cb) {
    return anime({
      targets:  target,
      opacity:  [1, 0],
      scale:    [1, 0.85],
      duration: 220,
      easing:   'easeInCubic',
      complete: cb,
    });
  }

  function heartBeat(target) {
    return anime({
      targets:  target,
      scale:    [1, 1.35, 1],
      duration: 420,
      easing:   easeBounce,
    });
  }

  function shake(target) {
    return anime({
      targets:     target,
      translateX:  [0, -6, 6, -4, 4, 0],
      duration:    400,
      easing:      'easeInOutSine',
    });
  }

  function fadeIn(target, duration = 280) {
    return anime({
      targets:  target,
      opacity:  [0, 1],
      duration,
      easing:   ease,
    });
  }

  function fadeOut(target, cb, duration = 220) {
    return anime({
      targets:  target,
      opacity:  [1, 0],
      duration,
      easing:   'easeInCubic',
      complete: cb,
    });
  }

  // Toast slide up from bottom-right
  function toastIn(target) {
    return anime({
      targets:    target,
      opacity:    [0, 1],
      translateY: [16, 0],
      duration:   340,
      easing:     easeBounce,
    });
  }

  function toastOut(target, cb) {
    return anime({
      targets:    target,
      opacity:    [1, 0],
      translateY: [0, 12],
      duration:   260,
      easing:     'easeInCubic',
      complete:   cb,
    });
  }

  // Checklist item pop in
  function listItemIn(target) {
    return anime({
      targets:  target,
      opacity:  [0, 1],
      height:   ['0px', 'auto'],
      marginBottom: [0, '4px'],
      duration: 280,
      easing:   ease,
    });
  }

  return {
    fadeInUp,
    staggerIn,
    slideInRight,
    slideOutRight,
    popIn,
    popOut,
    heartBeat,
    shake,
    fadeIn,
    fadeOut,
    toastIn,
    toastOut,
    listItemIn,
  };
})();
