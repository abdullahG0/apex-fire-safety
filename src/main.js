// Mobile menu and scroll animations. The site stays fully usable without JavaScript.
(function () {
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('main-nav');

  if (btn && nav) {
    var setOpen = function (open) {
      nav.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    btn.addEventListener('click', function () {
      setOpen(!nav.classList.contains('is-open'));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        btn.focus();
      }
    });
  }

  var mainImage = document.querySelector('.product-img img');
  var thumbs = document.querySelectorAll('.thumb');
  thumbs.forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      mainImage.src = thumb.dataset.src;
      mainImage.srcset = thumb.dataset.srcset;
      mainImage.alt = thumb.dataset.alt;
      thumbs.forEach(function (t) {
        t.classList.toggle('is-active', t === thumb);
        t.setAttribute('aria-pressed', String(t === thumb));
      });
    });
  });

  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) {
    var steps = document.querySelector('.steps');
    if (steps) steps.classList.add('is-in');
    return;
  }

  function countUp(el) {
    var match = el.textContent.trim().match(/^(\d+)(\+)$/);
    if (!match) return;
    var target = Number(match[1]);
    var start = performance.now();
    function tick(now) {
      var t = Math.min((now - start) / 1300, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased) + match[2];
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      el.classList.add('is-in');
      if (el.classList.contains('stat-n')) countUp(el);
      observer.unobserve(el);
    });
  }, { rootMargin: '0px 0px -6% 0px' });

  var selector = '.h2,.h3-lg,.card,.process,.industry,.about-block,.about-copy>p,.value,.contact-copy,.contact-list,' +
    '.stats .wrap>div,.group-title,.p-card,.section h2,.table-scroll,.feature,.long-inner,.related h2';

  document.querySelectorAll(selector).forEach(function (el) {
    // Anything already on screen stays visible, so there is no flash on load.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    if (el.closest('.long-inner') && !el.classList.contains('long-inner')) return;
    var index = Array.prototype.indexOf.call(el.parentElement.children, el);
    el.style.setProperty('--d', (index % 4) * 80 + 'ms');
    el.classList.add('reveal');
    observer.observe(el);
  });

  document.querySelectorAll('.stat-n,.steps').forEach(function (el) {
    observer.observe(el);
  });
})();
