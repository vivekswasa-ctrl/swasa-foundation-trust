document.documentElement.classList.add("js");
(function () {
  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  var toggle = document.querySelector(".nav-toggle");
  var panel = document.getElementById("nav-panel");
  if (toggle && panel) {
    toggle.addEventListener("click", function () {
      var open = panel.hasAttribute("hidden");
      if (open) {
        panel.removeAttribute("hidden");
        toggle.setAttribute("aria-expanded", "true");
        toggle.setAttribute("aria-label", "Close menu");
      } else {
        panel.setAttribute("hidden", "");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
      }
    });

    panel.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        panel.setAttribute("hidden", "");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
      });
    });
  }

  /* Hero carousels: auto-advance, eased scroll; pauses on hover / focus / touch. Main carousel only: freedom/nation tagline replay. */
  var freedomAnimRun = function () {};
  var nationAnimRun = function () {};
  var reducedMotionCarousel =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var freedomTagline = document.getElementById("freedom-tagline");
  if (freedomTagline) {
    var freedomText = "F r e e d o m  T o  B r e a t h e . . .";
    freedomTagline.textContent = "";
    Array.from(freedomText).forEach(function (ch, i) {
      var span = document.createElement("span");
      span.className = "freedom-char";
      span.setAttribute("aria-hidden", "true");
      span.style.setProperty("--nation-i", String(i));
      span.textContent = ch === " " ? "\u00a0" : ch;
      freedomTagline.appendChild(span);
    });

    if (!reducedMotionCarousel) {
      freedomAnimRun = function () {
        freedomTagline.classList.remove("freedom-tagline--play");
        void freedomTagline.offsetWidth;
        freedomTagline.classList.add("freedom-tagline--play");
      };
    } else {
      freedomTagline.classList.add("freedom-tagline--play");
    }
  }

  var nationTagline = document.getElementById("nation-tagline");
  if (nationTagline) {
    var nationText = "B r e a t h e  F r e e  &  B u i l d  T h e  N a t i o n . . .";
    nationTagline.textContent = "";
    Array.from(nationText).forEach(function (ch, i) {
      var span = document.createElement("span");
      span.className = "nation-char";
      span.setAttribute("aria-hidden", "true");
      span.style.setProperty("--nation-i", String(i));
      span.textContent = ch === " " ? "\u00a0" : ch;
      nationTagline.appendChild(span);
    });

    if (!reducedMotionCarousel) {
      nationAnimRun = function () {
        nationTagline.classList.remove("nation-tagline--play");
        void nationTagline.offsetWidth;
        nationTagline.classList.add("nation-tagline--play");
      };
    } else {
      nationTagline.classList.add("nation-tagline--play");
    }
  }

  var carouselVisibilityHandlers = [];
  var carouselVisibilityListenerAttached = false;

  function attachCarouselVisibilityListener() {
    if (carouselVisibilityListenerAttached) {
      return;
    }
    carouselVisibilityListenerAttached = true;
    document.addEventListener("visibilitychange", function () {
      carouselVisibilityHandlers.forEach(function (pair) {
        if (document.hidden) {
          pair.pause();
        } else {
          pair.start();
        }
      });
    });
  }

  function initHeroCarousel(carouselRoot) {
    var viewport = carouselRoot.querySelector(".hero-carousel-viewport");
    if (!viewport) {
      return;
    }

    var dots = carouselRoot.querySelectorAll("[data-carousel-dot]");
    var btnPrev = carouselRoot.querySelector("[data-carousel-prev]");
    var btnNext = carouselRoot.querySelector("[data-carousel-next]");
    var total = dots.length;
    var autoParsed = parseInt(carouselRoot.getAttribute("data-carousel-auto-ms") || "", 10);
    var AUTO_MS = !isNaN(autoParsed) && autoParsed >= 800 ? autoParsed : 5000;
    var scrollParsed = parseInt(carouselRoot.getAttribute("data-carousel-scroll-ms") || "", 10);
    var SCROLL_MS = !isNaN(scrollParsed) && scrollParsed >= 200 ? scrollParsed : 1100;
    var useDwell = carouselRoot.getAttribute("data-carousel-dwell") === "true";
    var autoIntervalId = null;
    var autoTimeoutId = null;
    var scrollAnimToken = 0;
    var isMainCarousel = carouselRoot.hasAttribute("data-carousel-main");
    var prevSettledIdx = -1;

    function slideWidth() {
      return viewport.clientWidth;
    }

    function currentIndex() {
      var w = slideWidth();
      if (w <= 0) {
        return 0;
      }
      return Math.round(viewport.scrollLeft / w);
    }

    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function scrollViewportToX(targetLeft, durationMs, onDone) {
      if (reducedMotionCarousel) {
        viewport.scrollLeft = targetLeft;
        if (onDone) {
          onDone();
        }
        return;
      }
      var token = ++scrollAnimToken;
      var startX = viewport.scrollLeft;
      var delta = targetLeft - startX;
      if (Math.abs(delta) < 0.5) {
        if (onDone) {
          onDone();
        }
        return;
      }
      var startTime = null;
      function step(ts) {
        if (token !== scrollAnimToken) {
          return;
        }
        if (startTime === null) {
          startTime = ts;
        }
        var elapsed = ts - startTime;
        var t = Math.min(elapsed / durationMs, 1);
        viewport.scrollLeft = startX + delta * easeInOutCubic(t);
        if (t < 1) {
          window.requestAnimationFrame(step);
        } else if (onDone) {
          onDone();
        }
      }
      window.requestAnimationFrame(step);
    }

    function goToSlide(index, afterScroll) {
      if (total <= 0) {
        return;
      }
      var i = ((index % total) + total) % total;
      var w = slideWidth();
      carouselRoot.setAttribute("data-slide-index", String(i));
      scrollViewportToX(i * w, SCROLL_MS, function () {
        syncDots();
        if (typeof afterScroll === "function") {
          afterScroll();
        }
      });
    }

    function syncDots() {
      var idx = currentIndex();
      carouselRoot.setAttribute("data-slide-index", String(idx));
      dots.forEach(function (dot, i) {
        var on = i === idx;
        dot.setAttribute("aria-selected", on ? "true" : "false");
        dot.tabIndex = on ? 0 : -1;
      });
    }

    function pauseAutoAdvance() {
      if (autoIntervalId !== null) {
        clearInterval(autoIntervalId);
        autoIntervalId = null;
      }
      if (autoTimeoutId !== null) {
        clearTimeout(autoTimeoutId);
        autoTimeoutId = null;
      }
    }

    function scheduleNextDwell() {
      autoTimeoutId = window.setTimeout(function () {
        autoTimeoutId = null;
        goToSlide(currentIndex() + 1, scheduleNextDwell);
      }, AUTO_MS);
    }

    function startAutoAdvance() {
      pauseAutoAdvance();
      if (
        reducedMotionCarousel ||
        total <= 1 ||
        carouselRoot.hasAttribute("data-carousel-no-auto")
      ) {
        return;
      }
      if (useDwell) {
        scheduleNextDwell();
      } else {
        autoIntervalId = window.setInterval(function () {
          goToSlide(currentIndex() + 1);
        }, AUTO_MS);
      }
    }

    function restartAutoAdvance() {
      pauseAutoAdvance();
      startAutoAdvance();
    }

    var scrollTimer;
    viewport.addEventListener(
      "scroll",
      function () {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function () {
          syncDots();
          var idx = currentIndex();
          if (isMainCarousel) {
            if (idx === 5 && prevSettledIdx !== 5) {
              freedomAnimRun();
            }
            if (idx === 0 && prevSettledIdx !== 0) {
              nationAnimRun();
            }
          }
          prevSettledIdx = idx;
        }, 80);
      },
      { passive: true }
    );

    var resizeTimer;
    window.addEventListener(
      "resize",
      function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          var idx = parseInt(carouselRoot.getAttribute("data-slide-index") || "0", 10);
          if (isNaN(idx) || idx < 0 || idx >= total) {
            idx = currentIndex();
          }
          var w = slideWidth();
          viewport.scrollLeft = idx * w;
          syncDots();
        }, 100);
      },
      { passive: true }
    );

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        var idx = parseInt(dot.getAttribute("data-index"), 10);
        if (!isNaN(idx)) {
          goToSlide(idx);
          restartAutoAdvance();
        }
      });
    });

    if (btnPrev) {
      btnPrev.addEventListener("click", function () {
        goToSlide(currentIndex() - 1);
        restartAutoAdvance();
      });
    }
    if (btnNext) {
      btnNext.addEventListener("click", function () {
        goToSlide(currentIndex() + 1);
        restartAutoAdvance();
      });
    }

    viewport.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToSlide(currentIndex() - 1);
        restartAutoAdvance();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToSlide(currentIndex() + 1);
        restartAutoAdvance();
      }
    });

    carouselRoot.addEventListener("mouseenter", pauseAutoAdvance);
    carouselRoot.addEventListener("mouseleave", startAutoAdvance);
    carouselRoot.addEventListener("focusin", pauseAutoAdvance);
    carouselRoot.addEventListener("focusout", function (e) {
      if (!carouselRoot.contains(e.relatedTarget)) {
        startAutoAdvance();
      }
    });

    var touchResumeTimer;
    viewport.addEventListener(
      "touchstart",
      function () {
        clearTimeout(touchResumeTimer);
        pauseAutoAdvance();
      },
      { passive: true }
    );
    viewport.addEventListener(
      "touchend",
      function () {
        clearTimeout(touchResumeTimer);
        touchResumeTimer = window.setTimeout(function () {
          startAutoAdvance();
        }, 450);
      },
      { passive: true }
    );

    carouselVisibilityHandlers.push({ pause: pauseAutoAdvance, start: startAutoAdvance });
    attachCarouselVisibilityListener();

    syncDots();
    startAutoAdvance();
    var landingIdx = currentIndex();
    if (isMainCarousel) {
      if (landingIdx === 0) {
        nationAnimRun();
      } else if (landingIdx === 5) {
        freedomAnimRun();
      }
    }
    prevSettledIdx = landingIdx;
  }

  document.querySelectorAll("[data-carousel]").forEach(function (root) {
    initHeroCarousel(root);
  });

  /**
   * One line per photo. Files 040–050 are inserted after 020 in display order (middle of gallery).
   * To hide corner numbers: add class "activity-gallery--no-numbers" on #activity-gallery.
   */
  function padActivityFile(n) {
    return n < 10 ? "00" + n : n < 100 ? "0" + n : String(n);
  }

  var ACTIVITY_CAPTIONS_RAW = [
    "Felicitation at AP Bhavan — honoring partners in community lung health.",
    "Team AP Bhavan event — SWASA Foundation members recognised by dignitaries.",
    "Health awareness session at District Legal Services Authority, Ranga Reddy.",
    "BEST Club launch — Breathe Easy Stay Tough orientation workshop.",
    "#PollutionWarrior campaign — pledging for clean air with SWASA.",
    "Vaidyasiromani Awards 2011 — keynote address on Doctor's Day.",
    "World Allergy Week 2016 — patient awareness camp at Indira Park.",
    "World Asthma Day 2010 — patients rally for asthma control at SWASA Hospital.",
    "Tribute to a Noble Profession — award from Hospitals & Nursing Homes Association.",
    "World Asthma Day 2012 — street march spreading 'You Can Control Your Asthma'.",
    "World Asthma Day 2013 — Silver Jubilee celebration with a massive community march.",
    "Rotary Club Nagarjuna Sagar — community health outreach programme.",
    "World Asthma Day 2013 — Global Initiative for Asthma awareness with volunteers.",
    "World Asthma Day 2013 — team group photo after the awareness rally.",
    "SWASA Foundation book release — Telugu lung-health awareness publication.",
    "World COPD Day 2014 — outdoor campaign: Breathe Fresh, Breathe Free.",
    "World COPD Day 2014 — community walk with balloons and banners.",
    "World Asthma Day 2015 — awareness walk with balloon release in Hyderabad.",
    "World Asthma Day 2015 — asthma awareness pamphlet launch by dignitaries.",
    "First International Yoga Day — SWASA Foundation community yoga session.",
    "Doctor's Day 2015 — school health camp and felicitation ceremony.",
    "Doctor's Day 2015 — school health initiative and free allergy-asthma camp.",
    "CME & Felicitation of Dr. Anupam Sachdeva at SWASA Hospital, Secunderabad.",
    "SWASA Foundation outdoor event — chief guest felicitated with shawl and bouquet.",
    "Deepavali anti-pollution drive — media interview urging cracker-free celebrations.",
    "Global Peace Foundation — award for outstanding community health service.",
    "Press conference — 'No Crackers, No Pollution' Deepavali awareness campaign.",
    "Media briefing — addressing Telugu news channels on lung health and air quality.",
    "World Asthma Day 2019 — 'Winners Against Asthma' public awareness event.",
    "THANA felicitation — honoured by Telangana Hospitals & Nursing Homes Association.",
    "World Asthma Day 2018 — indoor rally: Never Too Early, Never Too Late.",
    "Media interaction — speaking to multiple news channels on asthma awareness day.",
    "Inauguration of new SWASA facility — celebratory opening with dignitaries.",
    "World Asthma Day 2025 — GINA theme: making inhaled treatment accessible to all.",
    "World Asthma Day 2025 — community walk for 'Nurture Your Gut, Breathe Your Best'.",
    "ISR Summit, London — formal recognition during the international summit on respiratory and environmental health.",
    "Dr. Vishnun Rao at the ISR Summit, London — addressing how air pollution endangers humanity and calling for individual responsibility to reduce it.",
    "ISR Summit, London — delegates and sessions on clean air, lung health, and pollution as a shared global concern.",
    "ISR Summit, London — plenary and summit moments on the dangers of pollution and each person’s duty to protect health and the environment.",
  ];

  var ACTIVITY_INSERT_MID = [
    "Community health camp — consultations and screenings for people in queue.",
    "Distributing medicines and advice after consultation at a Swasa outreach camp.",
    "Purple Grey Ribbon Campaign — Dept. of Botany (O.U.) & SWASA Foundation, 11 Dec 2014.",
    "Balloon awareness — University College of Science, Saifabad, with SWASA Foundation.",
    "Allergy–asthma awareness for children — SWASA Foundation ‘Breathe Free & Build The Nation’.",
    "Doctor's Day 2015 — free allergy & asthma camp at Kavadiguda Government High School.",
    "Press briefing — Dr. Vishnun Rao on lung health with Telugu TV channels.",
    "Allergy–asthma awareness programme — examinations for children at a school camp.",
    "First International Yoga Day — SWASA Foundation, 21 June 2015, Domalguda.",
    "World Asthma Day 2014 — sharing materials at Sundaraiah Park (GINA: You Can Control Your Asthma).",
    "Doctor's Day 2015 — school assembly during a government-school allergy & asthma initiative.",
  ];

  var ACTIVITY_CAPTIONS = ACTIVITY_CAPTIONS_RAW.slice(0, 20).concat(ACTIVITY_INSERT_MID, ACTIVITY_CAPTIONS_RAW.slice(20));

  var ACTIVITY_FILES_ORDER = (function () {
    var out = [];
    var p;
    for (p = 1; p <= 20; p++) {
      out.push(padActivityFile(p) + ".png");
    }
    for (p = 40; p <= 50; p++) {
      out.push(padActivityFile(p) + ".png");
    }
    for (p = 21; p <= 39; p++) {
      out.push(padActivityFile(p) + ".png");
    }
    return out;
  })();

  /* Allergy Symposium IDIAS — same grid as other activity photos; appear after “Show more” (last slots). */
  var ACTIVITY_SYMPOSIUM_IDIAS_FILES = [
    "symposium-idias/01.png",
    "symposium-idias/02.png",
    "symposium-idias/03.png",
    "symposium-idias/04.png",
    "symposium-idias/05.png",
  ];
  var ACTIVITY_SYMPOSIUM_IDIAS_CAPTIONS = [
    "Allergy Symposium IDIAS — Dr. Vishnun Rao with SWASA Foundation display; 50+ doctors attended, IPS Sirisha as chief guest.",
    "Allergy Symposium IDIAS — group photo with SWASA banners and IDIAS placards (Treat the root, not the fruit).",
    "Allergy Symposium IDIAS — dignitaries and doctors on stage; inaugural session and logo launch.",
    "Allergy Symposium IDIAS — address from the podium; interdisciplinary allergy solutions.",
    "Allergy Symposium IDIAS — large group with IDIAS placards; SWASA Foundation event.",
  ];
  ACTIVITY_SYMPOSIUM_IDIAS_FILES.forEach(function (symFile, symIdx) {
    ACTIVITY_FILES_ORDER.push(symFile);
    ACTIVITY_CAPTIONS.push(ACTIVITY_SYMPOSIUM_IDIAS_CAPTIONS[symIdx]);
  });

  function buildActivityGallery() {
    var root = document.getElementById("activity-gallery");
    if (!root) {
      return;
    }
    var placeholder = "images/activity-placeholder.svg";
    var frag = document.createDocumentFragment();
    var total = ACTIVITY_CAPTIONS.length;
    for (var i = 0; i < total; i++) {
      var index = i + 1;
      var fname = ACTIVITY_FILES_ORDER[i];
      var fig = document.createElement("figure");
      fig.className = "activity-photo-card";

      var badge = document.createElement("span");
      badge.className = "activity-photo-num";
      badge.textContent = String(index);
      badge.setAttribute("aria-label", "Photo " + index);

      var img = document.createElement("img");
      img.className = "activity-photo-img";
      img.src = "images/activities/" + fname;
      img.alt = ACTIVITY_CAPTIONS[i] || ("Swasa Foundation activity " + index);
      img.loading = "lazy";
      img.decoding = "async";
      (function (fnameEsc) {
        img.addEventListener("error", function () {
          if (!this.dataset.fallback) {
            this.dataset.fallback = "1";
            this.src = placeholder;
            this.alt = "Missing image — add images/activities/" + fnameEsc;
          }
        });
      })(fname);

      var cap = document.createElement("figcaption");
      cap.className = "activity-photo-caption";
      cap.textContent = ACTIVITY_CAPTIONS[i];

      fig.appendChild(badge);
      fig.appendChild(img);
      fig.appendChild(cap);
      frag.appendChild(fig);
    }
    root.appendChild(frag);
  }

  buildActivityGallery();

  /**
   * One short line per clipping, stored 1:1 with each file in MEDIA_FILES_ORDER.
   * File 083.png is unused; clipping 102 (World Health Day 2026) is last.
   * Order on the page: 001–082 (all), 084–101, then 102.
   */
  var MEDIA_CAPTION_ROTATORS = [
    "Newspaper coverage — SWASA programmes & lung health.",
    "Press report — community screening & awareness camps.",
    "Media clipping — asthma, allergy, and clean-air advocacy.",
    "News article — Dr. Vishnun Rao Veerapaneni & SWASA outreach.",
    "Newspaper feature — World Asthma Day & public education.",
    "Press note — COPD awareness & spirometry camps.",
    "Coverage — SWASA Hospital charitable & outreach work.",
    "Article — school health, CSR, and foundation events.",
    "Press story — anti-pollution & festival lung-health appeals.",
    "Newspaper report — felicitations, seminars, and rallies.",
    "Media — Telugu & English press on respiratory care.",
    "Clipping — partners, hospitals, and recognition events.",
  ];

  var MEDIA_COUNT = 101;

  var MEDIA_CAPTIONS = [];
  (function buildMediaCaptionList() {
    var r = MEDIA_CAPTION_ROTATORS;
    var len = r.length;
    for (var k = 0; k < 82; k++) {
      MEDIA_CAPTIONS.push(r[k % len]);
    }
    var added = [
      "Telugu press — Swasa Foundation outreach, camps, and respiratory health in the news.",
      "Newspaper clipping — community awareness and lung-health reporting.",
      "Burgula (Shadnagar) — free asthma & medical camp by Swasa Foundation & Pragathi Welfare; Dr. Vishnun Rao on rural triggers and care.",
      "SWASA Hospital 12th anniversary — Dr. Vishnu Rao & Garikapati Narasimha Rao on air pollution, indoor irritants, and respiratory precautions.",
      "Namasthe Telangana (Health) — pollution, breath, and childhood asthma: triggers and myths.",
      "Allergy & asthma awareness camp — Saifabad Science College; Swasa Foundation; Dr. Vishnu Rao on pollution, allergens, and early diagnosis.",
      "World COPD Day — Indira Park, Hyderabad; MP Bura Narsaiah Goud, ‘Swasa Bharat’, smoking & clean air.",
      "Cherlapally Jail — free camp led by Dr. Vishnu Rao (Amma Shwasa); wheelchairs by Vasavi Women’s Federation.",
      "Purple Grey Ribbon Run (2014) — UC Science Saifabad & Swasa Foundation; Dr. Vishnu Rao on pollution & spore allergies.",
      "Miryalaguda — asthma awareness across villages; Dr. Vishnu Rao honoured by Minister Dr. S. Aruna for outreach.",
      "Urdu — World Health Day 2014: allergy/asthma self-check; Swasa Hospital, Himayatnagar.",
      "‘City to have immunotherapy soon’ — Dr. Vishnun Rao & Dr. Venu Kandala: allergy screening & immunotherapy at Swasa Hospital.",
      "Urdu feature — breathlessness & pollution; Swasa School Drive for students’ allergy & asthma care.",
      "Urdu — free camp at Deaf Enabled Foundation (10th Swasa anniversary); screenings, inhalers, Freedom to Breathe booklets.",
      "Urdu — allergy, asthma & emotional health: Dr. Vishnu Rao on triggers and wellbeing.",
      "Telugu — World COPD Day at Indira Park; MP Dr. Boora Narsaiah Goud & MLA Dr. K. Laxman with Swasa Foundation.",
      "Telugu — Dr. Vishnu Rao on asthma & allergies for students (Oak Valley School, Hyderabad).",
      "Telugu — World COPD Day 2014 rally at Indira Park; ‘Breathe Free & Build the Healthy Nation’ with Swasa Foundation.",
    ];
    for (var j = 0; j < added.length; j++) {
      MEDIA_CAPTIONS.push(added[j]);
    }
    MEDIA_CAPTIONS.push(
      "World Health Day 2026 — Vijayakranthi (7 Apr): Dr. Vishnu Rao on science-based health, mind–body wellbeing, and ‘health with science’."
    );
  })();

  function padMediaNum(n) {
    return n < 10 ? "00" + n : n < 100 ? "0" + n : String(n);
  }

  var MEDIA_FILES_ORDER = (function () {
    var out = [];
    var n;
    for (n = 1; n <= 82; n++) {
      out.push(padMediaNum(n) + ".png");
    }
    for (n = 84; n <= 101; n++) {
      out.push(padMediaNum(n) + ".png");
    }
    out.push("102.png");
    return out;
  })();

  function buildMediaCoverage() {
    var root = document.getElementById("media-coverage-root");
    if (!root) {
      return;
    }

    var placeholder = "images/activity-placeholder.svg";
    var grid = document.createElement("div");
    grid.className = "media-gallery";

    for (var i = 1; i <= MEDIA_COUNT; i++) {
      var file = MEDIA_FILES_ORDER[i - 1];
      var captionText = MEDIA_CAPTIONS[i - 1] || "";

      var fig = document.createElement("figure");
      fig.className = "media-clipping-card";

      var img = document.createElement("img");
      img.className = "media-clipping-img";
      img.src = "images/media/" + file;
      img.alt = captionText ? "Press clipping: " + captionText : "Press clipping " + i;
      img.loading = "lazy";
      img.decoding = "async";
      (function (slot, fname) {
        img.addEventListener("error", function () {
          if (!this.dataset.fallback) {
            this.dataset.fallback = "1";
            this.src = placeholder;
            this.alt = "Missing clipping " + slot;
          }
        });
      })(i, file);

      var cap = document.createElement("figcaption");
      cap.className = "media-clipping-caption";
      cap.textContent = captionText;

      fig.appendChild(img);
      fig.appendChild(cap);
      grid.appendChild(fig);
    }

    root.appendChild(grid);
  }

  buildMediaCoverage();

  /* Collapsible galleries — measure after layout so collapsed height is never ~0 */
  function setupCollapsibleGallery(galleryEl, rowsToShow) {
    if (!galleryEl || galleryEl.dataset.collapsibleInit === "1") {
      return;
    }
    var items = galleryEl.children;
    if (!items.length) {
      return;
    }

    function readRowHeight() {
      var first = items[0];
      if (!first) {
        return 0;
      }
      var h = first.getBoundingClientRect().height;
      if (h < 16) {
        h = first.offsetHeight;
      }
      if (h < 16 && galleryEl.clientHeight > 32) {
        var cols = Math.max(
          1,
          Math.round(galleryEl.clientWidth / Math.max(120, galleryEl.clientWidth / 6))
        );
        var rows = Math.ceil(items.length / cols);
        h = galleryEl.clientHeight / Math.max(1, Math.min(rows, rowsToShow + 2));
      }
      if (h < 16) {
        h = 168;
      }
      return h;
    }

    function mount() {
      if (galleryEl.dataset.collapsibleInit === "1" || galleryEl.dataset.collapsibleInit === "pending") {
        return;
      }
      var itemHeight = readRowHeight();
      var style = window.getComputedStyle(galleryEl);
      var gap = parseFloat(style.rowGap) || parseFloat(style.gap) || 12;
      var collapsedHeight = (itemHeight + gap) * rowsToShow - gap + 24;

      galleryEl.dataset.collapsibleInit = "pending";

      galleryEl.classList.add("gallery-collapsible", "is-collapsed");
      galleryEl.style.setProperty("--collapsed-height", collapsedHeight + "px");

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gallery-show-more";
      btn.textContent = "Click here to view more photos";
      galleryEl.parentNode.insertBefore(btn, galleryEl.nextSibling);

      btn.addEventListener("click", function () {
        var isCollapsed = galleryEl.classList.contains("is-collapsed");
        if (isCollapsed) {
          galleryEl.style.maxHeight = galleryEl.scrollHeight + "px";
          galleryEl.classList.remove("is-collapsed");
          btn.textContent = "Show less";
          btn.classList.add("is-expanded");
          window.setTimeout(function () {
            galleryEl.style.maxHeight = "none";
          }, 500);
        } else {
          galleryEl.style.maxHeight = galleryEl.scrollHeight + "px";
          galleryEl.offsetHeight;
          galleryEl.style.maxHeight = collapsedHeight + "px";
          galleryEl.classList.add("is-collapsed");
          btn.textContent = "Click here to view more photos";
          btn.classList.remove("is-expanded");
        }
      });

      galleryEl.dataset.collapsibleInit = "1";
    }

    if ("ResizeObserver" in window) {
      var ro = new ResizeObserver(function () {
        mount();
        if (galleryEl.dataset.collapsibleInit === "1") {
          ro.disconnect();
        }
      });
      ro.observe(galleryEl);
    }

    window.addEventListener(
      "load",
      function () {
        mount();
        window.setTimeout(mount, 250);
        window.setTimeout(mount, 900);
      },
      { once: true }
    );

    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(mount);
    });
  }

  var actGallery = document.getElementById("activity-gallery");
  if (actGallery) {
    setupCollapsibleGallery(actGallery, 2);
  }

  var mediaGrid = document.querySelector(".media-gallery");
  if (mediaGrid) {
    setupCollapsibleGallery(mediaGrid, 2);
  }

  function initImageLightbox() {
    var box = document.getElementById("image-lightbox");
    var imgEl = document.getElementById("image-lightbox-img");
    var capEl = document.getElementById("image-lightbox-caption");
    var closeBtn = document.getElementById("image-lightbox-close");
    var backdrop = document.getElementById("image-lightbox-backdrop");
    if (!box || !imgEl || !closeBtn) {
      return;
    }

    var lastFocus = null;

    function isPlaceholderSrc(src) {
      return !src || String(src).indexOf("activity-placeholder") !== -1;
    }

    function openLightbox(src, alt, caption) {
      if (isPlaceholderSrc(src)) {
        return;
      }
      lastFocus = document.activeElement;
      imgEl.src = src;
      imgEl.alt = alt || "";
      capEl.textContent = caption || "";
      box.classList.add("is-open");
      box.setAttribute("aria-hidden", "false");
      document.body.classList.add("image-lightbox-open");
      closeBtn.focus();
    }

    function closeLightbox() {
      if (!box.classList.contains("is-open")) {
        return;
      }
      box.classList.remove("is-open");
      box.setAttribute("aria-hidden", "true");
      document.body.classList.remove("image-lightbox-open");
      imgEl.src = "";
      imgEl.alt = "";
      capEl.textContent = "";
      if (lastFocus && typeof lastFocus.focus === "function") {
        try {
          lastFocus.focus();
        } catch (err) {
          /* ignore */
        }
      }
    }

    function onGalleryClick(e) {
      var t = e.target;
      if (t.tagName !== "IMG") {
        return;
      }
      if (
        !t.classList.contains("activity-photo-img") &&
        !t.classList.contains("media-clipping-img") &&
        !t.classList.contains("wad-strip-img")
      ) {
        return;
      }
      var src = t.getAttribute("src") || t.src || "";
      if (isPlaceholderSrc(src)) {
        return;
      }
      var fig = t.closest("figure");
      var cap = fig ? fig.querySelector("figcaption") : null;
      var caption = cap ? cap.textContent.trim() : "";
      openLightbox(src, t.getAttribute("alt") || "", caption);
      e.preventDefault();
    }

    var actRoot = document.getElementById("activity-gallery");
    var mediaRoot = document.getElementById("media-coverage-root");
    if (actRoot) {
      actRoot.addEventListener("click", onGalleryClick);
    }
    if (mediaRoot) {
      mediaRoot.addEventListener("click", onGalleryClick);
    }
    var wadCarousel = document.getElementById("wad-2026-carousel");
    if (wadCarousel) {
      wadCarousel.addEventListener("click", onGalleryClick);
    }

    closeBtn.addEventListener("click", closeLightbox);
    if (backdrop) {
      backdrop.addEventListener("click", closeLightbox);
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && box.classList.contains("is-open")) {
        closeLightbox();
      }
    });
  }

  initImageLightbox();

  var siteHeader = document.getElementById("site-header");
  function updateHeaderScroll() {
    if (!siteHeader) {
      return;
    }
    if (window.scrollY > 16) {
      siteHeader.classList.add("is-scrolled");
    } else {
      siteHeader.classList.remove("is-scrolled");
    }
  }
  updateHeaderScroll();
  window.addEventListener("scroll", updateHeaderScroll, { passive: true });

  var revealSections = document.querySelectorAll(".reveal-section");
  if (revealSections.length) {
    if ("IntersectionObserver" in window) {
      var revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
            }
          });
        },
        /* threshold must include 0: very tall sections (e.g. media grid) never reach 8% of their own height visible at once */
        { root: null, rootMargin: "0px 0px -4% 0px", threshold: [0, 0.06, 0.12] }
      );
      revealSections.forEach(function (section) {
        revealObserver.observe(section);
      });
    } else {
      revealSections.forEach(function (section) {
        section.classList.add("is-visible");
      });
    }
  }

  /* Chairman’s vision: “SWASA IDIAS” heading — one letter at a time when #vision enters view */
  var visionSection = document.getElementById("vision");
  var idiasHeadingEl = document.getElementById("vision-idias-heading");
  if (visionSection && idiasHeadingEl && !idiasHeadingEl.dataset.idiasBuilt) {
    idiasHeadingEl.dataset.idiasBuilt = "1";
    var idiasPhrase = "SWASA IDIAS";
    idiasHeadingEl.textContent = "";
    Array.from(idiasPhrase).forEach(function (ch, i) {
      var span = document.createElement("span");
      span.className = "vision-idias-char";
      span.style.setProperty("--ci", String(i));
      span.setAttribute("aria-hidden", "true");
      span.textContent = ch === " " ? "\u00a0" : ch;
      idiasHeadingEl.appendChild(span);
    });

    var idiasReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function playIdiasHeading() {
      idiasHeadingEl.classList.add("vision-idias-heading--play");
    }

    if (idiasReducedMotion) {
      playIdiasHeading();
    } else if ("IntersectionObserver" in window) {
      var idiasIo = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              playIdiasHeading();
              idiasIo.disconnect();
            }
          });
        },
        { root: null, rootMargin: "0px 0px -6% 0px", threshold: 0.1 }
      );
      idiasIo.observe(visionSection);
    } else {
      playIdiasHeading();
    }
  }

  /* Our logo: reveal explanation lines 2s apart once section is in view */
  var logoSection = document.getElementById("our-logo");
  var logoLinesRoot = logoSection && logoSection.querySelector("[data-logo-lines]");
  if (logoSection && logoLinesRoot) {
    var logoReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function startLogoLineSequence() {
      logoLinesRoot.classList.add("logo-meaning--started");
    }
    if (logoReducedMotion) {
      startLogoLineSequence();
    } else if ("IntersectionObserver" in window) {
      var logoIo = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              startLogoLineSequence();
              logoIo.disconnect();
            }
          });
        },
        { root: null, rootMargin: "0px 0px -6% 0px", threshold: 0.12 }
      );
      logoIo.observe(logoSection);
    } else {
      startLogoLineSequence();
    }
  }

  /* ── Back to top ── */
  var backToTop = document.getElementById("back-to-top");
  if (backToTop) {
    window.addEventListener("scroll", function () {
      if (window.scrollY > 600) {
        backToTop.classList.add("is-visible");
      } else {
        backToTop.classList.remove("is-visible");
      }
    }, { passive: true });

    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ── Registration popup ── */
  var overlay = document.getElementById("register-overlay");
  var openRegisterBtns = document.querySelectorAll(".js-open-register");
  var closeBtn2 = document.getElementById("register-close");
  var regForm = document.getElementById("register-form");

  function openRegister() {
    if (!overlay) return;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("register-open");
  }

  function closeRegister() {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("register-open");
  }

  openRegisterBtns.forEach(function (btn) {
    btn.addEventListener("click", openRegister);
  });

  if (closeBtn2) {
    closeBtn2.addEventListener("click", closeRegister);
  }

  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeRegister();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) {
        closeRegister();
      }
    });
  }

  if (regForm) {
    regForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("reg-name").value.trim();
      var phone = document.getElementById("reg-phone").value.trim();
      var orgEl = document.getElementById("reg-organization");
      var organization = orgEl ? orgEl.value.trim() : "";
      var city = document.getElementById("reg-city").value.trim();

      var msg = "Event collaboration enquiry:%0A%0A"
        + "Contact person: " + encodeURIComponent(name) + "%0A"
        + "Phone: " + encodeURIComponent(phone) + "%0A"
        + "Foundation/Company: " + encodeURIComponent(organization) + "%0A"
        + "City: " + encodeURIComponent(city);

      var waUrl = "https://wa.me/919676764968?text=" + msg;
      var popup = window.open(waUrl, "_blank", "noopener,noreferrer");
      if (popup) {
        try {
          popup.opener = null;
        } catch (err) {
          /* ignore */
        }
      }
      closeRegister();
      regForm.reset();
    });
  }
})();
