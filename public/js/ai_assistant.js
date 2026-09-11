// TaxBuddy Floating AI Assistant Widget
document.addEventListener('DOMContentLoaded', () => {
  // Inject widget HTML into page
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'ai-assistant-root';
  widgetContainer.innerHTML = `
    <button id="ai-widget-toggle" class="ai-widget-button" title="Chat with TaxBuddy AI">
      ⚡
    </button>
    <div id="ai-chat-box" class="ai-chat-window">
      <div class="ai-chat-header">
        <div>
          <h4>🤖 TaxBuddy AI Assistant</h4>
          <span style="font-size:0.75rem; opacity:0.8;">Instant Tax Answers & Notice Defense</span>
        </div>
        <button id="ai-chat-close" style="background:none; border:none; color:white; font-size:1.2rem; cursor:pointer;">&times;</button>
      </div>
      <div id="ai-chat-messages" class="ai-chat-body">
        <div class="chat-msg bot">
          Hello! I'm <strong>TaxBuddy AI</strong>. Ask me anything about Indian Income Tax FY 2025-26, Old vs New Regime, HRA rules, 80C deductions, or Form 16 filing!
        </div>
      </div>
      <div class="ai-chat-footer">
        <input type="text" id="ai-chat-input" placeholder="Type your tax question..." />
        <button id="ai-chat-send" class="btn btn-primary" style="padding: 0.4rem 0.9rem; border-radius:18px;">Send</button>
      </div>
    </div>
  `;
  document.body.appendChild(widgetContainer);

  const toggleBtn = document.getElementById('ai-widget-toggle');
  const chatWindow = document.getElementById('ai-chat-box');
  const closeBtn = document.getElementById('ai-chat-close');
  const sendBtn = document.getElementById('ai-chat-send');
  const chatInput = document.getElementById('ai-chat-input');
  const chatMessages = document.getElementById('ai-chat-messages');

  toggleBtn.addEventListener('click', () => chatWindow.classList.toggle('open'));
  closeBtn.addEventListener('click', () => chatWindow.classList.remove('open'));

  async function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Append user message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg user';
    userMsg.textContent = text;
    chatMessages.appendChild(userMsg);
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Append typing indicator
    const typingMsg = document.createElement('div');
    typingMsg.className = 'chat-msg bot';
    typingMsg.innerHTML = '<em>TaxBuddy AI is thinking...</em>';
    chatMessages.appendChild(typingMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      const res = await TaxAPI.askAI(text);
      typingMsg.innerHTML = res.answer || "I'm analyzing your tax query. Please consult with our CA expert for official filing.";
    } catch (err) {
      typingMsg.innerHTML = "Sorry, couldn't reach TaxBuddy AI. Please try again.";
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  sendBtn.addEventListener('click', handleSend);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
  });
});
