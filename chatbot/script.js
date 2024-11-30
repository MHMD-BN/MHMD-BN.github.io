const apiKey = 'c8498fbf-ead5-4663-875d-365f12f29b03'; // Merriam-Webster API key
const dictionaryApiUrl = 'https://dictionaryapi.com/api/v3/references/learners/json/';
const fallbackApiUrl = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
const voiceRSSAPIKey = '4c3b4d4b34804e11b8f6e4b8d74f594f'; // VoiceRSS API key

function createThemeToggle() {
    const themeToggle = document.createElement('div');
    themeToggle.id = 'theme-toggle';
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    themeToggle.title = "Toggle Theme";
    
    themeToggle.addEventListener('click', toggleTheme);
    
    document.body.appendChild(themeToggle);
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const root = document.documentElement;
    root.setAttribute('data-theme', savedTheme);
    
    createThemeToggle();
    
    // Update both desktop and mobile theme icons
    updateThemeIcons(savedTheme);
    
    // Add click handler for mobile theme toggle
    document.getElementById('mobile-theme').addEventListener('click', toggleTheme);
    
    // Add click handler for mobile clear
    document.getElementById('mobile-clear').addEventListener('click', clearHistory);
}

function updateThemeIcons(theme) {
    const iconClass = theme === 'dark' ? 'fa-moon' : 'fa-sun';
    
    // Update desktop theme toggle
    const desktopIcon = document.querySelector('#theme-toggle i');
    if (desktopIcon) {
        desktopIcon.className = `fas ${iconClass}`;
    }
    
    // Update mobile theme toggle
    const mobileIcon = document.querySelector('#mobile-theme i');
    if (mobileIcon) {
        mobileIcon.className = `fas ${iconClass}`;
    }
}

function toggleTheme() {
    const root = document.documentElement;
    const currentTheme = root.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Add fade transition
    document.body.style.opacity = '0';
    
    setTimeout(() => {
        root.setAttribute('data-theme', newTheme);
        updateThemeIcons(newTheme);
        
        // Save theme preference
        localStorage.setItem('theme', newTheme);
        
        // Fade back in
        document.body.style.opacity = '1';
    }, 200);
}

document.addEventListener('DOMContentLoaded', initializeTheme);

document.getElementById('clear-history').addEventListener('click', clearHistory);

