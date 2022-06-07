function selectionMode() {
  var check = document.getElementById('darkModeBtn').checked;

  if (check) {
    darkMode();
  } else {
    lightMode();
  }
}


function darkMode() {
  var label = document.getElementById('darkModeLabel');
  label.innerHTML = '🌙';


  document.querySelectorAll(".bg-light").forEach((element) => {
    element.className = element.className.replace(/-light/g, "-dark");
  });

  document.body.classList.add("bg-dark");

  if (document.body.classList.contains("text-dark")) {
    document.body.classList.replace("text-dark", "text-light");
  } else {
    document.body.classList.add("text-light");
  }

  var btnMode = document.getElementById('divSwitchDarkMode');
  btnMode.classList.replace("bg-light", "bg-dark");
  btnMode.classList.replace("text-dark", "text-light");


  const objMode = {
    darkMode: true,
    date: new Date().getTime()
  }

  localStorage.setItem("DarkMode", JSON.stringify(objMode));
}

function lightMode() {

  var label = document.getElementById('darkModeLabel');
  label.innerHTML = '☀️';

  document.querySelectorAll(".bg-dark").forEach((element) => {
    element.className = element.className.replace(/-dark/g, "-light");
  });

  document.body.classList.add("bg-light");

  if (document.body.classList.contains("text-light")) {
    document.body.classList.replace("text-light", "text-dark");
  } else {
    document.body.classList.add("text-dark");
  }

  var btnMode = document.getElementById('divSwitchDarkMode');
  btnMode.classList.replace("bg-dark", "bg-light");
  btnMode.classList.replace("text-light", "text-dark");

  const objMode = {
    darkMode: false,
    date: new Date().getTime()
  }

  localStorage.setItem("DarkMode", JSON.stringify(objMode));
}

function init() {
  var objMode = localStorage.getItem("DarkMode");

  if (objMode != null) {
    objMode = JSON.parse(objMode);
    var date = objMode.date;
    var today = new Date().getTime();

    if (today - date < (1000 * 86400)) {
      if (objMode.darkMode) {
        darkMode();
        document.getElementById('darkModeBtn').checked = true;
      } else {
        lightMode();
        document.getElementById('darkModeBtn').checked = false;
      }
    } else {
      localStorage.clear();
    }
  } else {
    lightMode();
  }
}

document.addEventListener('DOMContentLoaded', init()); // fa chiamare al caricamento della pagina