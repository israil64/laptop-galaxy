// --- AUTH LOGIC ---
let currentUser = JSON.parse(localStorage.getItem('laptopUser')) || null;

// Check login status on load
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
});

function updateAuthUI() {
    if (currentUser) {
        document.getElementById('auth-buttons').classList.add('hidden');
        document.getElementById('user-info').classList.remove('hidden');
        document.getElementById('user-name').textContent = currentUser.username;
    } else {
        document.getElementById('auth-buttons').classList.remove('hidden');
        document.getElementById('user-info').classList.add('hidden');
    }
}

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const res = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (res.ok) {
        currentUser = data.user;
        localStorage.setItem('laptopUser', JSON.stringify(currentUser));
        updateAuthUI();
        closeAuthModal();
        alert("Logged in!");
    } else {
        alert(data.message);
    }
});

// Signup
document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    const res = await fetch('http://localhost:3000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();
    alert(data.message);
    if (res.ok) switchAuth('login');
});

function logout() {
    currentUser = null;
    localStorage.removeItem('laptopUser');
    updateAuthUI();
}

// Modal Helpers
function openAuthModal(type) {
    document.getElementById('auth-modal').classList.remove('hidden');
    switchAuth(type);
}
function closeAuthModal() {
    document.getElementById('auth-modal').classList.add('hidden');
}
function switchAuth(type) {
    if(type === 'login') {
        document.getElementById('login-box').classList.remove('hidden');
        document.getElementById('signup-box').classList.add('hidden');
    } else {
        document.getElementById('login-box').classList.add('hidden');
        document.getElementById('signup-box').classList.remove('hidden');
    }
}