function clearHistory() {
    const chatHistory = document.getElementById('chat-history');
    const messages = chatHistory.children;
    
    // Convert HTMLCollection to Array and reverse it for bottom-up animation
    const messagesArray = Array.from(messages);
    
    // Animate each message's removal
    messagesArray.forEach((message, index) => {
        setTimeout(() => {
            // Add fade-out and slide-up animation
            message.style.transition = 'all 0.3s ease';
            message.style.opacity = '0';
            message.style.transform = 'translateY(-20px)';
            
            // Remove the element after animation
            setTimeout(() => {
                message.remove();
            }, 300);
        }, index * 100); // Stagger the animation for each message
    });
}

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

    // Word heading
    const wordElement = document.createElement('h2');
    wordElement.textContent = word;
    container.appendChild(wordElement);

    // Definition
    let currentDefinitionIndex = 0;
    const definitionElement = document.createElement('p');
    definitionElement.textContent = `Definition: ${definitions[currentDefinitionIndex] || "Definition not available."}`;
    container.appendChild(definitionElement);

    // Translation element
    const translationElement = document.createElement('p');
    translationElement.classList.add('translation');
    container.appendChild(translationElement);

    // Icons container - now after definition and translation
    const iconsContainer = document.createElement('div');
    iconsContainer.classList.add('icons-container');

    // Next definition icon
    const nextDefinitionIcon = document.createElement('span');
    nextDefinitionIcon.innerHTML = '<i class="fas fa-sync-alt"></i>';
    nextDefinitionIcon.title = "Show Next Definition";
    nextDefinitionIcon.classList.add('icon', 'next-def-icon');
    nextDefinitionIcon.addEventListener('click', () => {
        currentDefinitionIndex = (currentDefinitionIndex + 1) % definitions.length;
        definitionElement.textContent = `Definition: ${definitions[currentDefinitionIndex] || "Definition not available."}`;
        
        // Hide translation when showing new definition
        translationElement.classList.remove('show');
        translationElement.textContent = ''; // Clear the translation text
    });
    iconsContainer.appendChild(nextDefinitionIcon);

    // Translate icon
    const translateIcon = document.createElement('span');
    translateIcon.innerHTML = '<i class="fas fa-language"></i>';
    translateIcon.title = "Translate Definition";
    translateIcon.classList.add('icon', 'translate-icon');
    translateIcon.addEventListener('click', () => {
        const isHidden = !translationElement.classList.contains('show');
        if (isHidden) {
            // Show and translate
            translationElement.classList.add('show');
            translateDefinition(definitions[currentDefinitionIndex], translationElement);
        } else {
            // Hide translation
            translationElement.classList.remove('show');
        }
    });
    iconsContainer.appendChild(translateIcon);

    // Learn more icon
    const learnMoreIcon = document.createElement('span');
    learnMoreIcon.innerHTML = '<i class="fas fa-lightbulb"></i>';
    learnMoreIcon.title = "Learn More";
    learnMoreIcon.classList.add('icon', 'learn-more-icon');
    
    // Create word relationships container (initially hidden)
    const relationshipsContainer = document.createElement('div');
    relationshipsContainer.classList.add('word-relationships');
    relationshipsContainer.style.display = 'none'; // Initially hidden

    // Similar Words
    const similarWordsSection = document.createElement('div');
    similarWordsSection.classList.add('relationship-section');
    const similarWordsTitle = document.createElement('h4');
    similarWordsTitle.textContent = 'Similar Words:';
    const similarWordsList = document.createElement('p');
    similarWordsList.classList.add('relationship-list');
    similarWordsSection.appendChild(similarWordsTitle);
    similarWordsSection.appendChild(similarWordsList);
    relationshipsContainer.appendChild(similarWordsSection);

    // Antonyms
    const antonymsSection = document.createElement('div');
    antonymsSection.classList.add('relationship-section');
    const antonymsTitle = document.createElement('h4');
    antonymsTitle.textContent = 'Antonyms:';
    const antonymsList = document.createElement('p');
    antonymsList.classList.add('relationship-list');
    antonymsSection.appendChild(antonymsTitle);
    antonymsSection.appendChild(antonymsList);
    relationshipsContainer.appendChild(antonymsSection);

    // Synonyms
    const synonymsSection = document.createElement('div');
    synonymsSection.classList.add('relationship-section');
    const synonymsTitle = document.createElement('h4');
    synonymsTitle.textContent = 'Synonyms:';
    const synonymsList = document.createElement('p');
    synonymsList.classList.add('relationship-list');
    synonymsSection.appendChild(synonymsTitle);
    synonymsSection.appendChild(synonymsList);
    relationshipsContainer.appendChild(synonymsSection);

    container.appendChild(relationshipsContainer);

    // Add click event for learn more icon
    learnMoreIcon.addEventListener('click', () => {
        const isHidden = relationshipsContainer.style.display === 'none';
        relationshipsContainer.style.display = isHidden ? 'block' : 'none';
        learnMoreIcon.innerHTML = isHidden ? '<i class="fas fa-lightbulb"></i>' : '<i class="fas fa-lightbulb"></i>';
        
        // Only fetch relationships if container is being shown
        if (isHidden) {
            fetchWordRelationships(word, similarWordsList, antonymsList, synonymsList);
        }
    });

    iconsContainer.appendChild(learnMoreIcon);
    container.appendChild(iconsContainer);

    // Examples Section
    const examplesTitle = document.createElement('h3');
    examplesTitle.textContent = 'Examples (Click to Listen):';
    container.appendChild(examplesTitle);

    const examplesContainer = document.createElement('div');
    examplesContainer.classList.add('examples-container');

    examples.forEach((example) => {
        const exampleElement = document.createElement('div');
        exampleElement.classList.add('example-item');
        
        // Create text container
        const textContainer = document.createElement('span');
        textContainer.textContent = example || "No examples available.";
        exampleElement.appendChild(textContainer);

        // Create icons container
        const iconsContainer = document.createElement('div');
        iconsContainer.classList.add('example-icons');

        // Listen icon
        const listenIcon = document.createElement('span');
        listenIcon.innerHTML = '<i class="fas fa-volume-up"></i>';
        listenIcon.classList.add('example-icon');
        listenIcon.title = "Listen";
        listenIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            playAudio(example);
        });

        // Translate icon
        const translateIcon = document.createElement('span');
        translateIcon.innerHTML = '<i class="fas fa-language"></i>';
        translateIcon.classList.add('example-icon');
        translateIcon.title = "Translate";
        
        // Create translation container
        const translationContainer = document.createElement('div');
        translationContainer.classList.add('example-translation');
        exampleElement.appendChild(translationContainer);

        translateIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!translationContainer.classList.contains('show')) {
                translationContainer.classList.add('show');
                translateExample(example, translationContainer);
            } else {
                translationContainer.classList.remove('show');
            }
        });

        // Append icons
        iconsContainer.appendChild(listenIcon);
        iconsContainer.appendChild(translateIcon);
        exampleElement.appendChild(iconsContainer);

        examplesContainer.appendChild(exampleElement);
    });

    // Add a "Load More Examples" icon
    const loadMoreIcon = document.createElement('span');
    loadMoreIcon.innerHTML = 'load more examples'; // Unicode for downwards arrow
    loadMoreIcon.title = "Load more examples";
    loadMoreIcon.classList.add('load-more-button');
    loadMoreIcon.style.cursor = 'pointer';
    loadMoreIcon.style.marginTop = '20px';

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
    wordElement.style.marginTop = '50px';
    wordElement.textContent = `New Examples for: ${word}`;
    messageContainer.appendChild(wordElement);

    const examplesContainer = document.createElement('div');
    examplesContainer.classList.add('examples-container');

    examples.forEach((example) => {
        const exampleElement = document.createElement('div');
        exampleElement.classList.add('example-item', 'animate');
        
        // Create text container
        const textContainer = document.createElement('span');
        textContainer.textContent = example || "No examples available.";
        exampleElement.appendChild(textContainer);

        // Create icons container
        const iconsContainer = document.createElement('div');
        iconsContainer.classList.add('example-icons');

        // Listen icon
        const listenIcon = document.createElement('span');
        listenIcon.innerHTML = '<i class="fas fa-volume-up"></i>';
        listenIcon.classList.add('example-icon');
        listenIcon.title = "Listen";
        listenIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            playAudio(example);
        });

        // Translate icon
        const translateIcon = document.createElement('span');
        translateIcon.innerHTML = '<i class="fas fa-language"></i>';
        translateIcon.classList.add('example-icon');
        translateIcon.title = "Translate";
        translateIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            translateExample(example);
        });

        // Append icons
        iconsContainer.appendChild(listenIcon);
        iconsContainer.appendChild(translateIcon);
        exampleElement.appendChild(iconsContainer);

        // Add staggered animation delay
        exampleElement.style.animationDelay = `${examples.indexOf(example) * 100}ms`;
        
        examplesContainer.appendChild(exampleElement);
    });

    messageContainer.appendChild(examplesContainer);

    // Add "Load More Examples" button
    const loadMoreIcon = document.createElement('span');
    loadMoreIcon.innerHTML = 'load more examples';
    loadMoreIcon.title = "Load more examples";
    loadMoreIcon.classList.add('load-more-button');
    loadMoreIcon.addEventListener('click', () => loadMoreExamples(word, examplesContainer));
    messageContainer.appendChild(loadMoreIcon);

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
    // Show loading state
    translationElement.classList.add('show'); // Add show class
    translationElement.textContent = 'Translating...';

    const url = 'https://simple-translate2.p.rapidapi.com/translate?source_lang=auto&target_lang=ar';
    const options = {
        method: 'POST',
        headers: {
            'x-rapidapi-key': '38664e406amsh1dda16328365f35p160142jsnec160d9f672c',
            'x-rapidapi-host': 'simple-translate2.p.rapidapi.com',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sourceText: definition
        })
    };

    if (!definition || definition.trim() === '') {
        translationElement.textContent = 'No definition to translate.';
        return;
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`Translation failed: ${response.status}`);
        }

        const result = await response.json();
        if (result && result.data && result.data.targetText) {
            translationElement.textContent = result.data.targetText;
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
    
    // Add animation class
    element.classList.add('animate');
    
    // Append the element
    chatHistory.appendChild(element);
    
    // Scroll to the new element
    element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start'
    });
}
function displayMessage(message, type) {
    const chatHistory = document.getElementById('chat-history');
    const messageElement = document.createElement('div');
    messageElement.classList.add(type, 'message-fade-in');
    messageElement.textContent = message;
    
    // Add initial opacity
    messageElement.style.opacity = '0';
    chatHistory.appendChild(messageElement);
    
    // Trigger reflow
    messageElement.offsetHeight;
    
    // Fade in
    messageElement.style.opacity = '1';
    
    // Scroll to the new message
    messageElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end'
    });
}


