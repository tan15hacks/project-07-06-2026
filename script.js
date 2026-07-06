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

year.textContent = new Date().getFullYear();

window.addEventListener("scroll", () => {
  header.classList.toggle("is-scrolled", window.scrollY > 12);
});

toggle?.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("is-open");
    toggle?.setAttribute("aria-expanded", "false");
  });
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((btn) => {
      btn.classList.toggle("is-active", btn === button);
      btn.setAttribute("aria-selected", String(btn === button));
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

  try {
    await navigator.clipboard.writeText(message);
    formStatus.textContent = "Order message copied. Paste it into Messenger to send your order.";

    if (MESSENGER_LINK) {
      const url = new URL(MESSENGER_LINK);
      url.searchParams.set("text", message);
      window.open(url.toString(), "_blank", "noopener");
    }
  } catch (error) {
    formStatus.textContent = "Order message ready. Please copy your details manually and send them through Messenger.";
  }
});
