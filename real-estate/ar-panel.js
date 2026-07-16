// ── Glossy base disc — programmatic env map ───────────
// MeshStandardMaterial metalness only reflects an envMap; without one the
// disc just looks black. This component builds a minimal PMREM env map from
// a canvas (dark blue studio gradient) and assigns it to the disc material,
// giving the blue reflective sheen seen in the reference image.
AFRAME.registerComponent('glossy-base', {
  init: function () {
    var self = this;
    this.el.sceneEl.addEventListener('loaded', function () { self.applyEnv(); }, { once: true });
  },
  applyEnv: function () {
    var mesh = this.el.getObject3D('mesh');
    if (!mesh) return;
    var THREE    = AFRAME.THREE;
    var renderer = this.el.sceneEl.renderer;

    // Paint a 256×128 equirectangular canvas: dark base + soft blue highlight
    var canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 128;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#00050e';
    ctx.fillRect(0, 0, 256, 128);
    var g = ctx.createRadialGradient(128, 28, 0, 128, 28, 80);
    g.addColorStop(0, 'rgba(25, 95, 230, 0.75)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 128);

    var tex = new THREE.CanvasTexture(canvas);
    tex.mapping = THREE.EquirectangularReflectionMapping;

    var pmrem  = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    var envMap = pmrem.fromEquirectangular(tex).texture;
    tex.dispose();
    pmrem.dispose();

    mesh.traverse(function (node) {
      if (node.isMesh && node.material) {
        node.material.envMap           = envMap;
        node.material.envMapIntensity  = 2.5;
        node.material.metalness        = 0.92;
        node.material.roughness        = 0.08;
        node.material.needsUpdate      = true;
      }
    });
  }
});

// ── Drag-to-rotate A-Frame component ─────────────────
// Attached to the building model entity. Listens on the canvas
// for touch/mouse drags and spins the entity around its Y axis.
// Panel touches never reach here because the panel calls stopPropagation.
AFRAME.registerComponent('drag-rotate', {
  schema: { sensitivity: { default: 0.45 } },
  init: function () {
    var el     = this.el;
    var sens   = this.data.sensitivity;
    var canvas = el.sceneEl.canvas;
    var active = false;
    var lastX  = 0;
    var angleY = 0;

    function start(x) { active = true; lastX = x; }
    function move(x) {
      if (!active) return;
      angleY += (x - lastX) * sens;
      lastX   = x;
      el.setAttribute('rotation', { x: 0, y: angleY, z: 0 });
    }
    function end() { active = false; }

    canvas.addEventListener('touchstart', function (e) { start(e.touches[0].clientX); }, { passive: true });
    canvas.addEventListener('touchmove',  function (e) { move(e.touches[0].clientX);  }, { passive: true });
    canvas.addEventListener('touchend',   end, { passive: true });
    canvas.addEventListener('mousedown',  function (e) { start(e.clientX); });
    canvas.addEventListener('mousemove',  function (e) { move(e.clientX);  });
    canvas.addEventListener('mouseup',    end);
  }
});

(function () {
  var config = window.AR_CONFIG;
  if (!config) { console.error('[AR] window.AR_CONFIG not defined'); return; }

  // ── Brand CSS variables ──────────────────────────────
  var root = document.documentElement;
  root.style.setProperty('--brand-primary', config.brand.primaryColor);
  root.style.setProperty('--brand-accent',  config.brand.accentColor);

  // ── Populate header ──────────────────────────────────
  document.getElementById('brand-name').textContent    = config.brand.projectName;
  document.getElementById('brand-tagline').textContent = config.brand.tagline;
  document.title = config.brand.name + ' — AR Experience';

  var logoEl = document.getElementById('panel-logo');
  logoEl.onerror = function () {
    var ph = document.createElement('div');
    ph.className   = 'brand-logo-placeholder';
    ph.textContent = config.brand.initials || config.brand.name.charAt(0);
    logoEl.parentNode.replaceChild(ph, logoEl);
  };

  // ── Highlights ───────────────────────────────────────
  var highlightsRow = document.getElementById('highlights-row');
  (config.highlights || []).forEach(function (h) {
    var chip = document.createElement('div');
    chip.className = 'highlight-chip';
    chip.innerHTML =
      '<span class="highlight-icon">' + h.icon + '</span>' +
      '<span class="highlight-label">' + h.label + '</span>';
    highlightsRow.appendChild(chip);
  });

  // ── Gallery carousel ─────────────────────────────────
  var gallery = config.gallery || [];
  var currentGalleryIdx = 0;
  var galleryMainEl  = document.getElementById('gallery-main');
  var galleryDotsEl  = document.getElementById('gallery-dots');
  var galleryPrevBtn = document.getElementById('gallery-prev');
  var galleryNextBtn = document.getElementById('gallery-next');

  // Build dot indicators
  gallery.forEach(function (_, i) {
    var dot = document.createElement('button');
    dot.className = 'gallery-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', function () { setGallerySlide(i); });
    galleryDotsEl.appendChild(dot);
  });

  function setGallerySlide(idx) {
    currentGalleryIdx = (idx + gallery.length) % gallery.length;
    var item = gallery[currentGalleryIdx];
    galleryMainEl.src = item.src;
    galleryMainEl.alt = item.caption || '';
    var dots = galleryDotsEl.querySelectorAll('.gallery-dot');
    dots.forEach(function (d, i) { d.classList.toggle('active', i === currentGalleryIdx); });
  }

  if (gallery.length > 0) setGallerySlide(0);

  galleryPrevBtn.addEventListener('click', function () { setGallerySlide(currentGalleryIdx - 1); });
  galleryNextBtn.addEventListener('click', function () { setGallerySlide(currentGalleryIdx + 1); });

  // Tap main image → open lightbox at current slide
  galleryMainEl.addEventListener('click', function () { openLightbox(currentGalleryIdx); });

  // Swipe on the carousel image
  var carouselTouchX = 0;
  galleryMainEl.addEventListener('touchstart', function (e) {
    carouselTouchX = e.touches[0].clientX;
    e.stopPropagation();
  }, { passive: true });
  galleryMainEl.addEventListener('touchend', function (e) {
    var delta = e.changedTouches[0].clientX - carouselTouchX;
    if (Math.abs(delta) > 40) setGallerySlide(delta < 0 ? currentGalleryIdx + 1 : currentGalleryIdx - 1);
    e.stopPropagation();
  }, { passive: true });

  // ── CTAs ─────────────────────────────────────────────
  document.getElementById('cta-call').addEventListener('click', function () {
    window.location.href = 'tel:' + config.contact.phone;
  });
  document.getElementById('cta-whatsapp').addEventListener('click', function () {
    var num = config.contact.whatsapp.replace(/[^0-9]/g, '');
    var msg = encodeURIComponent(
      config.contact.whatsappMessage || 'Hi, I would like to know more about ' + config.brand.projectName
    );
    window.open('https://wa.me/' + num + '?text=' + msg, '_blank');
  });

  // ── Close button ─────────────────────────────────────
  document.getElementById('panel-close').addEventListener('click', function () {
    hidePanel();
  });

  // ── AR setup ─────────────────────────────────────────
  var panel = document.getElementById('ar-panel');
  // Prevent any touch on the panel from reaching the A-Frame canvas below.
  panel.addEventListener('touchstart', function (e) {
    e.stopPropagation();
  }, { passive: true });
  var hint    = document.getElementById('hint');
  var loading = document.getElementById('loading-screen');
  var sceneEl = document.querySelector('a-scene');
  var targetEl = document.getElementById('ar-target');

  var isTracking = false;
  var hideTimer  = null;

  // Panel natural dimensions (design canvas).
  // The rAF loop scales these to match the pamphlet on screen.
  var PANEL_W = 400;
  var PANEL_H = Math.round(PANEL_W * (config.pamphletAspect || 1.4156));
  panel.style.width  = PANEL_W + 'px';
  panel.style.height = PANEL_H + 'px';
  // Anchor at top-left, only `transform` changes each frame so layout never
  // re-triggers and touch hit-testing stays stable across frames.
  panel.style.left = '0';
  panel.style.top  = '0';

  function showPanel() {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    panel.classList.add('visible');
    hint.style.display = 'none';
  }

  function hidePanel() {
    panel.classList.remove('visible');
    hint.style.display = 'block';
  }

  // ── Loading → Tap to Begin ───────────────────────────
  sceneEl.addEventListener('arReady', function () {
    console.log('[AR] arReady');
    var spinner = loading.querySelector('.spinner');
    var msg     = loading.querySelector('p');
    if (spinner) spinner.style.display = 'none';
    msg.textContent  = 'TAP TO BEGIN';
    msg.style.color  = '#fff';
    msg.style.fontSize      = '1rem';
    msg.style.letterSpacing = '3px';
    loading.style.cursor = 'pointer';

    // A real tap gesture is required so WKWebView (WhatsApp/Instagram in-app
    // browser) allows camera and media APIs to activate.
    loading.addEventListener('click', function onTap() {
      loading.removeEventListener('click', onTap);
      loading.style.transition = 'opacity 0.4s ease';
      loading.style.opacity    = '0';
      setTimeout(function () { loading.style.display = 'none'; }, 400);
      hint.style.display = 'block';
    });
  });

  sceneEl.addEventListener('arError', function () {
    console.error('[AR] arError');
    var spinner = loading.querySelector('.spinner');
    var msg     = loading.querySelector('p');
    if (spinner) spinner.style.display = 'none';
    msg.textContent = 'Camera access required';
    msg.style.color = '#f55';
  });

  targetEl.addEventListener('targetFound', function () {
    isTracking = true;
    console.log('[AR] targetFound');
    showPanel();
  });

  targetEl.addEventListener('targetLost', function () {
    isTracking = false;
    console.log('[AR] targetLost');
    // Small delay so brief interruptions (tracking hiccup) don't flash the panel away.
    hideTimer = setTimeout(function () {
      if (!isTracking) hidePanel();
      hideTimer = null;
    }, 800);
  });

  // ── Per-frame projection loop ─────────────────────────
  /*
    Three invisible A-Frame entities sit at known positions relative to the
    image target (center, right-edge mid, top-edge mid). Each frame we project
    their world positions onto screen space using the A-Frame camera, then derive
    the pamphlet's screen centre, apparent width, apparent height, and in-plane
    rotation. We apply that as a CSS 2D transform on the panel so it tracks the
    pamphlet exactly. A CSS 2D transform (not matrix3d) is used intentionally:
    it keeps touch events (scroll, tap) working correctly inside the panel.
  */
  sceneEl.addEventListener('loaded', function () {
    var anchorCenter = document.getElementById('anchor-center');
    var anchorRight  = document.getElementById('anchor-right');
    var anchorTop    = document.getElementById('anchor-top');
    var tmp = new AFRAME.THREE.Vector3();

    function project(entity) {
      entity.object3D.getWorldPosition(tmp);
      tmp.project(sceneEl.camera);
      return {
        x: ( tmp.x * 0.5 + 0.5) * window.innerWidth,
        y: (-tmp.y * 0.5 + 0.5) * window.innerHeight,
      };
    }

    function tick() {
      if (sceneEl.camera && isTracking) {
        var c = project(anchorCenter);
        var r = project(anchorRight);
        var t = project(anchorTop);

        // Right-direction vector in screen space → gives rotation + screen width
        var rdx = r.x - c.x, rdy = r.y - c.y;
        var sw    = 2 * Math.sqrt(rdx * rdx + rdy * rdy);
        var theta = Math.atan2(rdy, rdx); // in-plane rotation (radians)

        // Top-direction vector → screen height
        var tdx = t.x - c.x, tdy = t.y - c.y;
        var sh  = 2 * Math.sqrt(tdx * tdx + tdy * tdy);

        var sx = sw / PANEL_W;
        var sy = sh / PANEL_H;

        // translate() moves the element's centre (transform-origin: center center)
        // to the pamphlet's screen centre; rotate + scale happen around that point.
        // Only `transform` is written — left/top are fixed at 0 so layout never
        // re-triggers and active touch sequences (scroll, tap) are not interrupted.
        panel.style.transform =
          'translate(' + (c.x - PANEL_W / 2) + 'px,' + (c.y - PANEL_H / 2) + 'px)' +
          ' rotate(' + theta + 'rad)' +
          ' scale(' + sx + ',' + sy + ')';
      }
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  });

  // ── Lightbox ─────────────────────────────────────────
  var lightbox  = document.getElementById('lightbox');
  var lbImg     = document.getElementById('lb-img');
  var lbCounter = document.getElementById('lb-counter');
  var lbCaption = document.getElementById('lb-caption');
  var lbPrev    = document.getElementById('lb-prev');
  var lbNext    = document.getElementById('lb-next');
  var lbClose   = document.getElementById('lb-close');
  var currentIdx = 0;

  function openLightbox(index) {
    currentIdx = index;
    updateLightbox();
    lightbox.classList.add('visible');
  }

  function closeLightbox() {
    lightbox.classList.remove('visible');
  }

  function updateLightbox() {
    var item = gallery[currentIdx];
    if (!item) return;
    lbImg.src             = item.src;
    lbCaption.textContent = item.caption || '';
    lbCounter.textContent = (currentIdx + 1) + ' / ' + gallery.length;
    lbPrev.style.visibility = gallery.length > 1 ? 'visible' : 'hidden';
    lbNext.style.visibility = gallery.length > 1 ? 'visible' : 'hidden';
  }

  lbClose.addEventListener('click', closeLightbox);

  lbPrev.addEventListener('click', function () {
    currentIdx = (currentIdx - 1 + gallery.length) % gallery.length;
    updateLightbox();
  });
  lbNext.addEventListener('click', function () {
    currentIdx = (currentIdx + 1) % gallery.length;
    updateLightbox();
  });

  var touchStartX = 0;
  lightbox.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener('touchend', function (e) {
    var delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 48) {
      currentIdx = delta < 0
        ? (currentIdx + 1) % gallery.length
        : (currentIdx - 1 + gallery.length) % gallery.length;
      updateLightbox();
    }
  }, { passive: true });

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });

})();