// Trigger sending message on Enter key press
document.getElementById('user-input').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});

// Add these new functions to handle the word relationships
async function fetchSimilarWords(word, container) {
    try {
        const response = await fetch(`${dictionaryApiUrl}${word}?key=${apiKey}`);
        const data = await response.json();
        
        const similarWords = extractRelatedWords(data, 'sim');
        displayWordRelations('Similar Words', similarWords, container);
    } catch (error) {
        console.error('Error fetching similar words:', error);
    }
}

async function fetchAntonyms(word, container) {
    try {
        const response = await fetch(`${dictionaryApiUrl}${word}?key=${apiKey}`);
        const data = await response.json();
        
        const antonyms = extractRelatedWords(data, 'ant');
        displayWordRelations('Antonyms', antonyms, container);
    } catch (error) {
        console.error('Error fetching antonyms:', error);
    }
}

async function fetchSynonyms(word, container) {
    try {
        const response = await fetch(`${dictionaryApiUrl}${word}?key=${apiKey}`);
        const data = await response.json();
        
        const synonyms = extractRelatedWords(data, 'syn');
        displayWordRelations('Synonyms', synonyms, container);
    } catch (error) {
        console.error('Error fetching synonyms:', error);
    }
}

function extractRelatedWords(data, relationType) {
    const relatedWords = new Set();
    
    if (Array.isArray(data) && data[0]?.meta?.[relationType]) {
        data[0].meta[relationType].forEach(word => relatedWords.add(word));
    }
    
    return Array.from(relatedWords);
}

