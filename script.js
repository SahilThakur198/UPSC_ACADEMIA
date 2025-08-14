document.addEventListener('DOMContentLoaded', () => {
    // --- Shared Logic for All Pages ---

    // Mobile Menu Toggle
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Form Submission Alerts
    const enrollForm = document.getElementById('enrollForm');
    if (enrollForm) {
        enrollForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Thank you for your enrollment request! Our team will contact you shortly with further details.');
            this.reset();
        });
    }

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Thank you for your message! We will get back to you soon.');
            this.reset();
        });
    }

    // --- Page-Specific Logic ---
    const bodyId = document.body.id;

    if (bodyId === 'home-page') {
        initHomePage();
    } else if (bodyId === 'enroll-page') {
        initEnrollPage();
    }
});

// --- Homepage Initializer ---
function initHomePage() {
    // Shared functionality for homepage (scrolling, etc.)
    setupHomepageScrolling();
}

// --- HOMEPAGE: Scrolling and Active Nav Link Logic ---
function setupHomepageScrolling() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            // Close mobile menu on click
            document.getElementById('nav-menu')?.classList.remove('active');
        });
    });

    // Back-to-top button visibility
    const backToTop = document.getElementById('backToTop');
    if(backToTop) {
        window.addEventListener('scroll', () => {
            backToTop.classList.toggle('visible', window.pageYOffset > 300);
        });
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Intersection observer for fade-in animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    
    // Active nav link highlighting on scroll
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-menu a.nav-link');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (window.pageYOffset >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

    // Animate background decoration
    const bgDecoration = document.querySelector('.bg-decoration');
    if (bgDecoration) {
        window.addEventListener('mousemove', (e) => {
            const mouseX = e.clientX / window.innerWidth;
            const mouseY = e.clientY / window.innerHeight;
            
            bgDecoration.style.background = `
                radial-gradient(circle at ${mouseX * 100}% ${mouseY * 100}%, 
                rgba(10, 43, 87, 0.1) 0%, 
                rgba(216, 27, 33, 0.1) 50%, 
                rgba(10, 43, 87, 0.05) 100%)
            `;
        });
    }
}


// --- HOMEPAGE: 3D Animation (Interactive Books & Particles) ---
// Enroll Page Initializer
function initEnrollPage() {
    // Add any enroll page specific functionality here
}