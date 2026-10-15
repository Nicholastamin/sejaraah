/* =========================================
   API KEMERDEKAAN
   Presentation Controller
========================================= */
(() => {
  "use strict";
  const slides = [...document.querySelectorAll(".slide")];
  const progressBar = document.getElementById("progressBar");
  const currentSlideLabel = document.getElementById("currentSlide");
  const totalSlidesLabel = document.getElementById("totalSlides");
  const dotsContainer = document.getElementById("slideDots");
  const previousButton = document.getElementById("prevBtn");
  const nextButton = document.getElementById("nextBtn");
  if (!slides.length) return;
  let currentIndex = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let isScrolling = false;
  const totalSlides = slides.length;
  // Format angka menjadi 01, 02, 03, dan seterusnya.
  const formatNumber = (number) =>
    String(number).padStart(2, "0");
  // Jumlah slide.
  if (totalSlidesLabel) {
    totalSlidesLabel.textContent = formatNumber(totalSlides);
  }
  // =========================================
  // MEMBUAT NAVIGASI TITIK
  // =========================================
  const dots = [];
  if (dotsContainer) {
    slides.forEach((slide, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute(
        "aria-label",
        `Buka slide ${index + 1}`
      );
      dot.title = `Slide ${index + 1}`;
      dot.addEventListener("click", () => {
        goToSlide(index);
      });
      dotsContainer.appendChild(dot);
      dots.push(dot);
    });
  }
  // =========================================
  // MEMPERBARUI INFORMASI SLIDE
  // =========================================
  function updateInterface(index) {
    currentIndex = Math.max(
      0,
      Math.min(index, totalSlides - 1)
    );
    if (currentSlideLabel) {
      currentSlideLabel.textContent =
        formatNumber(currentIndex + 1);
    }
    if (progressBar) {
      const progress =
        ((currentIndex + 1) / totalSlides) * 100;
      progressBar.style.width = `${progress}%`;
    }
    dots.forEach((dot, index) => {
      const active = index === currentIndex;
      dot.classList.toggle("active", active);
      if (active) {
        dot.setAttribute("aria-current", "step");
      } else {
        dot.removeAttribute("aria-current");
      }
    });
    if (previousButton) {
      previousButton.disabled = currentIndex === 0;
      previousButton.setAttribute(
        "aria-label",
        currentIndex === 0
          ? "Slide sebelumnya tidak tersedia"
          : "Slide sebelumnya"
      );
    }
    if (nextButton) {
      nextButton.disabled = currentIndex === totalSlides - 1;
      nextButton.setAttribute(
        "aria-label",
        currentIndex === totalSlides - 1
          ? "Ini adalah slide terakhir"
          : "Slide berikutnya"
      );
    }
  }
  // =========================================
  // BERPINDAH SLIDE
  // =========================================
  function goToSlide(index) {
    const targetIndex = Math.max(
      0,
      Math.min(index, totalSlides - 1)
    );
    const targetSlide = slides[targetIndex];
    if (!targetSlide) return;
    currentIndex = targetIndex;
    updateInterface(currentIndex);
    targetSlide.scrollIntoView({
      behavior: window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
        ? "auto"
        : "smooth",
      block: "start"
    });
  }
  function nextSlide() {
    if (currentIndex < totalSlides - 1) {
      goToSlide(currentIndex + 1);
    }
  }
  function previousSlide() {
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1);
    }
  }
  // =========================================
  // TOMBOL NAVIGASI
  // =========================================
  if (previousButton) {
    previousButton.addEventListener(
      "click",
      previousSlide
    );
  }
  if (nextButton) {
    nextButton.addEventListener(
      "click",
      nextSlide
    );
  }
  // =========================================
  // NAVIGASI KEYBOARD
  // =========================================
  document.addEventListener("keydown", (event) => {
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      (
        target.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
      )
    ) {
      return;
    }
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
      case "PageDown":
        event.preventDefault();
        nextSlide();
        break;
      case "ArrowLeft":
      case "ArrowUp":
      case "PageUp":
        event.preventDefault();
        previousSlide();
        break;
      case " ":
        event.preventDefault();
        if (event.shiftKey) {
          previousSlide();
        } else {
          nextSlide();
        }
        break;
      case "Home":
        event.preventDefault();
        goToSlide(0);
        break;
      case "End":
        event.preventDefault();
        goToSlide(totalSlides - 1);
        break;
    }
  });
  // =========================================
  // GESTUR SENTUH UNTUK HP
  // =========================================
  document.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.changedTouches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    },
    { passive: true }
  );
  document.addEventListener(
    "touchend",
    (event) => {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      // Hanya mendeteksi geseran horizontal.
      if (
        Math.abs(deltaX) > 65 &&
        Math.abs(deltaX) > Math.abs(deltaY) * 1.3
      ) {
        if (deltaX < 0) {
          nextSlide();
        } else {
          previousSlide();
        }
      }
    },
    { passive: true }
  );
  // =========================================
  // DETEKSI SLIDE YANG SEDANG TERLIHAT
  // =========================================
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = slides.indexOf(entry.target);
            if (index !== -1) {
              updateInterface(index);
              entry.target.classList.add("visible");
            }
          }
        });
      },
      {
        threshold: 0.55
      }
    );
    slides.forEach((slide) => {
      observer.observe(slide);
    });
  } else {
    // Fallback untuk browser lama.
    slides.forEach((slide) => {
      slide.classList.add("visible");
    });
  }
  // =========================================
  // SINKRONISASI SAAT SCROLL MANUAL
  // =========================================
  let scrollTimer;
  window.addEventListener(
    "scroll",
    () => {
      if (isScrolling) return;
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const viewportCenter =
          window.innerHeight / 2;
        let nearestIndex = 0;
        let nearestDistance = Infinity;
        slides.forEach((slide, index) => {
          const rect = slide.getBoundingClientRect();
          const slideCenter =
            rect.top + rect.height / 2;
          const distance = Math.abs(
            slideCenter - viewportCenter
          );
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
          }
        });
        updateInterface(nearestIndex);
      }, 80);
    },
    { passive: true }
  );
  // =========================================
  // HASH URL: #slide-1, #slide-2, DST.
  // =========================================
  function readHash() {
    const match = window.location.hash.match(
      /^#slide-(\d+)$/
    );
    if (!match) return;
    const index = Number(match[1]) - 1;
    if (index >= 0 && index < totalSlides) {
      goToSlide(index);
    }
  }
  window.addEventListener("hashchange", readHash);
  // =========================================
  // INISIALISASI
  // =========================================
  slides.forEach((slide) => {
    slide.setAttribute("tabindex", "-1");
  });
  updateInterface(0);
  // Tampilkan slide pertama tanpa menunggu animasi.
  slides[0].classList.add("visible");
  // Buka slide sesuai URL jika tersedia.
  if (window.location.hash) {
    requestAnimationFrame(readHash);
  }
})();
