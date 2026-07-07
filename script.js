// BLK.8 CAFÉ website interactions.
// Replace this with the official Messenger link before launch.
// Example format: https://m.me/yourPageUsername
const MESSENGER_LINK = "";

const header = document.querySelector("[data-header]");
const toggle = document.querySelector("[data-nav-toggle]");
const navLinks = document.querySelector("[data-nav-links]");
const year = document.querySelector("[data-year]");
const filterButtons = document.querySelectorAll("[data-filter]");
const menuCards = document.querySelectorAll(".menu-card");
const orderForm = document.querySelector("[data-order-form]");
const formStatus = document.querySelector("[data-form-status]");

year && (year.textContent = new Date().getFullYear());

const syncHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
};

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

const closeMenu = () => {
  navLinks?.classList.remove("is-open");
  toggle?.setAttribute("aria-expanded", "false");
};

toggle?.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((btn) => {
      const active = btn === button;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
    });

    menuCards.forEach((card) => {
      const shouldShow = filter === "all" || card.dataset.category === filter;
      card.hidden = !shouldShow;
    });
  });
});

orderForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(orderForm);

  const message = [
    "Hello BLK.8 CAFÉ! I would like to order:",
    "",
    `Name: ${data.get("name")}`,
    `Contact: ${data.get("contact")}`,
    `Order: ${data.get("items")}`,
    `Type: ${data.get("type")}`,
    `Preferred time: ${data.get("time") || "Not specified"}`,
    `Notes: ${data.get("notes") || "None"}`,
  ].join("\n");

  const successMessage = MESSENGER_LINK
    ? "Order message copied. Messenger is opening now."
    : "Order message copied. Paste it into Messenger to send your order.";

  try {
    await navigator.clipboard.writeText(message);
    formStatus.textContent = successMessage;

    if (MESSENGER_LINK) {
      const url = new URL(MESSENGER_LINK);
      url.searchParams.set("text", message);
      window.open(url.toString(), "_blank", "noopener");
    }
  } catch (error) {
    formStatus.textContent = "Order message ready. Please copy your details manually and send them through Messenger.";
  }
});