function displayWordRelations(title, words, container) {
    // Remove any existing relations display
    const existingRelations = container.querySelector('.word-relations');
    if (existingRelations) {
        existingRelations.remove();
    }

    const relationsDiv = document.createElement('div');
    relationsDiv.classList.add('word-relations');
    
    const titleElement = document.createElement('h3');
    titleElement.textContent = title;
    relationsDiv.appendChild(titleElement);

    if (words.length === 0) {
        const noWordsMsg = document.createElement('p');
        noWordsMsg.textContent = `No ${title.toLowerCase()} found.`;
        relationsDiv.appendChild(noWordsMsg);
    } else {
        const wordsList = document.createElement('div');
        wordsList.classList.add('related-words-list');
        
        words.forEach(word => {
            const wordElement = document.createElement('span');
            wordElement.classList.add('related-word');
            wordElement.textContent = word;
            wordElement.addEventListener('click', () => fetchDefinition(word));
            wordsList.appendChild(wordElement);
        });
        
        relationsDiv.appendChild(wordsList);
    }

    container.appendChild(relationsDiv);
}

async function fetchWordRelationships(word, similarWordsList, antonymsList, synonymsList) {
    try {
        // First get similar words from Merriam-Webster API
        const mwResponse = await fetch(`${dictionaryApiUrl}${word}?key=${apiKey}`);
        const mwData = await mwResponse.json();

        // Get similar words (stems)
        let similarWords = [];
        if (Array.isArray(mwData) && mwData[0]?.meta?.stems) {
            similarWords = mwData[0].meta.stems;
        }

        // Now get synonyms and antonyms from the free Dictionary API
        const freeResponse = await fetch(`${fallbackApiUrl}${word}`);
        const freeData = await freeResponse.json();

        let synonyms = [];
        let antonyms = [];

        if (Array.isArray(freeData) && freeData.length > 0) {
            // Collect synonyms and antonyms from all meanings
            freeData[0].meanings.forEach(meaning => {
                if (meaning.synonyms) {
                    synonyms = [...new Set([...synonyms, ...meaning.synonyms])];
                }
                if (meaning.antonyms) {
                    antonyms = [...new Set([...antonyms, ...meaning.antonyms])];
                }
            });
        }

        // Update the display with clickable words
        [
            { element: synonymsList, words: synonyms, type: 'Synonyms' },
            { element: antonymsList, words: antonyms, type: 'Antonyms' },
            { element: similarWordsList, words: similarWords, type: 'Similar Words' }
        ].forEach(({ element, words, type }) => {
            element.innerHTML = ''; // Clear existing content
            if (words.length > 0) {
                words.forEach((relatedWord, index) => {
                    const wordSpan = document.createElement('span');
                    wordSpan.textContent = relatedWord;
                    wordSpan.classList.add('clickable-word');
                    wordSpan.addEventListener('click', () => fetchDefinition(relatedWord));
                    
                    element.appendChild(wordSpan);
                    
                    // Add comma and space if not the last word
                    if (index < words.length - 1) {
                        element.appendChild(document.createTextNode(', '));
                    }
                });
            } else {
                element.textContent = `No ${type.toLowerCase()} found`;
            }
        });

    } catch (error) {
        console.error('Error fetching word relationships:', error);
        synonymsList.textContent = 'Error fetching synonyms';
        antonymsList.textContent = 'Error fetching antonyms';
        similarWordsList.textContent = 'Error fetching similar words';
    }
}

