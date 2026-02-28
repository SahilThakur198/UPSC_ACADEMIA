document.addEventListener("DOMContentLoaded", async () => {
  // Apply mobile optimizations ASAP to stabilize viewport on Android
  optimizeForMobile()

  // Load layout components (non-blocking for other initializations)
  loadLayoutComponents().catch(err => console.error("Layout loading error:", err));

  // --- Shared Logic for All Pages ---

  initParticleAnimation()
  initMobileMenu()
  verifyLayoutLoaded()

  // Initialize enrollment submission handler if present
  initEnrollSubmission()
  initMobileStickyCTA()

  const contactForm = document.getElementById("contactForm")
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault()
      showPopup("Thank you for your message! We will get back to you soon.", "success")
      this.reset()
    })
  }

  // --- Page-Specific Logic ---
  const bodyId = document.body.id
  if (bodyId === "home-page") {
    initHomePage()
  } else if (bodyId === "notes-page") {
    initNotesPage()
  } else if (bodyId === "enroll-page") {
    initEnrollPage()
    // Hide Demo Class button on enroll page
    // Desktop button
    const enrollBtn = document.querySelector(".enroll-btn.desktop-only")
    if (enrollBtn) enrollBtn.style.display = "none"
    // Mobile button
    const enrollMobile = document.querySelector(".enroll-mobile.mobile-only")
    if (enrollMobile) enrollMobile.parentElement.style.display = "none"
  } else if (bodyId === "admitted-reg-page") {
    initAdmittedRegistration()
  }
})

async function loadLayoutComponents() {
  const headerHost = document.getElementById("site-header");
  const footerHost = document.getElementById("site-footer");
  if (!headerHost && !footerHost) return;

  try {
    const [headerRes, footerRes] = await Promise.all([
      fetch("header.html"),
      fetch("footer.html"),
    ]);

    if (headerHost && headerRes.ok) {
      headerHost.outerHTML = await headerRes.text();
    }
    if (footerHost && footerRes.ok) {
      footerHost.outerHTML = await footerRes.text();
    }

    // specialized post-load initialization
    initMobileMenu();
    markActiveNavLink();
    enableInPageSmoothScroll();
  } catch (err) {
    console.error("[Performance] Layout components failed to load:", err);
  }
}

function verifyLayoutLoaded() {
  // Silent verification for production
  const header = document.querySelector(".navbar")
  const footer = document.querySelector(".footer")
  if (!header || !footer) {
    console.warn("[layout] Core components missing from DOM");
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
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const navMenu = document.getElementById("nav-menu");
  const navLinks = document.querySelectorAll(".nav-link");
  if (!mobileMenuBtn || !navMenu) return;
  // Toggle Function
  function toggleMenu() {
    const isActive = mobileMenuBtn.classList.contains("active");
    if (isActive) closeMobileMenu();
    else openMobileMenu();
  }
  function openMobileMenu() {
    mobileMenuBtn.classList.add("active");
    navMenu.classList.add("active");
    navMenu.style.display = "flex"; // Force display flex for animation
    document.body.style.overflow = "hidden"; // Prevent background scrolling
  }
  function closeMobileMenu() {
    mobileMenuBtn.classList.remove("active");
    navMenu.classList.remove("active");
    document.body.style.overflow = ""; // Restore scrolling
    // Use timeout to allow CSS animation to finish before hiding if needed
    setTimeout(() => {
      if (!navMenu.classList.contains("active") && window.innerWidth <= 768) {
        navMenu.style.display = "none";
      }
    }, 300);
  }
  // Event Listeners
  mobileMenuBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMenu();
  });
  // Close when clicking a link
  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 768) closeMobileMenu();
    });
  });
  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!navMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
      closeMobileMenu();
    }
  });
  // Reset on window resize (from mobile to desktop)
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      closeMobileMenu();
      navMenu.style.display = "flex"; // Restore desktop display
      mobileMenuBtn.style.display = "none";
    } else {
      mobileMenuBtn.style.display = "flex";
      if (!navMenu.classList.contains("active")) {
        navMenu.style.display = "none";
      }
    }
  });
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

    window.addEventListener("mousemove", throttle((e) => {
      mouseX = e.clientX / window.innerWidth
      mouseY = e.clientY / window.innerHeight
      bgDecoration.style.background = `
                  linear-gradient(135deg, 
                  rgba(10, 43, 87, ${0.05 + mouseX * 0.05}) 0%, 
                  rgba(216, 27, 33, ${0.05 + mouseY * 0.05}) 100%)
              `
    }, 100))

    window.addEventListener("mousemove", throttle((e) => {
      const particles = particlesContainer.querySelectorAll(".particle")
      particles.forEach((particle, index) => {
        const speed = ((index % 3) + 1) * 0.5
        const x = (e.clientX - window.innerWidth / 2) * speed * 0.01
        const y = (e.clientY - window.innerHeight / 2) * speed * 0.01
        particle.style.transform = `translate(${x}px, ${y}px)`
      })
    }, 50))
  }
}

