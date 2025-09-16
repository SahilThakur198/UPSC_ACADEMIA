  document.addEventListener("DOMContentLoaded", async () => {
    // Apply mobile optimizations ASAP to stabilize viewport on Android
    optimizeForMobile()

    await loadLayoutComponents()

    // --- Shared Logic for All Pages ---
    initParticleAnimation()
    initMobileMenu()
    verifyLayoutLoaded()

    // Initialize enrollment submission handler if present
    initEnrollSubmission()

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
        // Hide Demo Class button on enroll page
        // Desktop button
        const enrollBtn = document.querySelector(".enroll-btn.desktop-only")
        if (enrollBtn) enrollBtn.style.display = "none"
        // Mobile button
        const enrollMobile = document.querySelector(".enroll-mobile.mobile-only")
        if (enrollMobile) enrollMobile.parentElement.style.display = "none"
    }
  })

  async function loadLayoutComponents() {
    try {
      const headerHost = document.getElementById("site-header")
      const footerHost = document.getElementById("site-footer")

      let headerInjected = false
      let footerInjected = false

      // Prefer network fetch when running via http/https, else fallback to inline templates (file://)
      if (location.protocol === "http:" || location.protocol === "https:") {
        try {
          const [headerRes, footerRes] = await Promise.all([
            fetch("components/header.html", { cache: "no-cache" }),
            fetch("components/footer.html", { cache: "no-cache" }),
          ])
          if (headerHost && headerRes.ok) {
            headerHost.outerHTML = await headerRes.text()
            headerInjected = true
          }
          if (footerHost && footerRes.ok) {
            footerHost.outerHTML = await footerRes.text()
            footerInjected = true
          }
        } catch (e) {
          console.warn("[layout] Network fetch failed, using inline templates", e)
        }
      }

      // Inline fallback for file:// or failed fetch
      if (!headerInjected && headerHost) {
        headerHost.outerHTML = getHeaderTemplate()
      }
      if (!footerInjected && footerHost) {
        footerHost.outerHTML = getFooterTemplate()
      }

      // After inject, normalize active link based on current hash or page
      markActiveNavLink()
      enableInPageSmoothScroll()
    } catch (err) {
      console.error("[v0] Failed to load layout components", err)
    }
  }

  function verifyLayoutLoaded() {
    const header = document.querySelector(".navbar")
    const footer = document.querySelector(".footer")
    if (!header) {
      console.warn("[layout] Header not found in DOM after injection")
    } else {
      console.log("[layout] Header loaded ✓")
    }
    if (!footer) {
      console.warn("[layout] Footer not found in DOM after injection")
    } else {
      console.log("[layout] Footer loaded ✓")
    }
  }

  function markActiveNavLink() {
    const navLinks = document.querySelectorAll(".nav-menu a.nav-link")
    const currentHash = window.location.hash
    const isHome = document.body.id === "home-page"
    navLinks.forEach((link) => {
      link.classList.remove("active")
      const href = link.getAttribute("href") || ""
      const linkHash = href.includes("#") ? `#${href.split("#")[1]}` : ""
      if ((isHome && linkHash && linkHash === currentHash) || (!currentHash && isHome && linkHash === "#home")) {
        link.classList.add("active")
      }
    })
  }

  function enableInPageSmoothScroll() {
    if (document.body.id !== "home-page") return
    // Handle both pure hash links and index.html# links
    const selector = 'a[href^="#"], a[href^="index.html#"]'
    document.querySelectorAll(selector).forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        const href = this.getAttribute("href") || ""
        const hasHash = href.includes("#")
        const targetId = hasHash ? `#${href.split("#")[1]}` : ""
        const target = targetId ? document.querySelector(targetId) : null
        if (target) {
          e.preventDefault()
          const navbar = document.querySelector(".navbar")
          const navbarHeight = navbar ? navbar.offsetHeight : 0
          const targetPosition = target.offsetTop - navbarHeight - 20
          window.scrollTo({ top: targetPosition, behavior: "smooth" })
          history.replaceState(null, "", targetId)
          markActiveNavLink()
        }
      })
    })
  }

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
      mobileMenuBtn.style.visibility = "visible"
      mobileMenuBtn.style.opacity = "1"
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
        mobileMenuBtn.style.visibility = "visible"
        mobileMenuBtn.style.opacity = "1"
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

    // Reduce particles for small screens and Android
    const isSmall = window.innerWidth < 768
    const isVerySmall = window.innerWidth < 480
    const particleCount = isVerySmall ? 0 : isSmall ? 4 : window.innerWidth < 1024 ? 8 : 16

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
      const navbarEl = document.querySelector(".navbar")
      const navbarHeight = navbarEl ? navbarEl.offsetHeight : 0
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

  // Inline templates used when running from file:// without a server
  function getHeaderTemplate() {
    return (
      '<nav class="navbar" id="main-navbar">\
      <div class="nav-container">\
          <a href="index.html" class="logo">\
              <span class="upsc">UPSC</span> <span class="academia">Academia</span>\
              <img src="./img/logo.png" alt="UPSC Academia Logo" class="nav-logo">\
          </a>\
          <ul class="nav-menu" id="nav-menu">\
              <li><a href="index.html#home" class="nav-link">Home</a></li>\
              <li><a href="index.html#about" class="nav-link">About Us</a></li>\
              <li><a href="index.html#services" class="nav-link">Services</a></li>\
              <li><a href="index.html#facilities" class="nav-link">Facilities</a></li>\
              <li><a href="index.html#resources" class="nav-link">Resources</a></li>\
              <li><a href="index.html#contact" class="nav-link">Contact</a></li>\
              <li class="mobile-only"><a href="enroll.html" class="nav-link enroll-mobile">Enroll Now</a></li>\
          </ul>\
          <div class="nav-actions">\
              <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Toggle mobile menu">\
                  <span class="menu-icon">\
                      <span class="menu-line"></span>\
                      <span class="menu-line"></span>\
                      <span class="menu-line"></span>\
                  </span>\
              </button>\
              <a href="enroll.html" class="enroll-btn desktop-only">Enroll Now</a>\
          </div>\
      </div>\
    </nav>'
    )
  }

  function getFooterTemplate() {
    return (
      '<footer class="footer">\
      <div class="footer-wave" aria-hidden="true">\
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none">\
              <path d="M0,80 C240,140 480,20 720,60 C960,100 1200,60 1440,90 L1440,120 L0,120 Z" fill="#0A2B57" opacity="0.25"></path>\
              <path d="M0,60 C240,100 480,0 720,40 C960,80 1200,40 1440,70 L1440,120 L0,120 Z" fill="#0A2B57" opacity="0.35"></path>\
              <path d="M0,50 C240,90 480,10 720,30 C960,50 1200,30 1440,60 L1440,120 L0,120 Z" fill="#082245"></path>\
          </svg>\
      </div>\
      <div class="container">\
          <div class="footer-content">\
              <div class="footer-section about">\
                  <h3 class="footer-logo"><span class="upsc">UPSC</span> <span class="academia">Academia</span></h3>\
                  <p>Pioneering civil services coaching in Pune, dedicated to nurturing the nation\'s future leaders through expert guidance and innovative teaching.</p>\
                  <div class="social-links">\
                      <a href="https://www.facebook.com/upscacademia" target="_blank" title="Facebook" aria-label="Facebook">\
                          <svg viewBox="0 0 24 24" role="img" aria-hidden="true"><path fill="currentColor" d="M22 12.06C22 6.55 17.52 2.07 12 2.07S2 6.55 2 12.06c0 4.99 3.66 9.13 8.44 9.93v-7.03H7.9V12.06h2.54V9.86c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.9h-2.34v7.03C18.34 21.19 22 17.05 22 12.06z"/></svg>\
                      </a>\
                      <a href="https://youtube.com/@studywithacademia?si=1C-188fjkg5-9x34" target="_blank" title="YouTube" aria-label="YouTube">\
                          <svg viewBox="0 0 24 24" role="img" aria-hidden="true"><path fill="currentColor" d="M23.5 6.2a3.02 3.02 0 0 0-2.13-2.13C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.37.57A3.02 3.02 0 0 0 .5 6.2 31.1 31.1 0 0 0 0 12a31.1 31.1 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.13 2.13C4.5 20.5 12 20.5 12 20.5s7.5 0 9.37-.57a3.02 3.02 0 0 0 2.13-2.13c.37-1.87.5-3.8.5-5.8s-.13-3.93-.5-5.8zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>\
                      </a>\
                      <a href="https://t.me/UPSC_Academia_Pune" target="_blank" title="Telegram" aria-label="Telegram">\
                          <svg viewBox="0 0 24 24" role="img" aria-hidden="true"><path fill="currentColor" d="M9.04 15.59 8.9 19.2c.32 0 .46-.14.63-.3l1.52-1.45 3.15 2.31c.58.32 1 .15 1.16-.54l2.1-9.88c.19-.86-.31-1.2-.88-.99L4.32 11.2c-.84.33-.83.8-.15 1.01l3.62 1.13 8.4-5.3c.4-.26.77-.12.47.14l-7.62 6.41z"/></svg>\
                      </a>\
                      <a href="https://www.whatsapp.com/channel/0029Va68o511noz2AiJ8TV1g" target="_blank" title="WhatsApp" aria-label="WhatsApp">\
                          <svg viewBox="0 0 24 24" role="img" aria-hidden="true"><path fill="currentColor" d="M20.52 3.48A11.94 11.94 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.58 5.98L0 24l6.2-1.62A11.95 11.95 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.21-3.48-8.52zM12 21.6c-1.92 0-3.78-.57-5.36-1.64l-.38-.25-3.68.96.98-3.58-.25-.38A9.57 9.57 0 0 1 2.4 12C2.4 6.93 6.93 2.4 12 2.4S21.6 6.93 21.6 12 17.07 21.6 12 21.6zm5.42-6.27c-.3-.15-1.77-.87-2.05-.96-.28-.1-.48-.15-.68.15-.2.3-.78.96-.96 1.16-.18.2-.35.23-.65.08-.3-.15-1.3-.48-2.48-1.52-.92-.82-1.54-1.83-1.72-2.13-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.68-1.64-.94-2.25-.24-.58-.5-.5-.68-.5l-.58-.01c-.2 0-.53.08-.8.38-.28.3-1.05 1.02-1.05 2.48s1.08 2.88 1.23 3.08c.15.2 2.12 3.24 5.14 4.54.72.31 1.28.49 1.72.63.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.4.25-.68.25-1.27.17-1.4-.08-.13-.28-.21-.58-.36z"/></svg>\
                      </a>\
                  </div>\
              </div>\
              <div class="footer-section links">\
                  <h3>Quick Links</h3>\
                  <ul>\
                      <li><a href="index.html#about">About Us</a></li>\
                      <li><a href="index.html#services">Services</a></li>\
                      <li><a href="index.html#facilities">Facilities</a></li>\
                      <li><a href="index.html#resources">Resources</a></li>\
                      <li><a href="index.html#contact">Contact</a></li>\
                  </ul>\
              </div>\
              <div class="footer-section contact-info">\
                  <h3>Contact Info</h3>\
                  <ul>\
                      <li><i class="fas fa-phone"></i><span><a href="tel:7666818376" style="color:inherit; text-decoration:none;">7666818376 - Rahul Sir (Director)<br></a> \
                              <a href="tel:7719044646" style="color:inherit; text-decoration:none;">7719044646 - Rahul Sir (Director)<br></a> \
                              <a href="tel:9529114803" style="color:inherit; text-decoration:none;">9529114803 - Samad Sir (Office)</a></span></li>\
                      <li><i class="fas fa-envelope"></i><a href="mailto:upscacademia2022@gmail.com">upscacademia2022@gmail.com</a></li>\
                      <li><i class="fas fa-map-marker-alt"></i><a href="https://www.google.com/maps?q=18.517248369962946,73.85547932944749" target="_blank">3rd Floor, Shan Brahma Complex, Behind Shrimant Dagduseth Ganpati, Infront of Farazkhana Police Station, Pune</a></li>\
                  </ul>\
              </div>\
          </div>\
          <div class="footer-bottom">\
              <p>&copy; 2024 UPSC Academia | Website by <a href="https://sahilthakur198.github.io/Portfolio/index.html" target="_blank">Sahil Thakur & Team</a> | All Rights Reserved</p>\
          </div>\
      </div>\
    </footer>'
    )
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

  // ==== Enrollment: Google Apps Script submission ====
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbysyS9VsnjB8BWRAXA_5ViODuFV-oTQ8eU57t3oUtKgrBMRUwynLHBgiBuFHveSSy_5/exec"

  function validatePhoneNumber(phone) {
    const digitsOnly = (phone || "").replace(/\D/g, "")
    return digitsOnly.length >= 10
  }

  function ensurePopupStyles() {
    if (document.getElementById("popupStyles")) return
    const style = document.createElement("style")
    style.id = "popupStyles"
    style.textContent = "\n#popupMessage{position:fixed;top:20px;right:-400px;z-index:9999;transition:all .5s ease-in-out;}\n#popupMessage.show{right:20px;}\n.popup-content{background:#fff;border-radius:12px;padding:16px 20px;box-shadow:0 6px 16px rgba(0,0,0,.15);font-family:'Inter',sans-serif;display:flex;align-items:center;gap:10px;min-width:280px;}\n.popup-content.success{border-left:6px solid #2ecc71;}\n.popup-content.error{border-left:6px solid #e74c3c;}\n.popup-icon{font-size:22px;}\n.popup-content p{margin:0;font-size:15px;}\n"
    document.head.appendChild(style)
  }

  function showPopup(message, type = "success") {
    ensurePopupStyles()
    const existing = document.getElementById("popupMessage")
    if (existing) existing.remove()

    const container = document.createElement("div")
    container.id = "popupMessage"
    container.innerHTML = `\n    <div class="popup-content ${type}">\n      <span class="popup-icon">${type === "success" ? "✅" : "❌"}</span>\n      <p>${message}</p>\n    </div>\n  `
    document.body.appendChild(container)
    setTimeout(() => container.classList.add("show"), 100)
    setTimeout(() => container.classList.remove("show"), 4000)
    setTimeout(() => container.remove(), 4500)
  }

  function initEnrollSubmission() {
    const form = document.getElementById("enrollForm")
    const submitBtn = document.getElementById("submitBtn")
    if (!form || !submitBtn) return

    form.addEventListener("submit", async (e) => {
      e.preventDefault()

      const phone = (document.getElementById("enrollPhone") || {}).value || ""
      if (!validatePhoneNumber(phone.trim())) {
        showPopup("⚠️ Please enter a valid phone number.", "error")
        return
      }

      submitBtn.disabled = true
      const originalText = submitBtn.textContent
      submitBtn.textContent = "Sending..."

      try {
        const formData = new FormData(form)
        const res = await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          body: formData,
        })

        // Attempt to parse JSON; if fails, treat as text and try to infer
        let data
        const text = await res.text()
        try {
          data = JSON.parse(text)
        } catch {
          data = { status: /success/i.test(text) ? "success" : "error", raw: text }
        }

        if (res.ok && data && data.status === "success") {
          showPopup("Enrollment submitted successfully!", "success")
          form.reset()
        } else {
          console.error("[enroll] Response error:", data)
          showPopup("⚠️ Submission failed. Please try again.", "error")
        }
      } catch (err) {
        console.error("[enroll] Network error:", err)
        showPopup("Error, try again after sometime.", "error")
      } finally {
        submitBtn.disabled = false
        submitBtn.textContent = originalText
      }
    })
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
