/**
 * Chitwan Kennel Club - Interactive JavaScript & Admin Media Management Engine
 */

// 1. Force browser to always scroll to top navigation bar on refresh/load
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

// Reset scroll instantly before render
window.scrollTo(0, 0);

window.addEventListener('beforeunload', () => {
  window.scrollTo(0, 0);
});

window.addEventListener('pageshow', () => {
  window.scrollTo(0, 0);
  const navbar = document.getElementById('navbar');
  if (navbar) {
    navbar.classList.remove('nav-hidden', 'scrolled');
  }
});

window.addEventListener('load', () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  const navbar = document.getElementById('navbar');
  if (navbar) {
    navbar.classList.remove('nav-hidden', 'scrolled');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  if (window.location.hash) {
    history.replaceState(null, null, window.location.pathname);
  }
  
  initPreloader();
  initNavbar();
  initPawTrailCanvas();
  initPuppyFilters();
  initTestimonialsCarousel();
  initGallerySlider();
  loadMediaFromDB();
  loadPuppiesFromDB();
  checkAdminSession();
});

/* ==========================================
 * 1. Preloader Handler
 * ========================================== */
function initPreloader() {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    setTimeout(() => {
      preloader.classList.add('loaded');
    }, 600);
  }
}

/* ==========================================
 * 2. Navbar, Smooth Scroll-Hide & Scrollspy
 * ========================================== */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');
  if (!navbar) return;

  let lastScrollY = window.scrollY;
  const scrollDelta = 8;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    // Scrolled capsule style
    if (currentScrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Smooth Hide on Scroll Down, Reveal on Scroll Up
    const isMobileMenuOpen = navMenu && navMenu.classList.contains('active');
    if (!isMobileMenuOpen) {
      if (currentScrollY > 100) {
        if (currentScrollY > lastScrollY + scrollDelta) {
          // Scrolling Down -> Hide Navbar
          navbar.classList.add('nav-hidden');
        } else if (currentScrollY < lastScrollY - scrollDelta) {
          // Scrolling Up -> Reveal Navbar
          navbar.classList.remove('nav-hidden');
        }
      } else {
        // Near the top of the page -> Always visible
        navbar.classList.remove('nav-hidden');
      }
    }

    lastScrollY = currentScrollY;

    // Scrollspy active indicator
    let current = '';
    const sections = document.querySelectorAll('section[id]');
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 150;
      if (currentScrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }, { passive: true });

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navMenu.classList.toggle('active');
      navbar.classList.remove('nav-hidden');
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
      });
    });

    document.addEventListener('click', (e) => {
      if (navMenu.classList.contains('active')) {
        if (!navbar.contains(e.target) && !navMenu.contains(e.target)) {
          navMenu.classList.remove('active');
        }
      }
    });
  }
}

/* ==========================================
 * 3. Interactive Paw Print Trail Canvas
 * ========================================== */
function initPawTrailCanvas() {
  const canvas = document.getElementById('pawCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let paws = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class PawPrint {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = 14;
      this.alpha = 0.85;
      this.angle = (Math.random() - 0.5) * 0.4;
      this.decay = 0.015;
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.fillStyle = `rgba(217, 107, 67, ${this.alpha})`;

      ctx.beginPath();
      ctx.ellipse(0, 0, this.size * 0.6, this.size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      const toeOffsets = [
        { x: -this.size * 0.5, y: -this.size * 0.6, r: this.size * 0.22 },
        { x: -this.size * 0.18, y: -this.size * 0.8, r: this.size * 0.22 },
        { x: this.size * 0.18, y: -this.size * 0.8, r: this.size * 0.22 },
        { x: this.size * 0.5, y: -this.size * 0.6, r: this.size * 0.22 },
      ];

      toeOffsets.forEach(toe => {
        ctx.beginPath();
        ctx.arc(toe.x, toe.y, toe.r, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    }

    update() {
      this.alpha -= this.decay;
    }
  }

  let lastX = 0;
  let lastY = 0;
  let distThreshold = 40;

  window.addEventListener('mousemove', (e) => {
    let dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
    if (dist > distThreshold) {
      paws.push(new PawPrint(e.clientX, e.clientY));
      lastX = e.clientX;
      lastY = e.clientY;
    }
  });

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = paws.length - 1; i >= 0; i--) {
      paws[i].draw();
      paws[i].update();
      if (paws[i].alpha <= 0) {
        paws.splice(i, 1);
      }
    }
    requestAnimationFrame(animate);
  }

  animate();
}

/* ==========================================
 * 4. Puppy Filter Tabs
 * ========================================== */
function initPuppyFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');
      const puppyCards = document.querySelectorAll('.puppy-card');

      puppyCards.forEach(card => {
        if (filterValue === 'all') {
          card.style.display = 'flex';
        } else {
          const categories = (card.getAttribute('data-category') || '').split(' ');
          if (categories.includes(filterValue)) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        }
      });
    });
  });
}

/* ==========================================
 * 5. Testimonials Carousel
 * ========================================== */
