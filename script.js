const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const canvas = document.querySelector("#neural-field");
const contactForm = document.querySelector(".contact-form");
const formStatus = document.querySelector(".form-status");
const ctx = canvas.getContext("2d");

let width = 0;
let height = 0;
let nodes = [];

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const count = Math.min(78, Math.max(30, Math.floor(width / 22)));
  nodes = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.24,
    vy: (Math.random() - 0.5) * 0.24,
    r: Math.random() * 1.5 + 0.7,
  }));
}

function drawField() {
  ctx.clearRect(0, 0, width, height);

  for (const node of nodes) {
    if (!prefersReducedMotion.matches) {
      node.x += node.vx;
      node.y += node.vy;

      if (node.x < 0 || node.x > width) node.vx *= -1;
      if (node.y < 0 || node.y > height) node.vy *= -1;
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(107, 216, 255, 0.38)";
    ctx.fill();
  }

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);

      if (distance < 132) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(121, 242, 190, ${0.1 * (1 - distance / 132)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(drawField);
}

function updateHeaderState() {
  header.dataset.elevated = window.scrollY > 20 ? "true" : "false";
}

menuToggle.addEventListener("click", () => {
  const isOpen = header.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
});

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    header.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open menu");
  });
});

contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  formStatus.textContent = "Sending...";

  try {
    const response = await fetch(contactForm.action, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(contactForm).entries()))
    });

    if (!response.ok) throw new Error("Could not submit the brief.");

    contactForm.reset();
    formStatus.textContent = "Received. Novex will follow up shortly.";
  } catch {
    formStatus.textContent = "Something went wrong. Please email info@novexdigital.co.za.";
  }
});

window.addEventListener("scroll", updateHeaderState, { passive: true });
window.addEventListener("resize", resizeCanvas);

resizeCanvas();
updateHeaderState();
drawField();
