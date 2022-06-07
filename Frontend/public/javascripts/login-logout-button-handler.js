document.addEventListener('DOMContentLoaded', async () => { 
    const isLoggedInResponse = await fetch("/api/loggedIn");
    const isLoggedIn = await isLoggedInResponse.json();

    if (isLoggedIn.loggedIn) {
        const link = document.getElementById("login-logout-button");
        link.setAttribute("href", "/logout");
        link.innerText = "Logout";
    } else {
        const link = document.getElementById("login-logout-button");
        link.setAttribute("href", "/login");
        link.innerText = "Login";
    }
});