/**
 * Global Throttle Utility
 */
function throttle(func, limit) {
  let inThrottle
  return function () {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
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
  initScrollEffects()
  initMapLoader()
  initFAQ()
}

function initScrollEffects() {
  const scrollObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible")
        }
      })
    },
    { threshold: 0.1 },
  )
  document.querySelectorAll(".fade-in").forEach((el) => scrollObserver.observe(el))

  const sections = document.querySelectorAll("section[id]")
  const navLinks = document.querySelectorAll(".nav-menu a.nav-link")

  const handleScroll = throttle(() => {
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
      }
    })
  }, 100)

  window.addEventListener("scroll", handleScroll)
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

// Production: Redundant debug functions removed

function optimizeForMobile() {
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
    document.documentElement.style.setProperty("--animation-duration", "0.2s")
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

function initNotesPage() {
  console.log("[v0] Initializing dynamic multi-action notes page")
  const notesList = document.getElementById("notes-list")
  const loader = document.getElementById("notes-loader")
  const noNotes = document.getElementById("no-notes")
  const searchInput = document.querySelector(".search-input")

  // Use the shared Apps Script URL
  const WEB_APP_URL = APPS_SCRIPT_URL

  async function fetchNotes() {
    console.log("[v0] Attempting to fetch notes...")
    try {
      if (!WEB_APP_URL || WEB_APP_URL.includes("replace")) {
        console.warn("[v0] Apps Script URL is placeholder. Using mock data.")
        renderNotes(getMockNotes())
        return
      }

      // Action: getFiles (matches backend)
      const response = await fetch(`${WEB_APP_URL}?action=getFiles`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      console.log("[v0] Fetch successful, data received:", data)

      if (data && (data.error || !data.success)) {
        throw new Error(data.error || data.message || "Failed to fetch files")
      }

      renderNotes(data.files || [])
    } catch (err) {
      console.error("[v0] Failed to fetch notes:", err)
      if (loader)
        loader.innerHTML = `
          <div style="color: var(--accent-red); padding: 2rem; border: 1px dashed var(--accent-red); border-radius: 12px;">
            <p><strong>Fetch Error:</strong> ${err.message}</p>
            <p style="font-size: 0.85rem; margin-top: 0.5rem; color: var(--text-secondary);">Please check your Web App URL and Drive permissions.</p>
          </div>
        `
    }
  }

  function renderNotes(notes) {
    if (loader) loader.style.display = "none"
    if (!notesList) {
      console.error("[v0] notes-list container not found!")
      return
    }

    if (!Array.isArray(notes)) {
      console.error("[v0] Expected an array of notes, but received:", notes)
      notesList.innerHTML = '<p style="color:var(--accent-red);">Unexpected data format received from API.</p>'
      return
    }

    notesList.style.display = "flex"
    console.log("[v0] Rendering", notes.length, "notes")

    notesList.innerHTML = notes
      .map(
        (note) => `
      <div class="note-row fade-in">
        <div class="note-info">
          <div class="note-icon">
            <i class="${getFileIcon(note.mimeType || note.type || '')}"></i>
          </div>
          <div class="note-content">
            <h3>${note.name || 'Untitled Document'}</h3>
            <p>Uploaded Document</p>
          </div>
        </div>
        <div class="note-meta-row">
          <span><i class="fas fa-file-alt"></i> ${note.type || "PDF"}</span>
          <span><i class="fas fa-calendar-alt"></i> ${note.dateCreated || "Recent"}</span>
        </div>
        <div class="note-actions">
           <a href="${note.url || '#'}" target="_blank" class="btn-view" title="View in Drive">
             <i class="fas fa-eye"></i> View
           </a>
           <button class="btn-download" onclick="window.downloadNote('${note.id}', '${note.name}', event)" title="Download PDF">
             <i class="fas fa-download"></i> Download
           </button>
        </div>
      </div>
    `,
      )
      .join("")

    initDynamicAnimations()
  }

  // Global download function for the buttons
  window.downloadNote = async (id, fileName, event) => {
    const btn = event ? event.currentTarget : null
    let originalHtml = '';

    if (btn) {
      btn.classList.add("loading");
      originalHtml = btn.innerHTML;
      // Change to custom CSS spinner
      btn.innerHTML = '<span class="btn-spinner"></span> Downloading...';
    }

    try {
      if (!WEB_APP_URL || WEB_APP_URL.includes("replace")) {
        alert("Please set your final Web App URL to enable downloads.")
        return
      }

      const response = await fetch(`${WEB_APP_URL}?action=download&id=${id}`)
      const result = await response.json()

      if (result.success && result.data) {
        // Trigger browser download
        const link = document.createElement("a")
        // Use the mimeType from the result or default to application/pdf
        const mimeType = result.mimeType || "application/pdf"
        link.href = `data:${mimeType};base64,${result.data}`
        link.download = result.fileName || `${fileName}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        alert("Failed to download file: " + (result.error || "Unknown error"))
      }
    } catch (err) {
      console.error("[v0] Download error:", err)
      alert("Error initiating download. Check your console for details.")
    } finally {
      if (btn) {
        btn.classList.remove("loading");
        // Restore original state (or keep 'Downloaded' state if we wanted, but restore is safer for re-clicks)
        btn.innerHTML = originalHtml;
      }
    }
  }

  function getFileIcon(mimeType) {
    const mime = (mimeType || "").toLowerCase()
    if (mime.includes("pdf")) return "fas fa-file-pdf"
    if (mime.includes("word") || mime.includes("document")) return "fas fa-file-word"
    if (mime.includes("image")) return "fas fa-file-image"
    return "fas fa-file-alt"
  }

  function getMockNotes() {
    return [
      {
        id: "1",
        name: "Modern Indian History - Summary",
        dateCreated: "Jan 15, 2024",
        size: "12.5 MB",
        mimeType: "application/pdf",
        viewUrl: "#",
      },
      {
        id: "2",
        name: "Maharashtra Geography - Physical",
        dateCreated: "Jan 10, 2024",
        size: "8.2 MB",
        mimeType: "application/pdf",
        viewUrl: "#",
      },
      {
        id: "3",
        name: "Indian Polity - Part 1",
        dateCreated: "Jan 05, 2024",
        size: "15.0 MB",
        mimeType: "application/pdf",
        viewUrl: "#",
      },
    ]
  }

  function initDynamicAnimations() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible")
          }
        })
      },
      { threshold: 0.1 },
    )
    document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el))
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase()
      const items = document.querySelectorAll(".note-row")
      let found = 0
      items.forEach((item) => {
        const text = item.innerText.toLowerCase()
        const isMatch = text.includes(term)
        item.style.display = isMatch ? "flex" : "none"
        if (isMatch) found++
      })
      if (noNotes) noNotes.style.display = found === 0 ? "block" : "none"
    })
  }

  fetchNotes()
}

// ==== Enrollment: Google Apps Script submission ====
const APPS_SCRIPT_URL = CONFIG.SCRIPT_URL;

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

  const content = document.createElement("div")
  content.className = `popup-content ${type}`

  const icon = document.createElement("span")
  icon.className = "popup-icon"
  icon.textContent = type === "success" ? "✅" : "❌"

  const text = document.createElement("p")
  text.textContent = message // SECURE: textContent prevents XSS

  content.appendChild(icon)
  content.appendChild(text)
  container.appendChild(content)

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
      const enrollData = Object.fromEntries(formData.entries())

      const params = new URLSearchParams()
      params.append("action", "enroll")
      params.append("data", JSON.stringify(enrollData))

      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      })

      const text = await res.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        data = { success: /success/i.test(text), message: text }
      }

      if (res.ok && (data.success || data.status === "success")) {
        showPopup("Enrollment submitted successfully!", "success")
        form.reset()
      } else {
        console.error("[enroll] Response error:", data)
        showPopup("⚠️ Submission failed: " + (data.message || "Unknown error"), "error")
      }
    } catch (err) {
      console.error("[enroll] Network error:", err)
      showPopup("Network error, please try again later.", "error")
    } finally {
      submitBtn.disabled = false
      submitBtn.textContent = originalText
    }
  })
}

// =============================================
// ADMITTED STUDENT REGISTRATION
// =============================================
function initAdmittedRegistration() {
  const verifySection = document.getElementById("verifySection")
  const registrationSection = document.getElementById("registrationSection")
  const successSection = document.getElementById("successSection")
  const verifyBtn = document.getElementById("verifyBtn")
  const verifyInput = document.getElementById("verifyMahajyotiId")
  const verifyMessage = document.getElementById("verifyMessage")
  const regForm = document.getElementById("admittedRegForm")
  const regSubmitBtn = document.getElementById("regSubmitBtn")
  const regMessage = document.getElementById("regMessage")
  const stepDot1 = document.getElementById("stepDot1")
  const stepDot2 = document.getElementById("stepDot2")
  const stepConnector = document.getElementById("stepConnector")

  if (!verifyBtn || !verifyInput) return

  // Helper: show inline message
  function showMessage(el, text, type) {
    if (!el) return
    el.className = "admitted-inline-message show " + type
    el.innerHTML = `<i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i><span>${text}</span>`
  }

  function hideMessage(el) {
    if (!el) return
    el.className = "admitted-inline-message"
    el.innerHTML = ""
  }

  // Helper: set button loading state
  function setLoading(btn, isLoading, originalHtml) {
    if (!btn) return
    if (isLoading) {
      btn._originalHtml = btn.innerHTML
      btn.innerHTML = '<span class="btn-spinner"></span> Processing...'
      btn.classList.add("loading")
      btn.disabled = true
    } else {
      btn.innerHTML = originalHtml || btn._originalHtml || "Submit"
      btn.classList.remove("loading")
      btn.disabled = false
    }
  }

  // Helper: advance step indicator
  function goToStep2() {
    stepDot1.classList.remove("active")
    stepDot1.classList.add("completed")
    stepDot1.querySelector(".step-number").innerHTML = '<i class="fas fa-check" style="font-size:0.8rem"></i>'
    stepConnector.classList.add("active")
    stepDot2.classList.add("active")
  }

  // VERIFY BUTTON CLICK
  verifyBtn.addEventListener("click", async () => {
    const mid = verifyInput.value.trim()
    if (!mid) {
      showMessage(verifyMessage, "Please enter your Mahajyoti ID.", "error")
      verifyInput.focus()
      return
    }

    hideMessage(verifyMessage)
    setLoading(verifyBtn, true)

    try {
      const params = new URLSearchParams()
      params.append("action", "verifyMahajyoti")
      params.append("data", JSON.stringify({ mid: mid }))

      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
      })

      const text = await res.text()
      let data
      try { data = JSON.parse(text) } catch { data = { success: false, message: text } }

      if (data.exists) {
        // SUCCESS: Prefill form and show step 2
        const studentData = data.data || {}

        document.getElementById("regMahajyotiId").value = mid
        document.getElementById("regName").value = studentData.name || studentData.student_name || ""
        document.getElementById("regCourse").value = studentData.course || studentData.batch || ""
        document.getElementById("regAdmissionDate").value = studentData.admission_date || studentData.date || ""
        document.getElementById("regPhone").value = studentData.phone || studentData.mobile || ""
        document.getElementById("regEmail").value = studentData.email || ""
        document.getElementById("regGuardian").value = studentData.father_name || studentData.guardian || studentData["father name"] || ""
        document.getElementById("regAddress").value = studentData.address || ""

        // Transition UI
        goToStep2()
        verifySection.style.display = "none"
        registrationSection.style.display = "block"
        registrationSection.scrollIntoView({ behavior: "smooth", block: "start" })

        showPopup("✅ Mahajyoti ID verified! Please complete the form below.", "success")
      } else {
        showMessage(verifyMessage, data.message || "Mahajyoti ID not found. Please contact the office.", "error")
      }
    } catch (err) {
      console.error("[admitted-reg] Verify error:", err)
      showMessage(verifyMessage, "Network error. Please check your connection and try again.", "error")
    } finally {
      setLoading(verifyBtn, false, '<i class="fas fa-search"></i> Verify My ID')
    }
  })

  // Allow pressing Enter in verify input
  verifyInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      verifyBtn.click()
    }
  })

  // REGISTRATION FORM SUBMIT
  if (regForm) {
    regForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      // Honeypot check
      const honeypot = regForm.querySelector('input[name="website"]')
      if (honeypot && honeypot.value.trim() !== "") return

      // Client-side validation
      const phone = document.getElementById("regPhone").value.trim()
      const email = document.getElementById("regEmail").value.trim()

      if (!validatePhoneNumber(phone)) {
        showMessage(regMessage, "Please enter a valid phone number (at least 10 digits).", "error")
        return
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showMessage(regMessage, "Please enter a valid email address.", "error")
        return
      }

      hideMessage(regMessage)
      setLoading(regSubmitBtn, true)

      try {
        const formData = new FormData(regForm)
        const regData = Object.fromEntries(formData.entries())
        regData.mid = document.getElementById("regMahajyotiId").value

        const params = new URLSearchParams()
        params.append("action", "registerAdmitted")
        params.append("data", JSON.stringify(regData))

        const res = await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params
        })

        const text = await res.text()
        let data
        try { data = JSON.parse(text) } catch { data = { success: false, message: text } }

        if (data.success) {
          // Show success state
          registrationSection.style.display = "none"
          successSection.style.display = "block"
          stepDot2.classList.remove("active")
          stepDot2.classList.add("completed")
          stepDot2.querySelector(".step-number").innerHTML = '<i class="fas fa-check" style="font-size:0.8rem"></i>'
          successSection.scrollIntoView({ behavior: "smooth", block: "start" })
          showPopup("🎉 Registration completed successfully!", "success")
        } else {
          showMessage(regMessage, data.message || "Registration failed. Please try again.", "error")
        }
      } catch (err) {
        console.error("[admitted-reg] Submit error:", err)
        showMessage(regMessage, "Network error. Please check your connection and try again.", "error")
      } finally {
        setLoading(regSubmitBtn, false, '<i class="fas fa-paper-plane"></i> Complete Registration')
      }
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
  document.addEventListener("touchstart", () => { }, { passive: true })
  document.addEventListener("touchmove", () => { }, { passive: true })
}

function initFAQ() {
  const faqItems = document.querySelectorAll(".faq-item")
  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question")
    question.addEventListener("click", () => {
      const isActive = item.classList.contains("active")

      // Close all other items
      faqItems.forEach((otherItem) => {
        otherItem.classList.remove("active")
      })

      if (!isActive) {
        item.classList.add("active")
      }
      console.log("[v0] FAQ item toggled")
    })
  })
}

function initMobileStickyCTA() {
  const mobileCta = document.getElementById("mobile-cta")
  if (!mobileCta) return

  window.addEventListener("scroll", () => {
    if (window.innerWidth <= 768) {
      // Show after scrolling 300px, but hide if at bottom or near top
      const shouldShow = window.pageYOffset > 300 && window.innerHeight + window.pageYOffset < document.body.offsetHeight - 100

      if (shouldShow) {
        mobileCta.classList.add("show")
      } else {
        mobileCta.classList.remove("show")
      }
    }
  })
}



