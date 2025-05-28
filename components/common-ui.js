// components/common-ui.js

/**
 * Clears the content of a given HTML element.
 * @param {HTMLElement} element
 */
function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * Creates a basic button element.
 * @param {string} text - Button text.
 * @param {string} className - CSS class name.
 * @param {Function} onClick - Click event handler.
 * @returns {HTMLButtonElement}
 */
function createButton(text, className, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = className;
    button.onclick = onClick;
    return button;
}

/**
 * Creates a basic input element.
 * @param {string} type - Input type (text, email, password, etc.).
 * @param {string} placeholder - Placeholder text.
 * @param {string} className - CSS class name.
 * @returns {HTMLInputElement}
 */
function createInput(type, placeholder, className) {
    const input = document.createElement('input');
    input.type = type;
    input.placeholder = placeholder;
    input.className = className;
    return input;
}

export { clearElement, createButton, createInput };
