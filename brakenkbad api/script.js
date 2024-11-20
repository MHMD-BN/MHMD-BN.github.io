document.getElementById("fetch-quote").addEventListener("click", async () => {
    const quoteElement = document.getElementById("quote");
    const authorElement = document.getElementById("author");

    quoteElement.textContent = "Loading...";
    authorElement.textContent = "";

    try {
        const response = await fetch("https://api.breakingbadquotes.xyz/v1/quotes");
        if (!response.ok) {
            throw new Error("Failed to fetch the quote.");
        }

        const data = await response.json();
        const { quote, author } = data[0];

        quoteElement.textContent = `"${quote}"`;
        authorElement.textContent = `- ${author}`;
    } catch (error) {
        quoteElement.textContent = "Oops! Something went wrong.";
        authorElement.textContent = "";
        console.error(error);
    }
});