let testimonials = [
  {
    quote: "I got my Rottweiler puppy from Chitwan Kennel Club 6 months ago. The puppy arrived healthy, fully vaccinated, and extremely well-socialized. Dr. Kamala and the team at Gautam Chowk are always available whenever I need advice!",
    author: "Sujan Shrestha",
    location: "Bharatpur-10, Chitwan"
  },
  {
    quote: "The best veterinary clinic and kennel in Bharatpur! They performed minor ear care surgery on my German Shepherd with utmost precision and tender loving care. Highly recommend to all pet owners in Nepal.",
    author: "Aakriti Gurung",
    location: "Narayangarh, Chitwan"
  },
  {
    quote: "Finding purebred, ethically raised Golden Retrievers in Nepal used to be tough. Chitwan Kennel Club provided full vaccination records, microchip details, and genuine care. My dog Bruno is the joy of our family!",
    author: "Rohan Pokharel",
    location: "Gaindakot, Nawalpur"
  },
  {
    quote: "Outstanding boarding and dog training service! Left my Beagle for 10 days while traveling to Kathmandu, and he was returned clean, happy, and well-exercised.",
    author: "Deepak Karki",
    location: "Bharatpur-7, Chitwan"
  }
];

let currentTestimonialIndex = 0;

function initTestimonialsCarousel() {
  const prevBtn = document.getElementById('prevTestimonial');
  const nextBtn = document.getElementById('nextTestimonial');

  fetch('/api/testimonials')
    .then(res => res.json())
    .then(data => {
      if (data.success && data.testimonials && data.testimonials.length > 0) {
        testimonials = data.testimonials;
        updateTestimonialCard();
      }
    })
    .catch(err => console.log('Using default testimonials:', err));

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      currentTestimonialIndex = (currentTestimonialIndex - 1 + testimonials.length) % testimonials.length;
      updateTestimonialCard();
    });

    nextBtn.addEventListener('click', () => {
      currentTestimonialIndex = (currentTestimonialIndex + 1) % testimonials.length;
      updateTestimonialCard();
    });

    setInterval(() => {
      currentTestimonialIndex = (currentTestimonialIndex + 1) % testimonials.length;
      updateTestimonialCard();
    }, 6000);
  }
}

function updateTestimonialCard() {
  const card = document.getElementById('testimonialCard');
  const text = document.getElementById('testimonialText');
  const author = document.getElementById('testimonialAuthor');
  const loc = document.getElementById('testimonialLoc');

  if (card && text && author && loc && testimonials.length > 0) {
    card.style.opacity = '0';
    card.style.transform = 'translateY(10px)';

    setTimeout(() => {
      const data = testimonials[currentTestimonialIndex];
      text.textContent = `"${data.quote}"`;
      author.textContent = data.author;
      loc.textContent = data.location;

      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 200);
  }
}

/* ==========================================
 * 6. Public Modals
 * ========================================== */
function openInquiryModal(breedName) {
  const modal = document.getElementById('inquiryModal');
  const breedInput = document.getElementById('modalSelectedBreed');
  const title = document.getElementById('modalBreedTitle');

  if (modal && breedInput) {
    breedInput.value = breedName;
    title.textContent = `Inquire About ${breedName}`;
    modal.classList.add('active');
  }
}

function closeInquiryModal() {
  const modal = document.getElementById('inquiryModal');
  if (modal) modal.classList.remove('active');
}

function openServiceModal(serviceName) {
  const modal = document.getElementById('serviceModal');
  const serviceInput = document.getElementById('modalSelectedService');
  const title = document.getElementById('modalServiceTitle');

  if (modal && serviceInput) {
    serviceInput.value = serviceName;
    title.textContent = `Book ${serviceName}`;
    modal.classList.add('active');
  }
}

function closeServiceModal() {
  const modal = document.getElementById('serviceModal');
  if (modal) modal.classList.remove('active');
}

/* ==========================================
 * 7. Form Submissions
 * ========================================== */
function handleContactSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('contactName').value;
  const email = document.getElementById('contactEmail') ? document.getElementById('contactEmail').value : '';
  const phone = document.getElementById('contactPhone') ? document.getElementById('contactPhone').value : '';
  const message = document.getElementById('contactMsg') ? document.getElementById('contactMsg').value : '';
  const subject = document.getElementById('inquiryType') ? document.getElementById('inquiryType').value : 'General Inquiry';

  fetch('/api/inquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'contact', name, email, phone, subject, message })
  })
    .then(res => res.json())
    .then(data => {
      showAdminToast(`Thank you, ${name}! Inquiry saved to Chitwan Kennel Club database.`);
      e.target.reset();
    })
    .catch(err => {
      console.error('Submission error:', err);
      showAdminToast(`Thank you, ${name}! Your inquiry has been received.`);
      e.target.reset();
    });
}

function handleModalSubmit(e) {
  e.preventDefault();
  const breed = document.getElementById('modalSelectedBreed').value;
  const name = e.target.querySelector('input[placeholder*="Bikash"]')?.value || 'Client';
  const phone = e.target.querySelector('input[type="tel"]')?.value || '';

  fetch('/api/inquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'breed_inquiry', name, phone, subject: breed, message: `Inquiry for ${breed} puppy details and video.` })
  })
    .then(res => res.json())
    .then(data => {
      showAdminToast(`Inquiry for ${breed} received! We will WhatsApp you photos & videos. 🐶`);
      closeInquiryModal();
      e.target.reset();
    })
    .catch(() => {
      showAdminToast(`Inquiry received! Details will be sent shortly.`);
      closeInquiryModal();
    });
}

function handleServiceModalSubmit(e) {
  e.preventDefault();
  const service = document.getElementById('modalSelectedService').value;
  const name = e.target.querySelector('input[placeholder*="Sita"]')?.value || 'Client';
  const datetime = e.target.querySelector('input[type="datetime-local"]')?.value || '';

  fetch('/api/inquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'service_booking', name, phone: datetime, subject: service, message: `Requested slot: ${datetime}` })
  })
    .then(res => res.json())
    .then(() => {
      showAdminToast(`Appointment recorded in database! Confirmation sent shortly. 🗓️`);
      closeServiceModal();
      e.target.reset();
    })
    .catch(() => {
      showAdminToast(`Appointment requested! Vet care manager will confirm.`);
      closeServiceModal();
    });
}

