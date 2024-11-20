const apiKey = 'c8498fbf-ead5-4663-875d-365f12f29b03'; // Your Merriam-Webster API key
const apiUrl = 'https://dictionaryapi.com/api/v3/references/learners/json/';

function sendMessage() {
    const userInput = document.getElementById('user-input').value.trim();
    if (userInput === "") return;

    // Display the user message with a smooth transition
    displayMessage(userInput, 'user-msg');

    // Clear input field
    document.getElementById('user-input').value = '';

    // Check if the input is a sentence or a single word
    if (userInput.includes(' ')) {
        handleSentence(userInput);  // Handle sentence input
    } else {
        fetchDefinition(userInput); // Handle word input
    }
}

// Fetch definition of a word
function fetchDefinition(word) {
    fetch(`${apiUrl}${word}?key=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const definition = data[0].shortdef ? data[0].shortdef[0] : 'No definition found.';
                displayMessage(`Definition: ${definition}`, 'bot-msg');
            } else {
                displayMessage('Sorry, no results found for that word.', 'bot-msg');
            }
        })
        .catch(() => {
            displayMessage('Oops! Something went wrong. Please try again later.', 'bot-msg');
        });
}

// Handle sentence input
function handleSentence(sentence) {
    const words = sentence.split(' '); // Split sentence into words
    let response = '';

    words.forEach((word, index) => {
        fetchDefinitionForSentenceWord(word, index, words.length);
    });
}

// Fetch definition for each word in the sentence
function fetchDefinitionForSentenceWord(word, index, totalWords) {
    fetch(`${apiUrl}${word}?key=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const definition = data[0].shortdef ? data[0].shortdef[0] : 'No definition found.';
                displayMessage(`Word: ${word}\nDefinition: ${definition}`, 'bot-msg');
            } else {
                displayMessage(`Word: ${word}\nSorry, no definition found.`, 'bot-msg');
            }

            // Notify user when all words have been processed
            if (index === totalWords - 1) {
                displayMessage('I have finished explaining your sentence!', 'bot-msg');
            }
        })
        .catch(() => {
            displayMessage('Oops! Something went wrong while fetching definitions. Please try again later.', 'bot-msg');
        });
}

// Display a message in the chat history
function displayMessage(message, type) {
    const chatHistory = document.getElementById('chat-history');
    const messageElement = document.createElement('div');
    messageElement.classList.add(type);
    messageElement.textContent = message;
    chatHistory.appendChild(messageElement);

    // Scroll to the bottom after the new message is added
    chatHistory.scrollTop = chatHistory.scrollHeight;

}

// Trigger sending message on Enter key press
document.getElementById('user-input').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
        
    }
});
