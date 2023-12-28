const item = document.querySelector(".hidden");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("slide-show");
      }
    });
  },
  {
    threshold: 0.2,
  }
);

observer.observe(item);