function handleNewsletterSubmit() {
  const emailInput = document.getElementById('newsletterEmail');
  const email = emailInput ? emailInput.value : '';

  if (email && email.includes('@')) {
    fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'newsletter', name: 'Subscriber', email, subject: 'Newsletter Subscription' })
    })
      .then(() => {
        showAdminToast('Thank you for subscribing to Chitwan Kennel Club newsletter! 🐾');
        if (emailInput) emailInput.value = '';
      });
  } else {
    alert('Please enter a valid email address.');
  }
}

/* ==========================================
 * 8. Media Overlay Elements Swap & DB Loading
 * ========================================== */
let globalMediaOverrides = {};

function isVideoUrl(url) {
  if (!url) return false;
  return !!url.match(/\.(mp4|webm|mov|ogg|mkv)($|\?)/i) || url.includes('data:video') || url.includes('blob:');
}

function swapMediaElement(container, newSrc) {
  if (!container || !newSrc) return;

  const isVideo = isVideoUrl(newSrc);
  const existingVideo = container.querySelector('video');
  const existingImg = container.querySelector('img');

  if (isVideo) {
    if (existingVideo) {
      existingVideo.src = newSrc;
      existingVideo.load();
      existingVideo.play().catch(() => {});
    } else if (existingImg) {
      const newVideo = document.createElement('video');
      newVideo.src = newSrc;
      newVideo.autoplay = true;
      newVideo.loop = true;
      newVideo.muted = true;
      newVideo.playsInline = true;
      newVideo.controls = false;
      newVideo.className = existingImg.className || 'reel-video-bg';
      existingImg.parentNode.replaceChild(newVideo, existingImg);
      newVideo.load();
      newVideo.play().catch(() => {});
    }
  } else {
    if (existingImg) {
      existingImg.src = newSrc;
    } else if (existingVideo) {
      const newImg = document.createElement('img');
      newImg.src = newSrc;
      newImg.className = existingVideo.className || 'reel-video-bg';
      newImg.alt = 'Chitwan Kennel Club Media';
      existingVideo.parentNode.replaceChild(newImg, existingVideo);
    }
  }
}

function loadMediaFromDB() {
  fetch('/api/media')
    .then(res => res.json())
    .then(data => {
      if (data.success && data.media) {
        globalMediaOverrides = data.media;
        Object.keys(data.media).forEach(mediaId => {
          const newSrc = data.media[mediaId];
          if (newSrc) {
            document.querySelectorAll(`[data-admin-media-id="${mediaId}"]`).forEach(container => {
              swapMediaElement(container, newSrc);
            });
          }
        });
      }
    })
    .catch(err => console.log('Loaded static media defaults:', err));
}

/* ==========================================
 * 9. Puppy CRUD Operations with Database
 * ========================================== */
let globalPuppiesData = [];

function loadPuppiesFromDB() {
  fetch('/api/puppies')
    .then(res => res.json())
    .then(data => {
      if (data.success && data.puppies) {
        globalPuppiesData = data.puppies;
        renderPuppiesGrid(globalPuppiesData);
      }
    })
    .catch(err => console.error('Failed to load puppies from DB:', err));
}

