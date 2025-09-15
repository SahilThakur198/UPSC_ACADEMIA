document.addEventListener("DOMContentLoaded", () => {
  // --- Shared Logic for All Pages ---

  initParticleAnimation()
  initMobileMenu()

  const enrollForm = document.getElementById("enrollForm")
  if (enrollForm) {
    enrollForm.addEventListener("submit", function (e) {
      e.preventDefault()
      alert("Thank you for your enrollment request! Our team will contact you shortly with further details.")
      this.reset()
    })
  }

  const contactForm = document.getElementById("contactForm")
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault()
      alert("Thank you for your message! We will get back to you soon.")
      this.reset()
    })
  }

  // --- Page-Specific Logic ---
  const bodyId = document.body.id

  if (bodyId === "home-page") {
    initHomePage()
  } else if (bodyId === "enroll-page") {
    initEnrollPage()
  }
})

function initMobileMenu() {
  const mobileMenuBtn = document.getElementById("mobile-menu-btn")
  const navMenu = document.getElementById("nav-menu")
  const navLinks = document.querySelectorAll(".nav-link")

  if (!mobileMenuBtn || !navMenu) {
    console.log("[v0] Mobile menu elements not found")
    return
  }

  console.log("[v0] Initializing mobile menu for Android compatibility")

  // Toggle mobile menu
  mobileMenuBtn.addEventListener("click", (e) => {
    e.preventDefault()
    e.stopPropagation()

    const isActive = mobileMenuBtn.classList.contains("active")

    if (isActive) {
      closeMobileMenu()
    } else {
      openMobileMenu()
    }

    console.log("[v0] Mobile menu toggled:", !isActive ? "opened" : "closed")
  })

  // Close menu when clicking nav links
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      closeMobileMenu()
      console.log("[v0] Nav link clicked, closing mobile menu")
    })
  })

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!navMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
      closeMobileMenu()
    }
  })

  // Close menu on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMobileMenu()
    }
  })

  // Handle orientation change
  window.addEventListener("orientationchange", () => {
    setTimeout(() => {
      closeMobileMenu()
      console.log("[v0] Orientation changed, closing mobile menu")
    }, 100)
  })

  function openMobileMenu() {
    mobileMenuBtn.classList.add("active")
    navMenu.classList.add("active")
    navMenu.style.display = "flex"
    document.body.style.overflow = "hidden"

    // Add haptic feedback for Android
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  }

  function closeMobileMenu() {
    mobileMenuBtn.classList.remove("active")
    navMenu.classList.remove("active")
    document.body.style.overflow = ""

    // Delay hiding to allow animation to complete
    setTimeout(() => {
      if (!navMenu.classList.contains("active")) {
        navMenu.style.display = "none"
      }
    }, 300)
  }

  // Show mobile menu button on mobile devices
  if (window.innerWidth <= 768) {
    mobileMenuBtn.style.display = "flex"
    console.log("[v0] Mobile menu button displayed for mobile device")
  }

  // Handle window resize
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      closeMobileMenu()
      mobileMenuBtn.style.display = "none"
      navMenu.style.display = "flex"
    } else {
      mobileMenuBtn.style.display = "flex"
      if (!navMenu.classList.contains("active")) {
        navMenu.style.display = "none"
      }
    }
  })
}

function initParticleAnimation() {
  const bgDecoration = document.querySelector(".bg-decoration")
  if (!bgDecoration) return

  const particlesContainer = document.createElement("div")
  particlesContainer.className = "particles-container"
  bgDecoration.appendChild(particlesContainer)

  const particleCount = window.innerWidth < 768 ? 5 : window.innerWidth < 1024 ? 10 : 20

  for (let i = 0; i < particleCount; i++) {
    createParticle(particlesContainer)
  }

  if (window.innerWidth > 768) {
    let mouseX = 0
    let mouseY = 0

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX / window.innerWidth
      mouseY = e.clientY / window.innerHeight

      bgDecoration.style.background = `
                linear-gradient(135deg, 
                rgba(10, 43, 87, ${0.05 + mouseX * 0.05}) 0%, 
                rgba(216, 27, 33, ${0.05 + mouseY * 0.05}) 100%)
            `
    })

    window.addEventListener("mousemove", (e) => {
      const particles = particlesContainer.querySelectorAll(".particle")
      particles.forEach((particle, index) => {
        const speed = ((index % 3) + 1) * 0.5
        const x = (e.clientX - window.innerWidth / 2) * speed * 0.01
        const y = (e.clientY - window.innerHeight / 2) * speed * 0.01

        particle.style.transform = `translate(${x}px, ${y}px)`
      })
    })
  }
}

