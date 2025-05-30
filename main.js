document.addEventListener("DOMContentLoaded", () => {
  const promptForm = document.querySelector(".prompt-form");
  const promptInput = document.querySelector(".prompt-input");
  const chatsContainer = document.querySelector(".chats-container");

  // Generating bot response
  const API_KEY = "AIzaSyC0DvQ96VGYI1_0r7NYfHSoBBXQI8mu2-4"; // Ensure this is correct and handled securely in a real app
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
  const chatHistory = [];

  // Function to format bot replies (e.g., bolding, new lines)
  function formatBotReply(text) {
    // Replace **text** with <strong>text</strong>
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    formattedText = formattedText.replace(/\n/g, "<br>");

    return formattedText;
  }

  const generateBotResponse = async (userMessage) => {
    if (!userMessage) return "Please enter a message.";

    chatHistory.push({
      role: "user",
      parts: [{ text: userMessage }],
    });

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: chatHistory }),
      });

      const data = await response.json();
      console.log("Gemini response:", data);

      if (!response.ok) throw new Error(data.error.message);

      let botReply =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No response received.";

      // Format the bot's plain text reply
      botReply = formatBotReply(botReply);

      // Store the unformatted text in chatHistory if you need it for subsequent API calls
      // or a different representation. If the API expects plain text, store plain text here.
      chatHistory.push({
        role: "model",
        parts: [
          {
            text:
              data.candidates?.[0]?.content?.parts?.[0]?.text ||
              "No response received.",
          },
        ],
      });

      return botReply;
    } catch (error) {
      console.error("Error fetching bot response:", error.message);
      return "Oops! Something went wrong.";
    }
  };

  const typingEffect = (text, textElement, botMsgDiv) => {
    textElement.innerHTML = "";
    const words = text.split(" ");
    let wordIndex = 0;

    const typingInterval = setInterval(() => {
      if (wordIndex < words.length) {
        textElement.innerHTML +=
          (wordIndex === 0 ? "" : " ") + words[wordIndex++];
        chatsContainer.scrollTop = chatsContainer.scrollHeight;
      } else {
        clearInterval(typingInterval);
        botMsgDiv.classList.remove("loading");
        document.body.classList.remove("bot-responding");
      }
    }, 40); // Adjust typing speed here
  };

  promptForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const userInput = promptInput.value.trim();
    if (!userInput) return;

    // Display user message
    const userMessage = document.createElement("div");
    userMessage.classList.add("message", "user-message");
    userMessage.innerHTML = `<p class="message-text">${userInput}</p>`;
    chatsContainer.appendChild(userMessage);
    chatsContainer.scrollTop = chatsContainer.scrollHeight;
    promptInput.value = "";

    // Display bot "Just a sec..." message
    const loadingMessage = document.createElement("div");
    loadingMessage.classList.add("message", "bot-message", "loading");
    loadingMessage.innerHTML = `
        <img src="assets/gemini-chatbot-logo.svg" alt="Gemini Bot" class="avatar" />
        <p class="message-text">Just a sec...</p>
      `;
    chatsContainer.appendChild(loadingMessage);
    chatsContainer.scrollTop = chatsContainer.scrollHeight;

    // Fetch bot response and replace loading message after delay
    const botReply = await generateBotResponse(userInput);

    setTimeout(() => {
      // Reuse the loadingMessage element for typing animation
      const botMessage = document.createElement("div");
      botMessage.classList.add("message", "bot-message", "loading");
      botMessage.innerHTML = `
          <img src="assets/gemini-chatbot-logo.svg" alt="Gemini Bot" class="avatar" />
          <p class="message-text"></p>
        `;
      chatsContainer.replaceChild(botMessage, loadingMessage);

      const textElement = botMessage.querySelector(".message-text");
      typingEffect(botReply, textElement, botMessage);
    }, 800); // Typing delay
  });
});