function renderPuppiesGrid(puppies) {
  const grid = document.getElementById('puppiesGrid');
  if (!grid) return;

  grid.innerHTML = puppies.map(p => {
    const specPills = (p.specs || '').split(',').map(s => `<span class="spec-pill">${s.trim()}</span>`).join('');
    const puppyId = p.puppy_id || p.id;
    const mediaId = `puppy-img-${puppyId}`;
    const imgUrl = globalMediaOverrides[mediaId] || p.image_url;
    const isVideo = isVideoUrl(imgUrl);

    const mediaTag = isVideo
      ? `<video src="${imgUrl}" autoplay loop muted playsinline class="puppy-media-item"></video>`
      : `<img src="${imgUrl}" alt="${p.name}" class="puppy-media-item">`;

    return `
      <div class="puppy-card" data-category="${p.category}" data-puppy-id="${puppyId}">
        <div class="puppy-card-img-wrap" data-admin-media-id="${mediaId}">
          ${mediaTag}
          <span class="puppy-tag">${p.tag}</span>
          <span class="puppy-age-badge">${p.age}</span>
        </div>
        <div class="puppy-card-body">
          <div class="puppy-header-row">
            <h3 class="puppy-name">${p.name}</h3>
            <span class="puppy-gender">${p.gender}</span>
          </div>
          <p class="puppy-desc">${p.desc}</p>
          <div class="puppy-specs">
            ${specPills}
          </div>
          <div class="puppy-footer">
            <span class="puppy-status">${p.status}</span>
            <button class="inquire-btn" onclick="openInquiryModal('${p.breed || p.name}')">Inquire Now 🐾</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
  initPuppyFilters();

  if (isAdminLoggedIn()) {
    attachAdminEditableTriggers();
  }
}

/* ==========================================
 * 10. Reel Audio/Video Toggle
 * ========================================== */
function toggleVideoMute(videoId, btn) {
  const vid = document.getElementById(videoId);
  if (vid) {
    vid.muted = !vid.muted;
    if (vid.muted) {
      btn.innerHTML = '<i data-lucide="volume-x"></i>';
    } else {
      btn.innerHTML = '<i data-lucide="volume-2"></i>';
      vid.play();
    }
    if (window.lucide) lucide.createIcons();
  }
}

/* ==========================================
 * 11. ADMIN AUTHENTICATION & SESSION MANAGEMENT
 * ========================================== */
const MEDIA_SLOT_DETAILS = {
  'hero-img': { name: 'Hero Banner Showcase Photo/Video', section: 'Home Hero Banner', defaultUrl: 'images/hero_puppies.jpg' },
  'nav-logo': { name: 'Header Navigation Logo', section: 'Header Logo', defaultUrl: 'images/official_logo.png' },
  'reel-img-2': { name: 'Facebook Reel 2 (German Shepherd Frisbee)', section: 'Facebook Media Feed', defaultUrl: 'images/facebook_reel_3.jpg' },
  'reel-video-1': { name: 'Viral TikTok & Video Clip', section: 'TikTok & Video Feed', defaultUrl: 'videos/viral_tiktok.mp4' },
  'puppy-img-1': { name: 'Rottweiler Puppy Photo/Video', section: 'Available Puppies', defaultUrl: 'images/rottweiler_puppy.jpg' },
  'puppy-img-2': { name: 'German Shepherd Puppy Photo/Video', section: 'Available Puppies', defaultUrl: 'images/german_shepherd_puppy.jpg' },
  'puppy-img-3': { name: 'Golden Retriever Puppy Photo/Video', section: 'Available Puppies', defaultUrl: 'images/golden_retriever_puppy.jpg' },
  'puppy-img-4': { name: 'Beagle Tricolor Puppy Photo/Video', section: 'Available Puppies', defaultUrl: 'images/beagle_puppy.jpg' },
  'puppy-img-5': { name: 'Labrador Retriever Photo/Video', section: 'Available Puppies', defaultUrl: 'images/labrador_puppy.jpg' },
  'puppy-img-6': { name: 'Siberian Husky Puppy Photo/Video', section: 'Available Puppies', defaultUrl: 'images/husky_puppy.jpg' },
  'gallery-img-1': { name: 'Gallery Photo 1 (Playtime at Kennel)', section: 'Moments Gallery', defaultUrl: 'images/hero_puppies.jpg' },
  'gallery-img-2': { name: 'Gallery Photo 2 (Champion Rottweiler)', section: 'Moments Gallery', defaultUrl: 'images/rottweiler_puppy.jpg' },
  'gallery-img-3': { name: 'Gallery Photo 3 (Routine Vet Checkup)', section: 'Moments Gallery', defaultUrl: 'images/vet_care.jpg' },
  'gallery-img-4': { name: 'Gallery Photo 4 (Golden Retriever Joy)', section: 'Moments Gallery', defaultUrl: 'images/golden_retriever_puppy.jpg' },
  'about-img': { name: 'About Us Facility Photo/Video', section: 'About Us Section', defaultUrl: 'images/about_kennel.jpg' }
};

function getAdminToken() {
  return localStorage.getItem('ckc_admin_token');
}

function setAdminToken(token) {
  localStorage.setItem('ckc_admin_token', token);
}

function removeAdminToken() {
  localStorage.removeItem('ckc_admin_token');
}

function isAdminLoggedIn() {
  return !!getAdminToken();
}

function checkAdminSession() {
  const token = getAdminToken();
  if (!token) {
    setAdminModeUI(false);
    return;
  }

  fetch('/api/admin/verify', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setAdminModeUI(true);
      } else {
        removeAdminToken();
        setAdminModeUI(false);
      }
    })
    .catch(() => {
      // Local fallback token check
      setAdminModeUI(true);
    });
}

function setAdminModeUI(active) {
  const floatingBar = document.getElementById('adminFloatingBar');
  const floatingAdminBtn = document.getElementById('floatingAdminBtn');

  if (active) {
    document.body.classList.add('admin-mode-active');
    if (floatingBar) floatingBar.style.display = 'flex';
    if (floatingAdminBtn) {
      floatingAdminBtn.classList.add('logged-in');
      const label = floatingAdminBtn.querySelector('.admin-label');
      const iconBox = floatingAdminBtn.querySelector('.admin-icon-box');
      if (label) label.textContent = 'Admin Mode';
      if (iconBox) iconBox.innerHTML = '<i data-lucide="shield-check"></i>';
    }
    attachAdminEditableTriggers();
  } else {
    document.body.classList.remove('admin-mode-active');
    if (floatingBar) floatingBar.style.display = 'none';
    if (floatingAdminBtn) {
      floatingAdminBtn.classList.remove('logged-in');
      const label = floatingAdminBtn.querySelector('.admin-label');
      const iconBox = floatingAdminBtn.querySelector('.admin-icon-box');
      if (label) label.textContent = 'Admin';
      if (iconBox) iconBox.innerHTML = '<i data-lucide="shield"></i>';
    }
    removeAdminEditableTriggers();
  }
  if (window.lucide) lucide.createIcons();
}

function attachAdminEditableTriggers() {
  const editableContainers = document.querySelectorAll('[data-admin-media-id]');
  editableContainers.forEach(container => {
    const mediaId = container.getAttribute('data-admin-media-id');
    if (!mediaId) return;

    // Direct click/tap on container opens editor in admin mode
    container.onclick = (e) => {
      if (isAdminLoggedIn()) {
        const isInteractive = e.target.closest('a, button:not(.admin-media-edit-trigger), input, select, textarea');
        if (!isInteractive) {
          e.preventDefault();
          e.stopPropagation();
          openAdminMediaModal(mediaId);
        }
      }
    };

    let trigger = container.querySelector(':scope > .admin-media-edit-trigger');
    if (!trigger) {
      trigger = document.createElement('button');
      trigger.className = 'admin-media-edit-trigger';
      trigger.type = 'button';
      trigger.innerHTML = '<i data-lucide="camera"></i> <span>Change Media</span>';
      trigger.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        openAdminMediaModal(mediaId);
      };
      container.appendChild(trigger);
    }
  });
  if (window.lucide) lucide.createIcons();
}

function removeAdminEditableTriggers() {
  document.querySelectorAll('.admin-media-edit-trigger').forEach(t => t.remove());
  document.querySelectorAll('[data-admin-media-id]').forEach(c => {
    c.onclick = null;
  });
}

// Modal open/close for Admin Login
function openAdminLoginModal() {
  if (isAdminLoggedIn()) {
    openAdminMediaManagerModal();
    return;
  }
  const modal = document.getElementById('adminLoginModal');
  if (modal) {
    modal.classList.add('active');
    const userInp = document.getElementById('adminUsernameInput');
    const passInp = document.getElementById('adminPasswordInput');
    if (userInp) userInp.value = '';
    if (passInp) passInp.value = '';
    const errBox = document.getElementById('adminPassError');
    if (errBox) errBox.style.display = 'none';
    setTimeout(() => {
      if (userInp) userInp.focus();
    }, 150);
  }
}

function closeAdminLoginModal() {
  const modal = document.getElementById('adminLoginModal');
  if (modal) modal.classList.remove('active');
}

function toggleAdminPasswordVisibility() {
  const passInp = document.getElementById('adminPasswordInput');
  const icon = document.getElementById('togglePasswordIcon');
  if (!passInp) return;

  if (passInp.type === 'password') {
    passInp.type = 'text';
    if (icon) icon.setAttribute('data-lucide', 'eye-off');
  } else {
    passInp.type = 'password';
    if (icon) icon.setAttribute('data-lucide', 'eye');
  }
  if (window.lucide) lucide.createIcons();
}

function handleAdminPassLogin(e) {
  e.preventDefault();
  const username = document.getElementById('adminUsernameInput').value.trim();
  const password = document.getElementById('adminPasswordInput').value;
  const errorBox = document.getElementById('adminPassError');
  const submitBtn = document.getElementById('adminPassSubmitBtn');

  submitBtn.disabled = true;
  submitBtn.innerHTML = 'Authenticating...';

  fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
    .then(res => res.json())
    .then(data => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i data-lucide="lock"></i> Secure Sign In';
      if (window.lucide) lucide.createIcons();

      if (data.success && data.token) {
        setAdminToken(data.token);
        closeAdminLoginModal();
        setAdminModeUI(true);
        showAdminToast('Welcome Administrator! Visual Media Editor is now active.');
      } else {
        if (errorBox) {
          errorBox.textContent = data.error || 'Invalid credentials.';
          errorBox.style.display = 'block';
        }
      }
    })
    .catch(err => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i data-lucide="lock"></i> Secure Sign In';
      if (window.lucide) lucide.createIcons();
      if (errorBox) {
        errorBox.textContent = 'Server connection error. Please try again.';
        errorBox.style.display = 'block';
      }
    });
}

function handleAdminLogout() {
  removeAdminToken();
  setAdminModeUI(false);
  closeAdminMediaModal();
  closeAdminMediaManagerModal();
  showAdminToast('Admin mode disabled. Changes remain saved in database.');
}

/* ==========================================
 * 12. ADMIN MEDIA EDIT MODAL & PERSISTENCE
 * ========================================== */
let currentEditingMedia = {
  id: null,
  originalUrl: null,
  currentPreviewUrl: null,
  fileToUpload: null,
  mediaType: 'image'
};

function openAdminMediaModal(mediaId) {
  const modal = document.getElementById('adminMediaModal');
  if (!modal) return;

  const slotInfo = MEDIA_SLOT_DETAILS[mediaId] || { name: mediaId, section: 'Website Section', defaultUrl: '' };
  const currentUrl = globalMediaOverrides[mediaId] || slotInfo.defaultUrl;

  currentEditingMedia = {
    id: mediaId,
    originalUrl: currentUrl,
    currentPreviewUrl: currentUrl,
    fileToUpload: null,
    mediaType: isVideoUrl(currentUrl) ? 'video' : 'image'
  };

  document.getElementById('editMediaId').value = mediaId;
  document.getElementById('editMediaDefaultUrl').value = slotInfo.defaultUrl;
  document.getElementById('mediaModalSectionBadge').textContent = slotInfo.section;
  document.getElementById('mediaModalTitle').textContent = `Change ${slotInfo.name}`;
  document.getElementById('mediaUrlInput').value = currentUrl;
  document.getElementById('mediaFileInput').value = '';
  document.getElementById('mediaFileSelectedName').style.display = 'none';

  const statusBox = document.getElementById('adminMediaStatus');
  if (statusBox) statusBox.style.display = 'none';

  switchMediaTab('upload');
  updateMediaModalPreview(currentUrl);

  modal.classList.add('active');
  if (window.lucide) lucide.createIcons();
}

function closeAdminMediaModal() {
  const modal = document.getElementById('adminMediaModal');
  if (modal) modal.classList.remove('active');
  currentEditingMedia = { id: null, originalUrl: null, currentPreviewUrl: null, fileToUpload: null, mediaType: 'image' };
}

function switchMediaTab(tab) {
  const tabUploadBtn = document.getElementById('tabUploadBtn');
  const tabUrlBtn = document.getElementById('tabUrlBtn');
  const uploadPane = document.getElementById('mediaUploadPane');
  const urlPane = document.getElementById('mediaUrlPane');

  if (tab === 'upload') {
    tabUploadBtn.classList.add('active');
    tabUrlBtn.classList.remove('active');
    uploadPane.style.display = 'block';
    urlPane.style.display = 'none';
  } else {
    tabUrlBtn.classList.add('active');
    tabUploadBtn.classList.remove('active');
    urlPane.style.display = 'block';
    uploadPane.style.display = 'none';
  }
}

function updateMediaModalPreview(src) {
  const imgEl = document.getElementById('adminPreviewImg');
  const videoEl = document.getElementById('adminPreviewVideo');
  const typeBadge = document.getElementById('mediaTypeBadge');

  if (!src) {
    if (imgEl) imgEl.style.display = 'none';
    if (videoEl) videoEl.style.display = 'none';
    return;
  }

  const isVideo = isVideoUrl(src);
  currentEditingMedia.currentPreviewUrl = src;
  currentEditingMedia.mediaType = isVideo ? 'video' : 'image';

  if (typeBadge) {
    typeBadge.textContent = isVideo ? '🎥 VIDEO' : '🖼️ IMAGE';
    typeBadge.style.color = isVideo ? '#00F2FE' : '#FFD700';
  }

  if (isVideo) {
    if (imgEl) imgEl.style.display = 'none';
    if (videoEl) {
      videoEl.style.display = 'block';
      videoEl.src = src;
      videoEl.load();
      videoEl.play().catch(() => {});
    }
  } else {
    if (videoEl) {
      videoEl.style.display = 'none';
      videoEl.pause();
    }
    if (imgEl) {
      imgEl.style.display = 'block';
      imgEl.src = src;
    }
  }
}

function handleAdminFileSelected(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  currentEditingMedia.fileToUpload = file;
  const fileNameDisplay = document.getElementById('mediaFileSelectedName');
  const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2);
  fileNameDisplay.textContent = `Selected: ${file.name} (${fileSizeMb} MB)`;
  fileNameDisplay.style.display = 'block';

  // Instant blob preview
  const blobUrl = URL.createObjectURL(file);
  const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|ogg|mkv)$/i);
  currentEditingMedia.mediaType = isVideo ? 'video' : 'image';

  updateMediaModalPreview(blobUrl);
}

function handleAdminUrlInput(e) {
  const url = e.target.value.trim();
  if (url) {
    currentEditingMedia.fileToUpload = null;
    document.getElementById('mediaFileSelectedName').style.display = 'none';
    updateMediaModalPreview(url);
  }
}

// Drag & drop support for drop zone
document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('mediaDropZone');
  if (dropZone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
      }, false);
    });

    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        document.getElementById('mediaFileInput').files = files;
        handleAdminFileSelected({ target: { files } });
      }
    });
  }
});

// Save media to DB API
async function handleSaveAdminMedia() {
  const token = getAdminToken();
  if (!token) {
    openAdminLoginModal();
    return;
  }

  const mediaId = currentEditingMedia.id;
  const saveBtn = document.getElementById('btnSaveMedia');
  const loadingOverlay = document.getElementById('mediaPreviewLoading');
  const statusBox = document.getElementById('adminMediaStatus');

  saveBtn.disabled = true;
  saveBtn.innerHTML = 'Saving to Database...';
  if (loadingOverlay) loadingOverlay.style.display = 'flex';
  if (statusBox) statusBox.style.display = 'none';

  try {
    let finalUrl = currentEditingMedia.currentPreviewUrl;
    let finalMediaType = currentEditingMedia.mediaType;

    // Step 1: Upload file to server if a new file was chosen
    if (currentEditingMedia.fileToUpload) {
      const formData = new FormData();
      formData.append('file', currentEditingMedia.fileToUpload);

      const uploadRes = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const uploadData = await uploadRes.json();
      if (!uploadData.success) {
        throw new Error(uploadData.error || 'Failed to upload media file.');
      }
      finalUrl = uploadData.url;
      finalMediaType = uploadData.mediaType;
    }

    // Step 2: Persist media override into SQLite Database
    const saveRes = await fetch('/api/admin/media', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        media_id: mediaId,
        url: finalUrl,
        media_type: finalMediaType
      })
    });

    const saveData = await saveRes.json();
    if (!saveData.success) {
      throw new Error(saveData.error || 'Database save failed.');
    }

    // Step 3: Update local state and DOM in real time
    globalMediaOverrides[mediaId] = finalUrl;

    document.querySelectorAll(`[data-admin-media-id="${mediaId}"]`).forEach(container => {
      swapMediaElement(container, finalUrl);
    });

    // If logo was edited, update all header/footer logo instances
    if (mediaId === 'nav-logo') {
      document.querySelectorAll('.nav-official-logo, .footer-official-logo').forEach(img => {
        img.src = finalUrl;
      });
    }

    closeAdminMediaModal();
    showAdminToast(`✨ Saved! "${MEDIA_SLOT_DETAILS[mediaId]?.name || mediaId}" updated permanently.`);

  } catch (err) {
    console.error('Admin save media error:', err);
    if (statusBox) {
      statusBox.className = 'admin-status-box error';
      statusBox.textContent = `Error: ${err.message}`;
      statusBox.style.display = 'block';
    }
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i data-lucide="save"></i> Save & Apply Changes';
    if (loadingOverlay) loadingOverlay.style.display = 'none';
    if (window.lucide) lucide.createIcons();
  }
}

// Reset media to default
async function handleResetMediaDefault() {
  const token = getAdminToken();
  if (!token) return;

  const mediaId = currentEditingMedia.id;
  const slotInfo = MEDIA_SLOT_DETAILS[mediaId];
  if (!confirm(`Reset "${slotInfo?.name || mediaId}" back to original default?`)) {
    return;
  }

  try {
    const res = await fetch('/api/admin/media/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ media_id: mediaId })
    });

    const data = await res.json();
    if (data.success) {
      delete globalMediaOverrides[mediaId];
      const defaultUrl = data.defaultUrl || slotInfo?.defaultUrl;
      if (defaultUrl) {
        document.querySelectorAll(`[data-admin-media-id="${mediaId}"]`).forEach(container => {
          swapMediaElement(container, defaultUrl);
        });
      }
      closeAdminMediaModal();
      showAdminToast(`Reset "${slotInfo?.name || mediaId}" to original default.`);
    }
  } catch (err) {
    console.error('Reset error:', err);
    alert('Failed to reset media to default.');
  }
}

/* ==========================================
 * 13. ADMIN MEDIA MANAGER (15 SLOTS OVERVIEW)
 * ========================================== */
function openAdminMediaManagerModal() {
  const modal = document.getElementById('adminMediaManagerModal');
  if (!modal) return;
  modal.classList.add('active');

  fetch('/api/media')
    .then(res => res.json())
    .then(data => {
      const overrides = (data.success && data.media) ? data.media : {};
      const slots = Object.keys(MEDIA_SLOT_DETAILS).map(slotId => {
        const detail = MEDIA_SLOT_DETAILS[slotId];
        const isOverridden = !!overrides[slotId];
        const currentUrl = overrides[slotId] || detail.defaultUrl;
        return {
          id: slotId,
          name: detail.name,
          section: detail.section,
          currentUrl,
          isOverridden
        };
      });
      renderAdminManagerSlots(slots);
    });
}

function closeAdminMediaManagerModal() {
  const modal = document.getElementById('adminMediaManagerModal');
  if (modal) modal.classList.remove('active');
}

function renderAdminManagerSlots(slots) {
  const grid = document.getElementById('managerSlotsGrid');
  if (!grid) return;

  grid.innerHTML = slots.map(slot => {
    const isVideo = isVideoUrl(slot.currentUrl);
    const mediaThumb = isVideo
      ? `<video src="${slot.currentUrl}" autoplay loop muted playsinline></video>`
      : `<img src="${slot.currentUrl}" alt="${slot.name}">`;

    const statusBadge = slot.isOverridden
      ? `<span class="manager-slot-status">Customized</span>`
      : `<span class="manager-slot-status default">Default</span>`;

    return `
      <div class="manager-slot-card">
        <div class="manager-slot-thumb">
          ${mediaThumb}
          <span class="manager-slot-badge">${isVideo ? 'VIDEO' : 'IMAGE'}</span>
          ${statusBadge}
        </div>
        <div class="manager-slot-body">
          <span class="manager-slot-section">${slot.section}</span>
          <h4 class="manager-slot-name">${slot.name}</h4>
          <button class="manager-slot-btn" onclick="closeAdminMediaManagerModal(); openAdminMediaModal('${slot.id}')">
            <i data-lucide="edit-3"></i> Edit Photo / Video
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

/* ==========================================
 * 14. ADMIN TOAST NOTIFICATION
 * ========================================== */
let toastTimeout = null;

function showAdminToast(message) {
  const toast = document.getElementById('adminToast');
  if (!toast) return;

  toast.innerHTML = `<i data-lucide="check-circle-2" style="color: #22C55E; width: 18px; height: 18px;"></i> <span>${message}</span>`;
  toast.classList.add('show');
  if (window.lucide) lucide.createIcons();

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

/* ==========================================
 * 15. CONTINUOUS LOOPING GALLERY SLIDER
 * ========================================== */
function initGallerySlider() {
  const marquee = document.getElementById('galleryMarquee');
  const track = document.getElementById('galleryTrack');
  const prevBtn = document.getElementById('galleryPrevBtn');
  const nextBtn = document.getElementById('galleryNextBtn');
  if (!marquee || !track) return;

  const scrollStep = 320;

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      track.classList.add('is-paused');
      marquee.scrollBy({ left: -scrollStep, behavior: 'smooth' });
      setTimeout(() => track.classList.remove('is-paused'), 2500);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      track.classList.add('is-paused');
      marquee.scrollBy({ left: scrollStep, behavior: 'smooth' });
      setTimeout(() => track.classList.remove('is-paused'), 2500);
    });
  }

  // Touch and mouse drag interaction
  let isDown = false;
  let startX;
  let scrollLeft;

  marquee.addEventListener('mousedown', (e) => {
    isDown = true;
    track.classList.add('is-paused');
    startX = e.pageX - marquee.offsetLeft;
    scrollLeft = marquee.scrollLeft;
  });

  marquee.addEventListener('mouseleave', () => {
    if (isDown) {
      isDown = false;
      track.classList.remove('is-paused');
    }
  });

  marquee.addEventListener('mouseup', () => {
    if (isDown) {
      isDown = false;
      setTimeout(() => track.classList.remove('is-paused'), 1500);
    }
  });

  marquee.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - marquee.offsetLeft;
    const walk = (x - startX) * 1.5;
    marquee.scrollLeft = scrollLeft - walk;
  });

  // Touch support for mobile / tablets
  marquee.addEventListener('touchstart', () => {
    track.classList.add('is-paused');
  }, { passive: true });

  marquee.addEventListener('touchend', () => {
    setTimeout(() => track.classList.remove('is-paused'), 1800);
  }, { passive: true });
}

