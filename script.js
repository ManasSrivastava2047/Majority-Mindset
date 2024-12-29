function showLoginForm() {
    const role = document.getElementById('role').value;
    const loginForm = document.getElementById('login-form');
    loginForm.style.display = 'block';
}

function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const role = document.getElementById('role').value;
    const errorMessage = document.getElementById('error-message');

    if (!username || !password) {
        errorMessage.textContent = "Please enter both username and password.";
        return;
    }

    const apiUrl = `http://localhost:5500/api/${role}-login`;

    // Make the API call to backend to authenticate the user
    fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Redirect to dashboard with username
            window.location.href = `dashboard.html?username=${encodeURIComponent(username)}`;
        } else {
            errorMessage.textContent = data.message; // Show error message
        }
    })
    .catch(err => {
        console.error(err);
        errorMessage.textContent = "Error logging in. Please try again later.";
    });
}