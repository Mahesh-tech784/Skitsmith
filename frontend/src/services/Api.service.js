import AxiosClient from "./Axios.service.js";
import qs from "qs";
import { setVariable } from "../utils/localStorage.js";
import { apiBaseUrl } from '../constants/constant.js';  
import { getVariable } from '../utils/localStorage.js';

const ApiService = {
  login: async (payload) => {
    const { data, loading, error } = await AxiosClient({
      method: "POST",
      url: `user/login`,
      data: payload,
    });
    if (data ) {
      setVariable("km_user_token", data.result.token);
    }
    return { data, error, loading };
  },

   register: async (payload) => {
    const { data, loading, error } = await AxiosClient({
      method: "POST",
      url: `user/register`,
      data: payload,
    });
    
    return { data, error, loading };
  },

   getAllChatBots: async () => {
    const { data, loading, error } = await AxiosClient({
      method: "GET",
      url: `chat-bot/all`,
    });
    
    return { data, error, loading };
  },

   createChatBot: async (payload) => {
    const { data, loading, error } = await AxiosClient({
      method: "POST",
      url: `chat-bot/`,
      data:payload
    });
    
    return { data, error, loading };
  },

  //  startConversation: async (payload) => {
  //   const { data, loading, error } = await AxiosClient({
  //     method: "POST",
  //     url: `chat-bot/chat`,
  //     data:payload
  //   });
    
  //   return { data, error, loading };
  // },

   getAllFiles: async (chatBotId) => {
    const { data, loading, error } = await AxiosClient({
      method: "GET",
      url: `files?chatBotId=${chatBotId}`
    });
    
    return { data, error, loading };
  },

  uploadFile: async (payload) => {
    const { data, loading, error } = await AxiosClient({
      method: "POST",
      url: `files/fileUpload`,
      data:payload,
      contentType:'multipart/form-data'
    });
    
    return { data, error, loading };
  },
  deleteFile: async (payload) => {
    const { data, loading, error } = await AxiosClient({
      method: "DELETE",
      url: `files/file`,
      data:payload
    });
    
    return { data, error, loading };
  },

  
};

/**
 * Streams conversation response and calls onChunk for each parsed chunk.
 * onChunk receives either a string or parsed object depending on server.
 */
export const startConversation = async (payload, onChunk) => {
  const token = getVariable('km_user_token');

  if (!token) {
    throw new Error("Authentication token not found. Please log in again.");
  }

  const response = await fetch(`${apiBaseUrl}chat-bot/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Response error:', response.status, response.statusText, errorText);
    throw new Error(`Server error (${response.status}): ${response.statusText}. ${errorText || 'Please try again.'}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let receivedData = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunkStr = decoder.decode(value, { stream: true });
      buffer += chunkStr;
      receivedData = true;
 
      const parts = buffer.split('\n');
      buffer = parts.pop();

      for (const part of parts) {
        const line = part.trim();
        if (!line) continue;

 
        const jsonString = line.startsWith('data:') ? line.replace(/^data:\s*/, '') : line;

     
        try {
          const parsed = JSON.parse(jsonString);
          onChunk(parsed);
        } catch (err) {
          // If it's not JSON, treat it as plain text
          onChunk(jsonString);
        }
      }
    }

 
    if (buffer && buffer.trim()) {
      const remaining = buffer.trim();
      try {
        onChunk(JSON.parse(remaining));
      } catch {
        onChunk(remaining);
      }
    }

    if (!receivedData) {
      throw new Error("No response received from server");
    }
  } finally {
    try { 
      reader.releaseLock(); 
    } catch (e) {
      console.warn("Error releasing reader lock:", e);
    }
  }
};

export default ApiService;
