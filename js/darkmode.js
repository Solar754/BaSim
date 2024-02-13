function darklightMode() {
   var element = document.body;
   var button = document.getElementById("darklightBtn");
   element.classList.toggle("dark-mode");
   if (button.textContent === "Dark mode") {
    button.textContent = "Light mode";
  } else {
    button.textContent = "Dark mode";
  }
}