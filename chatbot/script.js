
const apiKey = 'c8498fbf-ead5-4663-875d-365f12f29b03'; // Your Merriam-Webster API key
const dictionaryApiUrl = 'https://dictionaryapi.com/api/v3/references/learners/json/';
const voiceRSSAPIKey = '4c3b4d4b34804e11b8f6e4b8d74f594f'; // VoiceRSS API key
const ttsApiUrl = 'https://voicerss-text-to-speech.p.rapidapi.com/';

function sendMessage() {
    const userInput = document.getElementById('user-input').value.trim();
    if (userInput === "") return;

    // Display the user message
    displayMessage(userInput, 'user-msg');

    // Clear input field
    document.getElementById('user-input').value = '';

    // Check if input is a sentence or a single word
    if (userInput.includes(' ')) {
        handleSentence(userInput); // Handle sentence input
    } else {
        fetchDefinition(userInput); // Handle word input
    }
}

// Fetch definition and examples for a word
function fetchDefinition(word) {
    fetch(`${dictionaryApiUrl}${word}?key=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0 && data[0].shortdef) {
                const definition = data[0].shortdef[0];
                const examples = extractExamples(data);

                // Create styled output
                const container = createDefinitionContainer(word, definition, examples);
                displayElement(container);
            } else {
                displayMessage(`Sorry, no results found for the word "${word}".`, 'bot-msg');
            }
        })
        .catch(() => {
            displayMessage('Oops! Something went wrong. Please try again later.', 'bot-msg');
        });
}

// Handle sentence input
function handleSentence(sentence) {
    const words = sentence.split(' '); // Split sentence into words
    words.forEach((word) => {
        fetchDefinition(word);
    });
}

// Extract up to 5 examples from API response
function extractExamples(data) {
    const examples = [];
    if (data[0].def && data[0].def[0] && data[0].def[0].sseq) {
        const senses = data[0].def[0].sseq;
        senses.forEach(senseGroup => {
            senseGroup.forEach(sense => {
                if (sense[1] && sense[1].dt) {
                    sense[1].dt.forEach(item => {
                        if (item[0] === 'vis') {
                            // Extract examples (vis contains example sentences)
                            item[1].forEach(usage => {
                                if (usage.t && examples.length < 5) {
                                    examples.push(usage.t.replace(/{[^}]+}/g, '')); // Clean up formatting
                                }
                            });
                        }
                    });
                }
            });
        });
    }
    return examples.length > 0 ? examples : ["No examples available."];
}

// Create a styled definition container
function createDefinitionContainer(word, definition, examples) {
    const container = document.createElement('div');
    container.classList.add('definition-container');

    // Word and definition
    const wordElement = document.createElement('h2');
    wordElement.textContent = word;
    container.appendChild(wordElement);

    const definitionElement = document.createElement('p');
    definitionElement.textContent = `Definition: ${definition}`;
    container.appendChild(definitionElement);

    // Examples
    const examplesTitle = document.createElement('h3');
    examplesTitle.textContent = 'Examples:';
    container.appendChild(examplesTitle);

    examples.forEach((example) => {
        const exampleElement = document.createElement('div');
        exampleElement.classList.add('example-item');

        const textElement = document.createElement('p');
        textElement.textContent = example;
        exampleElement.appendChild(textElement);

        // "Hear Example" button (initially hidden)
        const hearButton = document.createElement('button');
        hearButton.textContent = 'Hear Example';
        hearButton.classList.add('hear-btn');
        hearButton.style.display = 'none'; // Hide initially

        // Show the button when the task is clicked
        exampleElement.addEventListener('click', () => {
            hearButton.style.display = 'inline-block'; // Show button on task click
        });

        hearButton.addEventListener('click', () => playAudio(example));
        exampleElement.appendChild(hearButton);

        container.appendChild(exampleElement);
    });

    return container;
}


// Play audio using VoiceRSS API
async function playAudio(text) {
    const encodedText = encodeURIComponent(text);
    const url = `https://api.voicerss.org/?key=${voiceRSSAPIKey}&hl=en-us&src=${encodedText}`;
  
    try {
        // Test the response before using it as a media resource
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch audio. Status: ${response.status}`);
        }
  
        // Ensure the response is playable audio
        const contentType = response.headers.get("Content-Type");
        if (!contentType || !contentType.startsWith("audio/")) {
            throw new Error("Invalid audio content type received");
        }
  
        // Play the audio
        const audio = new Audio(url);
        audio.play();
    } catch (error) {
        alert("Failed to fetch or play audio. Please check your input or API.");
        console.error(error);
    }
  }


// Display an HTML element in the chat
function displayElement(element) {
    const chatHistory = document.getElementById('chat-history');
    chatHistory.appendChild(element);

    // Scroll to the bottom after the new message is added
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Display a plain text message in the chat
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
