const apiKey = 'c8498fbf-ead5-4663-875d-365f12f29b03'; // Merriam-Webster API key
const dictionaryApiUrl = 'https://dictionaryapi.com/api/v3/references/learners/json/';
const fallbackApiUrl = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
const voiceRSSAPIKey = '4c3b4d4b34804e11b8f6e4b8d74f594f'; // VoiceRSS API key

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

function fetchDefinition(word) {
    fetch(`${dictionaryApiUrl}${word}?key=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0 && data[0].shortdef) {
                const definitions = data[0].shortdef; // Array of definitions
                const examples = extractExamples(data);

                // Pass the definitions array
                const container = createDefinitionContainer(word, definitions, examples);
                displayElement(container);
            } else {
                fetchFallbackDefinition(word);
            }
        })
        .catch(() => {
            fetchFallbackDefinition(word);
        });
}


function fetchFallbackDefinition(word) {
    fetch(`${fallbackApiUrl}${word}`)
        .then(response => response.json())
        .then(data => {
            if (Array.isArray(data) && data.length > 0 && data[0].meanings) {
                const definition =
                    data[0].meanings[0].definitions[0].definition || "Definition not available.";
                const examples = data[0].meanings[0].definitions[0].example
                    ? [data[0].meanings[0].definitions[0].example]
                    : ["No examples available."];

                // Create styled output
                const container = createDefinitionContainer(word, definition, examples);
                displayElement(container);
            } else {
                // No results in fallback API
                displayMessage(`Sorry, no results found for the word "${word}".`, 'bot-msg');
            }
        })
        .catch(() => {
            displayMessage('Oops! Something went wrong while using the fallback API. Please try again later.', 'bot-msg');
        });
}


// Handle sentence input
function handleSentence(sentence) {
    const words = sentence.split(' '); // Split sentence into words
    words.forEach((word) => {
        fetchDefinition(word);
    });
}

// Extract up to 5 examples from Merriam-Webster API response
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
    // Return examples or a fallback message
    return examples.length > 0 ? examples : ["No examples available."];
}
function createDefinitionContainer(word, definitions, examples, loadMore = false) {
    const container = document.createElement('div');
    container.classList.add('definition-container');

    // Word and primary definition
    const wordElement = document.createElement('h2');
    wordElement.textContent = word;
    container.appendChild(wordElement);

    // Definition and "Next Definition" icon
    let currentDefinitionIndex = 0;
    const definitionElement = document.createElement('p');
    definitionElement.textContent = `Definition: ${definitions[currentDefinitionIndex] || "Definition not available."}`;
    container.appendChild(definitionElement);

    // Next definition icon
    const nextDefinitionIcon = document.createElement('span');
    nextDefinitionIcon.innerHTML = '&#x21bb;'; // Unicode for circular arrow
    nextDefinitionIcon.title = "Show Next Definition";
    nextDefinitionIcon.classList.add('next-def-icon');
    nextDefinitionIcon.style.cursor = 'pointer';
    nextDefinitionIcon.style.marginLeft = '10px';
    container.appendChild(nextDefinitionIcon);

    nextDefinitionIcon.addEventListener('click', () => {
        currentDefinitionIndex = (currentDefinitionIndex + 1) % definitions.length;
        definitionElement.textContent = `Definition: ${definitions[currentDefinitionIndex] || "Definition not available."}`;
    });

    // Translate definition icon
    const translateIcon = document.createElement('span');
    translateIcon.innerHTML = '&#x1F30E;'; // Unicode for globe icon
    translateIcon.title = "Translate Definition";
    translateIcon.classList.add('translate-icon');
    translateIcon.style.cursor = 'pointer';
    translateIcon.style.marginLeft = '10px';
    container.appendChild(translateIcon);

    // Translated text container
    const translationElement = document.createElement('p');
    translationElement.classList.add('translation-text');
    container.appendChild(translationElement);

    translateIcon.addEventListener('click', () => {
        translateDefinition(definitions[currentDefinitionIndex], translationElement);
    });

    // Examples Section
    const examplesTitle = document.createElement('h3');
    examplesTitle.textContent = 'Examples (Click to Listen):';
    container.appendChild(examplesTitle);

    const examplesContainer = document.createElement('div');
    examplesContainer.classList.add('examples-container');

    examples.forEach((example) => {
        const exampleElement = document.createElement('div');
        exampleElement.classList.add('example-item');
        exampleElement.textContent = example || "No examples available.";

        // Add click event to read example aloud
        exampleElement.style.cursor = 'pointer';
        exampleElement.title = "Click to listen";
        exampleElement.addEventListener('click', () => playAudio(example));

        examplesContainer.appendChild(exampleElement);
    });

    // Add a "Load More Examples" icon
    const loadMoreIcon = document.createElement('span');
    loadMoreIcon.innerHTML = 'load more examples'; // Unicode for downwards arrow
    loadMoreIcon.title = "Load more examples";
    loadMoreIcon.classList.add('load-more-icon');
    loadMoreIcon.style.cursor = 'pointer';
    loadMoreIcon.style.marginTop = '10px';

    // Add event listener to load more examples
    loadMoreIcon.addEventListener('click', () => loadMoreExamples(word, examplesContainer));

    // Append the container
    container.appendChild(examplesContainer);
    container.appendChild(loadMoreIcon);

    return container;
}
function loadMoreExamples(word, examplesContainer) {
    fetchDefinition(word, true); // Request to load more examples, passing true for loading more
}

function fetchDefinition(word, loadMore = false) {
    const apiUrl = `${dictionaryApiUrl}${word}?key=${apiKey}`;
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0 && data[0].shortdef) {
                const definitions = data[0].shortdef; // Array of definitions
                const examples = loadMore ? extractMoreExamples(data) : extractExamples(data); // Extract more examples if requested

                // Pass the definitions array and examples
                if (loadMore) {
                    // Only show new examples in a new message
                    const newExamplesMessage = createNewExamplesMessage(word, examples);
                    displayElement(newExamplesMessage);
                } else {
                    const container = createDefinitionContainer(word, definitions, examples, loadMore);
                    displayElement(container);
                }
            } else {
                fetchFallbackDefinition(word, loadMore);
            }
        })
        .catch(() => {
            fetchFallbackDefinition(word, loadMore);
        });
}

// Create a new message for the "Load More Examples" action with only the new examples
function createNewExamplesMessage(word, examples) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message-container');

    // Word and "New Examples" heading
    const wordElement = document.createElement('h2');
    wordElement.textContent = `New Examples for: ${word} (Click to Listen):`;
    messageContainer.appendChild(wordElement);
    const examplesContainer = document.createElement('div');
    examplesContainer.classList.add('examples-container');

    examples.forEach((example) => {
        const exampleElement = document.createElement('div');
        exampleElement.classList.add('example-item');
        exampleElement.textContent = example || "No examples available.";

        // Add click event to read example aloud
        exampleElement.style.cursor = 'pointer';
        exampleElement.title = "Click to listen";
        exampleElement.addEventListener('click', () => playAudio(example));

        examplesContainer.appendChild(exampleElement);
    });

    messageContainer.appendChild(examplesContainer);

    return messageContainer;
}

// Extract more examples when loading additional ones
function extractMoreExamples(data) {
    const moreExamples = [];
    if (data[0].def && data[0].def[0] && data[0].def[0].sseq) {
        const senses = data[0].def[0].sseq;
        senses.forEach(senseGroup => {
            senseGroup.forEach(sense => {
                if (sense[1] && sense[1].dt) {
                    sense[1].dt.forEach(item => {
                        if (item[0] === 'vis') {
                            // Extract examples (vis contains example sentences)
                            item[1].forEach(usage => {
                                if (usage.t && moreExamples.length < 20) { // Limit to 10 total examples
                                    moreExamples.push(usage.t.replace(/{[^}]+}/g, '')); // Clean up formatting
                                }
                            });
                        }
                    });
                }
            });
        });
    }
    // Return additional examples or a fallback message
    return moreExamples.length > 0 ? moreExamples : ["No more examples available."];
}

async function translateDefinition(definition, translationElement) {
    const url = 'https://simple-translate2.p.rapidapi.com/translate?source_lang=auto&target_lang=ar';
    const options = {
        method: 'POST',
        headers: {
            'x-rapidapi-key': '38664e406amsh1dda16328365f35p160142jsnec160d9f672c',  // Replace with your RapidAPI key
            'x-rapidapi-host': 'simple-translate2.p.rapidapi.com',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sourceText: definition  // The definition text to translate
        })
    };

    // Check if the definition is empty
    if (!definition || definition.trim() === '') {
        translationElement.textContent = 'No definition to translate.';
        return;
    }

    try {
        // Fetch the translation from the Simple Translate API
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`Translation failed: ${response.status}`);
        }

        const result = await response.json();
        // Check if the translation was successful and display it
        if (result && result.data && result.data.targetText) {
            translationElement.textContent = `Translation: ${result.data.targetText}`;
        } else {
            throw new Error('No translation found in the response.');
        }
    } catch (error) {
        translationElement.textContent = 'Failed to translate definition.';
        console.error('Error translating:', error.message);
    }
}

async function translateDefinition(definition, translationElement) {
    const url = 'https://simple-translate2.p.rapidapi.com/translate?source_lang=auto&target_lang=ar';
    const options = {
        method: 'POST',
        headers: {
            'x-rapidapi-key': '38664e406amsh1dda16328365f35p160142jsnec160d9f672c',  // Replace with your RapidAPI key
            'x-rapidapi-host': 'simple-translate2.p.rapidapi.com',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sourceText: definition  // The definition text to translate
        })
    };

    // Check if the definition is empty
    if (!definition || definition.trim() === '') {
        translationElement.textContent = 'No definition to translate.';
        return;
    }

    try {
        // Fetch the translation from the Simple Translate API
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`Translation failed: ${response.status}`);
        }

        const result = await response.json();
        // Check if the translation was successful and display it
        if (result && result.data && result.data.targetText) {
            translationElement.textContent = `Translation: ${result.data.targetText}`;
        } else {
            throw new Error('No translation found in the response.');
        }
    } catch (error) {
        translationElement.textContent = 'Failed to translate definition.';
        console.error('Error translating:', error.message);
    }
}




// Play audio using VoiceRSS API
async function playAudio(text) {
    const encodedText = encodeURIComponent(text);
    const url = `https://api.voicerss.org/?key=${voiceRSSAPIKey}&hl=en-us&src=${encodedText}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch audio. Status: ${response.status}`);
        }
        const contentType = response.headers.get("Content-Type");
        if (!contentType || !contentType.startsWith("audio/")) {
            throw new Error("Invalid audio content type received");
        }
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

