
async function register(event) {
    event.preventDefault();
    const nickname = document.getElementById("nickname-input").value;
    const password = document.getElementById("password-input").value;
    const passwordConfirm = document.getElementById("confirm-password-input").value;

    const response = await fetch("/register", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(
            {
                nickname: nickname, 
                password: password, 
                confirmPassword: passwordConfirm
            }
        )
    });

    const message = await response.json();

    if ('error' in message && message['error'])
        document.getElementById("error").innerText = message.message;

    if ('success' in message && message['success']) {
        window.location.href = "/login";
    } else {
        document.getElementById("error").innerText = message.message;
    }
}