// Add new function to translate examples
async function translateExample(text, container) {
    const { box, content } = createTranslationBox();
    
    const url = 'https://simple-translate2.p.rapidapi.com/translate?source_lang=auto&target_lang=ar';
    const options = {
        method: 'POST',
        headers: {
            'x-rapidapi-key': '38664e406amsh1dda16328365f35p160142jsnec160d9f672c',
            'x-rapidapi-host': 'simple-translate2.p.rapidapi.com',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sourceText: text
        })
    };

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`Translation failed: ${response.status}`);
        }

        const result = await response.json();
        if (result && result.data && result.data.targetText) {
            // Create result container
            const resultContainer = document.createElement('div');
            resultContainer.classList.add('translation-result');
            
            // Original text
            const originalText = document.createElement('div');
            originalText.classList.add('original-text');
            originalText.textContent = text;
            
            // Divider
            const divider = document.createElement('div');
            divider.classList.add('translation-divider');
            
            // Translated text
            const translatedText = document.createElement('div');
            translatedText.classList.add('translated-text');
            translatedText.textContent = result.data.targetText;
            translatedText.dir = 'rtl'; // For Arabic text

            resultContainer.appendChild(originalText);
            resultContainer.appendChild(divider);
            resultContainer.appendChild(translatedText);
            
            content.innerHTML = ''; // Clear loading
            content.appendChild(resultContainer);
        } else {
            throw new Error('No translation found in the response.');
        }
    } catch (error) {
        content.innerHTML = `
            <div class="translation-error">
                <i class="fas fa-exclamation-circle"></i>
                <span>Failed to translate example.</span>
            </div>
        `;
        console.error('Error translating:', error.message);
    }
}

function createTranslationBox() {
    // Remove existing translation box if any
    const existingBox = document.getElementById('translation-box');
    if (existingBox) existingBox.remove();

    const translationBox = document.createElement('div');
    translationBox.id = 'translation-box';
    translationBox.classList.add('translation-box');

    // Create header
    const header = document.createElement('div');
    header.classList.add('translation-header');
    
    const title = document.createElement('span');
    title.textContent = 'Translation';
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.onclick = () => {
        translationBox.classList.remove('show');
        setTimeout(() => translationBox.remove(), 300);
    };

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Create content
    const content = document.createElement('div');
    content.classList.add('translation-content');

    // Create loading spinner
    const loadingSpinner = document.createElement('div');
    loadingSpinner.classList.add('translation-loading');
    loadingSpinner.innerHTML = `
        <div class="spinner"></div>
        <span>Translating...</span>
    `;
    content.appendChild(loadingSpinner);

    translationBox.appendChild(header);
    translationBox.appendChild(content);
    document.body.appendChild(translationBox);

    // Show box with animation after a brief delay
    setTimeout(() => translationBox.classList.add('show'), 10);

    return { box: translationBox, content };
}
