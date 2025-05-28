// components/login.js
import { loginUser } from '../utils/auth.js';
import { clearElement, createButton, createInput } from './common-ui.js';

function renderLogin(appContainer, onLoginSuccess) {
    clearElement(appContainer); // Clear previous content

    const loginContainer = document.createElement('div');
    loginContainer.className = 'login-container';

    const title = document.createElement('h2');
    title.textContent = 'Login';
    loginContainer.appendChild(title);

    const emailInput = createInput('email', 'Email', 'login-input');
    loginContainer.appendChild(emailInput);

    const passwordInput = createInput('password', 'Password', 'login-input');
    loginContainer.appendChild(passwordInput);

    const errorMessage = document.createElement('p');
    errorMessage.className = 'error-message';
    loginContainer.appendChild(errorMessage);

    const loginButton = createButton('Login', 'login-button', async () => {
        errorMessage.textContent = ''; // Clear previous errors
        try {
            const user = await loginUser(emailInput.value, passwordInput.value);
            onLoginSuccess(user);
        } catch (error) {
            errorMessage.textContent = 'Login failed: ' + error.message;
        }
    });
    loginContainer.appendChild(loginButton);

    appContainer.appendChild(loginContainer);
}

export { renderLogin };
