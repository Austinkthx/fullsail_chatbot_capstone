import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
});

// ─── Chat API helpers ────────────────────────────────────────

export async function fetchModels() {
  const res = await api.get('/llm/models');
  return res.data;
}

export async function fetchConversations() {
  const res = await api.get('/chat/conversations');
  return res.data;
}

export async function createConversation(title, modelId) {
  const res = await api.post('/chat/conversations', {
    title,
    model_id: modelId,
  });
  return res.data;
}

export async function deleteConversation(id) {
  await api.delete(`/chat/conversations/${id}`);
}

export async function fetchMessages(conversationId) {
  const res = await api.get(`/chat/conversations/${conversationId}/messages`);
  return res.data;
}

export async function sendMessageStream(conversationId, content, modelId, onChunk) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ content, model_id: modelId }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return fullText;
        fullText += data;
        onChunk(fullText);
      }
    }
  }

  return fullText;
}

export default api;
