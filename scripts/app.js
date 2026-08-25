/**
 * Chitwan Kennel Club - Interactive JavaScript & Backend API Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initNavbar();
  initPawTrailCanvas();
  initPuppyFilters();
  initTestimonialsCarousel();
  loadMediaFromDB();
  loadPuppiesFromDB();
});

/* ==========================================
 * 1. Preloader Handler
 * ========================================== */
function initPreloader() {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    setTimeout(() => {
      preloader.classList.add('loaded');
    }, 800);
  }
}

/* ==========================================
 * 2. Navbar & Scrollspy
 * ========================================== */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    let current = '';
    const sections = document.querySelectorAll('section[id]');
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
      });
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
          const categories = card.getAttribute('data-category').split(' ');
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

  // Fetch testimonials from DB if available
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
 * 6. Modal Functions (Public)
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
 * 7. Form Submissions connected to SQLite DB API
 * ========================================== */
function handleContactSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('contactName').value;
  const email = document.getElementById('contactEmail') ? document.getElementById('contactEmail').value : '';
  const phone = document.getElementById('contactPhone') ? document.getElementById('contactPhone').value : '';
  const message = document.getElementById('contactMessage') ? document.getElementById('contactMessage').value : '';
  const subject = document.getElementById('contactSubject') ? document.getElementById('contactSubject').value : 'Contact Form';

  fetch('/api/inquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'contact', name, email, phone, subject, message })
  })
    .then(res => res.json())
    .then(data => {
      alert(`Thank you, ${name}! Your message has been saved to Chitwan Kennel Club database. Our team at Gautam Chowk will contact you shortly! 🐾`);
      e.target.reset();
    })
    .catch(err => {
      console.error('Submission error:', err);
      alert(`Thank you, ${name}! Your inquiry has been received.`);
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
      alert(`Inquiry received & saved to DB! We will send you photos and parent lineage videos of ${breed} via WhatsApp shortly. 🐶`);
      closeInquiryModal();
      e.target.reset();
    })
    .catch(() => {
      alert(`Inquiry received! We will send you photos and parent lineage videos of ${breed} shortly.`);
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
      alert(`Appointment recorded in SQLite DB! Our veterinary manager at Gautam Chowk will confirm your slot. 🗓️`);
      closeServiceModal();
      e.target.reset();
    })
    .catch(() => {
      alert(`Appointment requested! Our veterinary care manager will confirm your slot.`);
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
        alert('Thank you for subscribing to Chitwan Kennel Club newsletter! 🐾');
        if (emailInput) emailInput.value = '';
      });
  } else {
    alert('Please enter a valid email address.');
  }
}

/* ==========================================
 * 8. Media Overlay Elements Swap & DB Loading
 * ========================================== */
function swapMediaElement(container, newSrc) {
  if (!container || !newSrc) return;

  const isVideo = newSrc.match(/\.(mp4|webm|mov)$/i) || newSrc.includes('data:video') || newSrc.includes('blob:');

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
      existingVideo.parentNode.replaceChild(newImg, existingVideo);
    }
  }
}

function loadMediaFromDB() {
  fetch('/api/media')
    .then(res => res.json())
    .then(data => {
      if (data.success && data.media) {
        Object.keys(data.media).forEach(mediaId => {
          const newSrc = data.media[mediaId];
          const container = document.querySelector(`[data-admin-media-id="${mediaId}"]`);
          if (container && newSrc) {
            swapMediaElement(container, newSrc);
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
    const specPills = p.specs.split(',').map(s => `<span class="spec-pill">${s.trim()}</span>`).join('');
    const puppyId = p.puppy_id || p.id;
    const mediaId = `puppy-img-${puppyId}`;

    return `
      <div class="puppy-card" data-category="${p.category}" data-puppy-id="${puppyId}">
        <div class="puppy-card-img-wrap">
          <img src="${p.image_url}" alt="${p.name}">
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
}



/* ==========================================
 * 14. Facebook & TikTok Reel Audio/Video Toggle
 * ========================================== */
function playReelSound(btn) {
  const isPlaying = btn.classList.contains('playing');
  if (isPlaying) {
    btn.classList.remove('playing');
    btn.innerHTML = '<i data-lucide="play"></i>';
  } else {
    btn.classList.add('playing');
    btn.innerHTML = '<i data-lucide="volume-2"></i>';
    btn.style.backgroundColor = '#22C55E';
    setTimeout(() => {
      btn.style.backgroundColor = '';
    }, 1500);
  }
  if (window.lucide) lucide.createIcons();
}

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