function createParticle(container) {
  const particle = document.createElement("div")
  particle.className = "particle"

  const size = Math.random() * 8 + 4
  particle.style.width = size + "px"
  particle.style.height = size + "px"

  particle.style.left = Math.random() * 100 + "%"
  particle.style.top = Math.random() * 100 + "%"

  particle.style.animationDelay = Math.random() * 6 + "s"
  particle.style.animationDuration = Math.random() * 4 + 6 + "s"

  container.appendChild(particle)

  setTimeout(
    () => {
      if (particle.parentNode) {
        particle.remove()
        createParticle(container)
      }
    },
    (Math.random() * 4 + 6) * 1000,
  )
}

function initHomePage() {
  console.log("[v0] Initializing homepage for Android compatibility")
  console.log("[v0] Viewport dimensions:", window.innerWidth, "x", window.innerHeight)
  console.log("[v0] Device pixel ratio:", window.devicePixelRatio)

  setupHomepageScrolling()
  initMapLoader()
  debugContactSection()
}

function setupHomepageScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()
      const targetId = this.getAttribute("href")
      const target = document.querySelector(targetId)
      if (target) {
        const navbarHeight = document.querySelector(".navbar").offsetHeight
        const targetPosition = target.offsetTop - navbarHeight - 20
        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        })
      }
      console.log("[v0] Nav link clicked, scrolling to target")
    })
  })

  const backToTop = document.getElementById("backToTop")
  if (backToTop) {
    window.addEventListener("scroll", () => {
      backToTop.classList.toggle("visible", window.pageYOffset > 300)
    })
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" })
      console.log("[v0] Back-to-top button clicked, scrolling to top")
    })
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible")
          console.log("[v0] Element intersected, adding visible class")
        }
      })
    },
    { threshold: 0.1 },
  )
  document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el))

  const sections = document.querySelectorAll("section[id]")
  const navLinks = document.querySelectorAll(".nav-menu a.nav-link")
  window.addEventListener("scroll", () => {
    let current = ""
    const navbarHeight = document.querySelector(".navbar").offsetHeight
    sections.forEach((section) => {
      const sectionTop = section.offsetTop - navbarHeight - 50
      if (window.pageYOffset >= sectionTop) {
        current = section.getAttribute("id")
      }
    })

    navLinks.forEach((link) => {
      link.classList.remove("active")
      if (link.getAttribute("href").includes(current)) {
        link.classList.add("active")
        console.log("[v0] Active nav link updated")
      }
    })
  })
}


function initMapLoader() {
  const mapLoading = document.getElementById("map-loading")
  const mapFallback = document.getElementById("map-fallback")
  const googleMap = document.getElementById("google-map")

  setTimeout(() => {
    if (mapLoading) {
      mapLoading.style.display = "none"
    }
    if (googleMap) {
      googleMap.style.display = "block"
    }
  }, 1500)

  window.showMap = () => {
    console.log("[v0] Map loaded successfully")
    if (mapLoading) {
      mapLoading.style.display = "none"
    }
    if (googleMap) {
      googleMap.style.display = "block"
    }
  }

  window.handleMapError = () => {
    console.log("[v0] Map failed to load, showing fallback")
    if (mapLoading) {
      mapLoading.style.display = "none"
    }
    if (mapFallback) {
      mapFallback.style.display = "flex"
    }
    if (googleMap) {
      googleMap.style.display = "none"
    }
  }

  setTimeout(() => {
    if (googleMap && googleMap.style.display === "none") {
      console.log("[v0] Map timeout, showing fallback")
      window.handleMapError()
    }
  }, 5000)
}

