function main() {
  const btn = document.querySelector("button.theme");
  const root = document.documentElement;

  // initial theme'ing
  if (localStorage.getItem("theme") === "dark") {
    root.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    localStorage.setItem("theme", "light");
  }

  // enable the 'Change theme' button
  btn.textContent = "Change theme";
  btn.addEventListener("click", () => {
    if (root.classList.toggle("dark")) {
      localStorage.setItem("theme", "dark");
    } else {
      localStorage.setItem("theme", "light");
    }
  });
}

addEventListener("DOMContentLoaded", main);
