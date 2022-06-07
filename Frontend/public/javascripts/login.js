
async function login(event) {
    event.preventDefault();
    const nickname = document.getElementById("nickname-input").value;
    const password = document.getElementById("password-input").value;

    const response = await fetch("/login", {
        method: "POST",
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            nickname: nickname,
            password: password
        })
    });

    const message = await response.json();

    if ('error' in message && message['error'])
        document.getElementById("error").innerText = message.message;

    if ('success' in message && message['success']) {
        window.location.href = "/";
    } else {
        document.getElementById("error").innerText = message.message;
    }
}