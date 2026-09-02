/* Fomina.Designs — концепт.
   Дві механіки: вкладки за нішами в першому екрані й закріплена секція
   з горизонтальним рухом. Обидві написані з нуля, без бібліотек:
   у primesec.ai для цього стоять GSAP, ScrollTrigger, Lenis і Swiper. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- вкладки за нішами --------------------------------------------------- */

  // Тексти й підписи заглушок для кожної ніші. Коли зʼявляться справжні
  // зображення — додати сюди поле src і підставляти його в .shot.
  var NICHES = {
    consulting: {
      title: 'Коли послугу<br>важко пояснити',
      lead: 'Сайт має пояснити те, що ви щоразу пояснюєте голосом. Структура під заявки, а не набір гарних екранів.',
      shot: 'Зображення<br>консалтинг'
    },
    medical: {
      title: 'Коли обирають<br>за довірою',
      lead: 'До клініки йдуть не за списком послуг, а за відчуттям, що тут не нашкодять. Сайт це відчуття або створює, або руйнує.',
      shot: 'Зображення<br>медицина'
    },
    interior: {
      title: 'Коли сайт<br>бачать першим',
      lead: 'Ваші проєкти коштують сотні тисяч. Сайт не має виглядати дешевше за них — інакше розмова про бюджет починається з мінуса.',
      shot: 'Зображення<br>інтерʼєр'
    }
  };

  var hero = document.getElementById('hero');
  var heroTitle = document.getElementById('heroTitle');
  var heroLead = document.getElementById('heroLead');
  var heroShot = document.getElementById('heroShot');
  var tabs = document.querySelectorAll('.tab');

  if (hero && tabs.length) {
    Array.prototype.forEach.call(tabs, function (tab) {
      tab.addEventListener('click', function () {
        if (tab.classList.contains('is-on')) { return; }

        Array.prototype.forEach.call(tabs, function (t) {
          t.classList.toggle('is-on', t === tab);
          t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
        });

        var data = NICHES[tab.getAttribute('data-niche')];
        if (!data) { return; }

        // Гасимо, міняємо вміст, показуємо. Без затримки текст
        // перестрибував би різко.
        var swap = function () {
          heroTitle.innerHTML = data.title;
          heroLead.textContent = data.lead;
          var label = heroShot.querySelector('.shot__label');
          if (label) { label.innerHTML = data.shot; }
          hero.classList.remove('is-swapping');
        };

        if (reduceMotion) { swap(); return; }

        hero.classList.add('is-swapping');
        setTimeout(swap, 260);
      });
    });
  }

  /* --- закріплена секція з горизонтальним рухом ----------------------------

     Прокрутку не перехоплюємо: секція просто вища за екран, усередині
     закріплена сцена, а доріжка зсувається пропорційно пройденому шляху.
     Смуга прокрутки, клавіатура й інерція тачпада працюють як завжди. */

  var pin = document.getElementById('how');
  var pinWrap = document.getElementById('pinWrap');
  var pinTrack = document.getElementById('pinTrack');
  var pinBar = document.getElementById('pinBar');

  if (pin && pinWrap && pinTrack) {
    var distance = 0;
    var lead = 0;
    var pinned = false;
    var frame = 0;

    function disable(reason) {
      pinned = false;
      pin.dataset.pin = reason || 'off';
      pin.classList.remove('pin--on');
      pinWrap.style.height = '';
      pinTrack.style.transform = '';
    }

    function update() {
      if (!pinned) { return; }
      var scrolled = -pinWrap.getBoundingClientRect().top;
      var p = (scrolled - lead) / distance;
      if (p < 0) { p = 0; }
      if (p > 1) { p = 1; }
      pinTrack.style.transform = 'translate3d(' + (-p * distance).toFixed(1) + 'px,0,0)';
      if (pinBar) { pinBar.style.width = (p * 100).toFixed(1) + '%'; }
    }

    function measure() {
      if (reduceMotion) { disable('reduced-motion'); return; }
      if (window.innerWidth < 861) { disable('narrow'); return; }

      // Міряємо, не знімаючи клас і не обнуляючи висоту: інакше документ
      // на мить коротшає і браузер зсуває позицію прокрутки.
      var visible = Math.min(pinTrack.parentElement.clientWidth, window.innerWidth);
      var overflow = pinTrack.offsetWidth - visible;
      if (overflow <= 40) { disable('no-overflow'); return; }

      distance = overflow;
      lead = Math.round(window.innerHeight * 0.4);
      pinned = true;
      pin.dataset.pin = 'on';
      pin.classList.add('pin--on');

      var height = (window.innerHeight + lead + distance + lead) + 'px';
      if (pinWrap.style.height !== height) { pinWrap.style.height = height; }
      update();
    }

    window.addEventListener('scroll', function () {
      if (frame) { return; }
      frame = requestAnimationFrame(function () { frame = 0; update(); });
    }, { passive: true });

    // На мобільних адресний рядок ховається й показується, надсилаючи resize.
    // Переміряємо лише коли справді змінилась ширина.
    var lastWidth = window.innerWidth;
    window.addEventListener('resize', function () {
      if (window.innerWidth === lastWidth) { update(); return; }
      lastWidth = window.innerWidth;
      measure();
    });

    // Розмітка встоюється не одразу — шрифти міняють ширину карток.
    if ('ResizeObserver' in window) {
      var pending = 0;
      var ro = new ResizeObserver(function () {
        if (pending) { return; }
        pending = requestAnimationFrame(function () { pending = 0; measure(); });
      });
      ro.observe(pinTrack);
    }

    window.addEventListener('load', measure);
    measure();
  }
})();
