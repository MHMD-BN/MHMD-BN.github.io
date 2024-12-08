document.addEventListener('DOMContentLoaded', () => {
    // Password toggle functionality
    const passwordToggles = document.querySelectorAll('.password-toggle');
    
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            // Toggle password visibility
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
            
            // Add animation class
            icon.classList.add('toggle-animation');
            // Remove animation class after animation ends
            setTimeout(() => {
                icon.classList.remove('toggle-animation');
            }, 300);
        });
    });

    // Handle signup form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    // Handle login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

async function handleSignup(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    removeErrorMessage();

    if (password !== confirmPassword) {
        showErrorMessage('Passwords do not match');
        return;
    }

    if (password.length < 6) {
        showErrorMessage('Password must be at least 6 characters long');
        return;
    }

    try {
        const auth = getAuth();
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update user profile with username
        await updateProfile(user, {
            displayName: username
        });

        showSuccessMessage('Account created successfully! Redirecting...');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    } catch (error) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                showErrorMessage('Email already exists');
                break;
            case 'auth/invalid-email':
                showErrorMessage('Invalid email address');
                break;
            default:
                showErrorMessage('An error occurred. Please try again.');
                console.error(error);
        }
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    removeErrorMessage();

    try {
        const auth = getAuth();
        await signInWithEmailAndPassword(auth, email, password);
        
        showSuccessMessage('Login successful! Redirecting...');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    } catch (error) {
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                showErrorMessage('Invalid email or password');
                break;
            case 'auth/invalid-email':
                showErrorMessage('Invalid email address');
                break;
            default:
                showErrorMessage('An error occurred. Please try again.');
                console.error(error);
        }
    }
}

function showErrorMessage(message) {
    removeErrorMessage();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    
    const form = document.querySelector('form');
    form.insertBefore(errorDiv, form.firstChild);
}

function showSuccessMessage(message) {
    removeErrorMessage();
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    const form = document.querySelector('form');
    form.insertBefore(successDiv, form.firstChild);
}

function removeErrorMessage() {
    const errorMessage = document.querySelector('.error-message');
    const successMessage = document.querySelector('.success-message');
    if (errorMessage) errorMessage.remove();
    if (successMessage) successMessage.remove();
} 