/* ==========================================
 * Testimonials Looping Carousel Engine
 * ========================================== */
function initTestimonialsCarousel() {
  const card = document.getElementById('testimonialCard');
  const quoteEl = document.getElementById('testimonialText');
  const authorEl = document.getElementById('testimonialAuthor');
  const locEl = document.getElementById('testimonialLoc');
  const prevBtn = document.getElementById('prevTestimonial');
  const nextBtn = document.getElementById('nextTestimonial');
  const dotsContainer = document.getElementById('testimonialDots');
  const wrap = document.getElementById('testimonialCardWrap');

  if (!card || !quoteEl) return;

  const defaultReviews = [
    {
      quote: "I got my Rottweiler puppy from Chitwan Kennel Club 6 months ago. The puppy arrived healthy, fully vaccinated, and extremely well-socialized. Dr. Kamala and the team at Gautam Chowk are always available whenever I need advice!",
      author: "Sujan Shrestha",
      location: "Bharatpur-10, Chitwan"
    },
    {
      quote: "The best veterinary clinic and kennel in Bharatpur! They performed minor ear care surgery on my German Shepherd with utmost precision and tender loving care. Highly recommend to all pet owners in Nepal.",
      author: "Aakriti Gurung",
      location: "Narayangarh, Chitwan"
    },
    {
      quote: "Finding purebred, ethically raised Golden Retrievers in Nepal used to be tough. Chitwan Kennel Club provided full vaccination records, microchip details, and genuine care. My dog Bruno is the joy of our family!",
      author: "Rohan Pokharel",
      location: "Gaindakot, Nawalpur"
    },
    {
      quote: "Outstanding boarding and dog training service! Left my Beagle for 10 days while traveling to Kathmandu, and he was returned clean, happy, and well-exercised.",
      author: "Deepak Karki",
      location: "Bharatpur-7, Chitwan"
    },
    {
      quote: "Extremely professional staff and ethical breeders! My Siberian Husky puppy arrived in perfect condition with complete deworming and health guarantee.",
      author: "Pooja Thapa",
      location: "Tandi, Chitwan"
    }
  ];

  let reviews = [...defaultReviews];
  let currentIndex = 0;
  let autoSlideTimer = null;
  let isAnimating = false;

  // Try to load dynamic reviews from API if available
  fetch('/api/testimonials')
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data) && data.length > 0) {
        reviews = data;
        renderDots();
      }
    })
    .catch(() => {});

  function renderDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    reviews.forEach((_, idx) => {
      const dot = document.createElement('button');
      dot.className = `testimonial-dot ${idx === currentIndex ? 'active' : ''}`;
      dot.setAttribute('aria-label', `Go to review ${idx + 1}`);
      dot.onclick = () => {
        if (idx !== currentIndex && !isAnimating) {
          goToReview(idx, idx > currentIndex ? 'next' : 'prev');
        }
      };
      dotsContainer.appendChild(dot);
    });
  }

  function updateDots() {
    if (!dotsContainer) return;
    const dots = dotsContainer.querySelectorAll('.testimonial-dot');
    dots.forEach((d, idx) => {
      d.classList.toggle('active', idx === currentIndex);
    });
  }

  function goToReview(newIndex, direction = 'next') {
    if (isAnimating) return;
    isAnimating = true;

    const outClass = direction === 'next' ? 'slide-out-left' : 'slide-out-right';
    const inClass = direction === 'next' ? 'slide-in-left' : 'slide-in-right';

    card.classList.remove('slide-out-left', 'slide-out-right', 'slide-in-left', 'slide-in-right');
    card.classList.add(outClass);

    setTimeout(() => {
      currentIndex = (newIndex + reviews.length) % reviews.length;
      const review = reviews[currentIndex];

      quoteEl.textContent = `"${review.quote.replace(/^"|"$/g, '')}"`;
      authorEl.textContent = review.author;
      locEl.textContent = review.location;

      updateDots();

      card.classList.remove(outClass);
      card.classList.add(inClass);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          card.classList.remove(inClass);
          setTimeout(() => {
            isAnimating = false;
          }, 350);
        });
      });
    }, 250);
  }

  function nextReview() {
    goToReview(currentIndex + 1, 'next');
  }

  function prevReview() {
    goToReview(currentIndex - 1, 'prev');
  }

  function startAutoSlide() {
    stopAutoSlide();
    autoSlideTimer = setInterval(() => {
      nextReview();
    }, 4500);
  }

  function stopAutoSlide() {
    if (autoSlideTimer) {
      clearInterval(autoSlideTimer);
      autoSlideTimer = null;
    }
  }

  // Event Listeners
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      stopAutoSlide();
      nextReview();
      startAutoSlide();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      stopAutoSlide();
      prevReview();
      startAutoSlide();
    });
  }

  if (wrap) {
    wrap.addEventListener('mouseenter', stopAutoSlide);
    wrap.addEventListener('mouseleave', startAutoSlide);

    // Touch swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    wrap.addEventListener('touchstart', (e) => {
      stopAutoSlide();
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    wrap.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 45) {
        if (diff > 0) nextReview();
        else prevReview();
      }
      startAutoSlide();
    }, { passive: true });
  }

  renderDots();
  startAutoSlide();
}