function debugContactSection() {
  console.log("[v0] Debugging contact section layout")

  const contactSection = document.getElementById("contact")
  const contactContent = document.querySelector(".contact-content")
  const contactDetails = document.querySelector(".contact-details")
  const contactFormWrapper = document.querySelector(".contact-form-wrapper")
  const chatbotContainer = document.querySelector(".chatbot-container")
  const mapContainer = document.querySelector(".map-container")

  if (contactSection) {
    const rect = contactSection.getBoundingClientRect()
    console.log("[v0] Contact section dimensions:", rect.width, "x", rect.height)
    console.log("[v0] Contact section position:", rect.left, rect.top)
  }

  if (contactContent) {
    const rect = contactContent.getBoundingClientRect()
    console.log("[v0] Contact content dimensions:", rect.width, "x", rect.height)
    console.log("[v0] Contact content overflow:", rect.right > window.innerWidth ? "YES" : "NO")
  }

  if (contactDetails) {
    const rect = contactDetails.getBoundingClientRect()
    console.log("[v0] Contact details dimensions:", rect.width, "x", rect.height)
    console.log("[v0] Contact details overflow:", rect.right > window.innerWidth ? "YES" : "NO")
  }

  if (contactFormWrapper) {
    const rect = contactFormWrapper.getBoundingClientRect()
    console.log("[v0] Contact form wrapper dimensions:", rect.width, "x", rect.height)
    console.log("[v0] Contact form wrapper overflow:", rect.right > window.innerWidth ? "YES" : "NO")
  }

  if (chatbotContainer) {
    const rect = chatbotContainer.getBoundingClientRect()
    console.log("[v0] Chatbot container dimensions:", rect.width, "x", rect.height)
    console.log("[v0] Chatbot container overflow:", rect.right > window.innerWidth ? "YES" : "NO")
  }

  if (mapContainer) {
    const rect = mapContainer.getBoundingClientRect()
    console.log("[v0] Map container dimensions:", rect.width, "x", rect.height)
    console.log("[v0] Map container overflow:", rect.right > window.innerWidth ? "YES" : "NO")
  }

  // Check for horizontal scrolling
  const bodyWidth = document.body.scrollWidth
  const windowWidth = window.innerWidth
  console.log("[v0] Body scroll width:", bodyWidth)
  console.log("[v0] Window inner width:", windowWidth)
  console.log("[v0] Horizontal overflow:", bodyWidth > windowWidth ? "YES" : "NO")

  // Monitor resize events for debugging
  window.addEventListener("resize", () => {
    console.log("[v0] Window resized to:", window.innerWidth, "x", window.innerHeight)
    setTimeout(() => debugContactSection(), 100)
  })
}

function optimizeForMobile() {
  console.log("[v0] Optimizing for mobile device")
  console.log("[v0] Hardware concurrency:", navigator.hardwareConcurrency)
  console.log("[v0] Device memory:", navigator.deviceMemory)

  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
    document.documentElement.style.setProperty("--animation-duration", "0.2s")
    console.log("[v0] Reduced animation duration for low-end device")
  }

  if (window.innerWidth < 480 || (navigator.deviceMemory && navigator.deviceMemory < 2)) {
    const particlesContainer = document.querySelector(".particles-container")
    if (particlesContainer) {
      particlesContainer.style.display = "none"
      console.log("[v0] Disabled particles for performance")
    }
  }

  const isAndroid = /Android/i.test(navigator.userAgent)
  if (isAndroid) {
    console.log("[v0] Android device detected, applying optimizations")
    document.body.classList.add("android-device")

    const setVH = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty("--vh", `${vh}px`)
    }
    setVH()
    window.addEventListener("resize", setVH)
    window.addEventListener("orientationchange", () => {
      setTimeout(setVH, 100)
    })
  }
}

function initEnrollPage() {
  const form = document.getElementById("enrollForm")
  if (form) {
    const inputs = form.querySelectorAll("input, select")

    inputs.forEach((input) => {
      input.addEventListener("focus", function () {
        this.parentElement.classList.add("focused")
        console.log("[v0] Input focused, adding focused class")
      })

      input.addEventListener("blur", function () {
        this.parentElement.classList.remove("focused")
        if (this.value) {
          this.parentElement.classList.add("filled")
          console.log("[v0] Input blurred, adding filled class")
        } else {
          this.parentElement.classList.remove("filled")
          console.log("[v0] Input blurred, removing filled class")
        }
      })
    })
  }
}

window.addEventListener("orientationchange", () => {
  setTimeout(() => {
    console.log("[v0] Orientation changed, recalculating layout")

    const particlesContainer = document.querySelector(".particles-container")
    if (particlesContainer && window.innerWidth >= 480) {
      particlesContainer.innerHTML = ""
      const particleCount = window.innerWidth < 768 ? 5 : window.innerWidth < 1024 ? 10 : 20
      for (let i = 0; i < particleCount; i++) {
        createParticle(particlesContainer)
      }
      console.log("[v0] Recreated particles after orientation change")
    }
  }, 100)
})

if ("ontouchstart" in window) {
  document.addEventListener("touchstart", () => {}, { passive: true })
  document.addEventListener("touchmove", () => {}, { passive: true })
}
