/**
 * Full-Stack Web Development Mentorship - Slide Presentation Controller
 * Lightweight Vanilla JavaScript (Zero external dependencies)
 */

document.addEventListener('DOMContentLoaded', () => {
  initDeckNavigation();
  initSidebar();
  initProgressTracker();
  initKeyboardNav();
  initTouchGestures();
});

// Storage Key
const STORAGE_KEY = 'mentorship_syllabus_progress';
const TOTAL_MODULES = 16;

// State
let completedModules = new Set();
let allExpanded = true;
let currentSlideIndex = 0;
let totalSlides = 11;

/**
 * Slide Navigation System
 */
function initDeckNavigation() {
  const slides = document.querySelectorAll('.slide-pane');
  totalSlides = slides.length;

  // Build Pagination Dots
  const dotsContainer = document.getElementById('deck-dots-container');
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    for (let i = 0; i < totalSlides; i++) {
      const dot = document.createElement('button');
      dot.className = `deck-dot ${i === 0 ? 'active' : ''}`;
      dot.title = `Go to Slide ${i + 1}`;
      dot.onclick = () => goToSlide(i);
      dotsContainer.appendChild(dot);
    }
  }

  showSlide(0);
}

/**
 * Responsive Sidebar Drawer Controls
 */
function initSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle-btn');
  const closeBtn = document.getElementById('sidebar-close-btn');
  const overlay = document.getElementById('sidebar-overlay');

  function openSidebar() {
    if (sidebar) sidebar.classList.add('sidebar-open');
    if (overlay) overlay.classList.add('active');
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('sidebar-open');
    if (overlay) overlay.classList.remove('active');
  }

  if (toggleBtn) toggleBtn.addEventListener('click', openSidebar);
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
  if (overlay) overlay.addEventListener('click', closeSidebar);
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('sidebar-open');
  if (overlay) overlay.classList.remove('active');
}

window.goToSlide = function(index) {
  if (index < 0 || index >= totalSlides) return;
  currentSlideIndex = index;
  showSlide(currentSlideIndex);
  closeMobileSidebar();
};

window.nextSlide = function() {
  if (currentSlideIndex < totalSlides - 1) {
    currentSlideIndex++;
    showSlide(currentSlideIndex);
  }
};

window.prevSlide = function() {
  if (currentSlideIndex > 0) {
    currentSlideIndex--;
    showSlide(currentSlideIndex);
  }
};

function showSlide(index) {
  const slides = document.querySelectorAll('.slide-pane');
  slides.forEach((slide, i) => {
    if (i === index) {
      slide.classList.add('active');
      const scrollArea = slide.querySelector('.slide-scroll');
      if (scrollArea) scrollArea.scrollTop = 0;
    } else {
      slide.classList.remove('active');
    }
  });

  // Buttons state
  const prevBtn = document.getElementById('prev-slide-btn');
  const nextBtn = document.getElementById('next-slide-btn');
  if (prevBtn) prevBtn.disabled = (index === 0);
  if (nextBtn) nextBtn.disabled = (index === totalSlides - 1);

  // Counter
  const paddedCurrent = String(index + 1).padStart(2, '0');
  const paddedTotal = String(totalSlides).padStart(2, '0');
  const counterText = `${paddedCurrent} / ${paddedTotal}`;

  const counter = document.getElementById('deck-counter-text');
  if (counter) counter.textContent = counterText;

  const mobileCounter = document.getElementById('mobile-slide-counter');
  if (mobileCounter) mobileCounter.textContent = counterText;

  // Dots
  const dots = document.querySelectorAll('.deck-dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });

  // Tab buttons
  const tabButtons = document.querySelectorAll('#phase-nav-links .tab-btn');
  tabButtons.forEach((btn, i) => {
    btn.classList.toggle('active', i === index);
  });

  if (tabButtons[index]) {
    tabButtons[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/**
 * Keyboard Controls (Arrow Right/Left, Space, PageUp/Down)
 */
function initKeyboardNav() {
  document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault();
      nextSlide();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      prevSlide();
    } else if (e.key === 'Home') {
      e.preventDefault();
      goToSlide(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      goToSlide(totalSlides - 1);
    }
  });
}

/**
 * Touch Swipe Gestures
 */
function initTouchGestures() {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  const container = document.getElementById('slides-container');
  if (!container) return;

  container.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  container.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX < 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  }
}

/**
 * Progress Checklist & LocalStorage Sync
 */
function initProgressTracker() {
  loadProgress();
  updateProgressUI();

  // Reset button
  const resetBtn = document.getElementById('reset-progress-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset your completed module checklist?')) {
        completedModules.clear();
        saveProgress();
        syncCheckboxes();
        updateProgressUI();
      }
    });
  }

  // Toggle All button
  const toggleAllBtn = document.getElementById('toggle-all-btn');
  if (toggleAllBtn) {
    toggleAllBtn.addEventListener('click', toggleAllModules);
  }
}

function loadProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        completedModules = new Set(parsed);
      }
    }
  } catch (e) {
    console.warn('Could not load localStorage progress', e);
  }
  syncCheckboxes();
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(completedModules)));
  } catch (e) {
    console.warn('Could not save to localStorage', e);
  }
}

function syncCheckboxes() {
  for (let i = 0; i < TOTAL_MODULES; i++) {
    const checkbox = document.getElementById(`check-mod-${i}`);
    const card = document.getElementById(`mod-card-${i}`);
    const isCompleted = completedModules.has(i);

    if (checkbox) checkbox.checked = isCompleted;
    if (card) {
      card.classList.toggle('completed', isCompleted);
    }
  }
}

window.toggleModule = function(moduleId) {
  const card = document.getElementById(`mod-card-${moduleId}`);
  if (card) {
    card.classList.toggle('expanded');
  }
};

function toggleAllModules() {
  allExpanded = !allExpanded;
  const cards = document.querySelectorAll('.module-block');
  const toggleBtn = document.getElementById('toggle-all-btn');

  cards.forEach(card => {
    card.classList.toggle('expanded', allExpanded);
  });

  if (toggleBtn) {
    toggleBtn.textContent = allExpanded ? 'Collapse All' : 'Expand All';
  }
}

window.handleModuleToggle = function(moduleId) {
  const checkbox = document.getElementById(`check-mod-${moduleId}`);
  const card = document.getElementById(`mod-card-${moduleId}`);

  if (checkbox.checked) {
    completedModules.add(moduleId);
    if (card) card.classList.add('completed');
  } else {
    completedModules.delete(moduleId);
    if (card) card.classList.remove('completed');
  }

  saveProgress();
  updateProgressUI();
};

function updateProgressUI() {
  const completedCount = completedModules.size;
  const percentage = Math.round((completedCount / TOTAL_MODULES) * 100);

  const summary = document.getElementById('progress-summary');
  const fill = document.getElementById('hud-progress-fill');

  if (summary) {
    summary.textContent = `${completedCount} of ${TOTAL_MODULES} modules completed (${percentage}%)`;
  }
  if (fill) {
    fill.style.width = `${percentage}%`;
  }
}
