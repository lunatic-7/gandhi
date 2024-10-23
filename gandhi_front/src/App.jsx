import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import useSpeechRecognition from './useSpeechRecognition';
import gandhi_img from "./assets/gandhi_img.jpg"

const App = () => {
  const [messages, setMessages] = useState([]);
  const [sessionActive, setSessionActive] = useState(false);


  // Handle each speech recognition result
  const handleSpeechResult = async (transcript) => {
    if (!transcript.trim()) return;

    const userMessage = { content: transcript };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      // Send the user's message to the backend
      const response = await axios.post('http://127.0.0.1:8000/api/ask', {
        messages: [userMessage], // Send only the latest message
      });

      const aiResponse = response.data.response;
      const aiMessage = { content: aiResponse };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);

      speak(aiResponse); // Read the AI's response out loud
    } catch (error) {
      console.error('Error fetching AI response:', error);
    }
  };

  const { listening, startListening, stopListening, isSupported } = useSpeechRecognition(handleSpeechResult);


  // Function to start the voice recognition session
  const startSession = useCallback(() => {
    setSessionActive(true);
    startListening();
    // setTimeout(stopSession, 600000); // Automatically stop session after 600 seconds
  }, [startListening]);


  // Function to stop the session
  const stopSession = useCallback(async () => {
    setSessionActive(false);
    stopListening();
    setMessages([]);
    try {
      await axios.post('http://localhost:8000/api/end');
      console.log("Conversation ended and chat history cleared.");
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }, [stopListening]);

  // Restart listening if it stops
  useEffect(() => {
    let timeoutId;
    if (sessionActive && !listening) {
      timeoutId = setTimeout(() => {
        console.log("Restarting listening...");
        startListening();
      }, 1000);
    }
    return () => clearTimeout(timeoutId);
  }, [sessionActive, listening, startListening]);


  // Text-to-speech function
  const speak = useCallback((text) => {
    if (!window.speechSynthesis) {
      console.error("SpeechSynthesis API is not supported in this browser.");
      return;
    }

    if (typeof text !== 'string' || text.trim() === '') {
      console.error("Invalid text provided for speech synthesis.");
      return;
    }

    window.speechSynthesis.cancel();

    const speakText = async () => {
      const voices = await new Promise((resolve) => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length) {
          resolve(voices);
        } else {
          window.speechSynthesis.onvoiceschanged = () => {
            resolve(window.speechSynthesis.getVoices());
          };
        }
      });

      const indianVoice = voices.find(voice => voice.name === 'Google हिन्दी');
      const selectedVoice = indianVoice || voices[0];

      const chunkSize = 150;
      const chunks = text.match(new RegExp(`.{1,${chunkSize}}(\\s|$)`, 'g'));

      const speakChunk = (textChunk) => {
        return new Promise((resolve, reject) => {
          const utterance = new SpeechSynthesisUtterance(textChunk);
          utterance.voice = selectedVoice;

          utterance.onend = () => resolve();
          utterance.onerror = (event) => reject(event);

          window.speechSynthesis.speak(utterance);
        });
      };

      for (const chunk of chunks) {
        try {
          await speakChunk(chunk);
        } catch (error) {
          console.error("Speech synthesis error:", error);
          break;
        }
      }
    };

    speakText();
  }, []);


  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-100 via-white to-green-100 text-gray-800">
      <header className="bg-orange-500 text-white py-2 px-6 flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold">Gandhi AI Assistant</h1>
        <div className="flex items-center">
          {sessionActive ? (
            <button
              onClick={stopSession}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-1.5 px-4 rounded-full transition duration-300 flex items-center"
            >
              <span className="mr-2">End Session</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
            </button>
          ) : (
            <button
              onClick={startSession}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-1.5 px-3 rounded-full transition duration-300 flex items-center"
            >
              <span className="mr-2">Start Session</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </header>

      <main className="flex-grow flex">
        <div className="flex-1 p-6 overflow-auto">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-3xl mx-auto">
            <div className="mb-6 text-center">
              <img
                src={gandhi_img}
                alt="Mahatma Gandhi"
                className="w-44 max-w-md mx-auto rounded-lg shadow-md"
              />
            </div>

            <div className="space-y-4 h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 italic">
                  <p className="text-xl mb-2">"Be the change you wish to see in the world."</p>
                  <p>Start a conversation to interact with Gandhi AI</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${index % 2 === 0
                      ? 'bg-orange-100 text-orange-800 border-l-4 border-orange-500'
                      : 'bg-green-100 text-green-800 border-l-4 border-green-500'
                      } transition-all duration-300 hover:shadow-md`}
                  >
                    <div className="flex items-start">
                      <span className={`text-2xl mr-3 ${index % 2 === 0 ? 'text-orange-500' : 'text-green-500'}`}>
                        {index % 2 === 0 ? '👤' : '🕊️'}
                      </span>
                      <p className="flex-1">{message.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {listening && (
              <div className="mt-4 flex items-center justify-center text-green-600 bg-green-100 p-2 rounded-full">
                <div className="spinner mr-2"></div>
                <span>Listening to your words...</span>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white bg-opacity-75 text-center py-4">
        <p className="text-sm text-gray-600">
          "The best way to find yourself is to lose yourself in the service of others." - Mahatma Gandhi
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Session status: {sessionActive ? 'Active' : 'Inactive'}, Listening: {listening ? 'Yes' : 'No'}
        </p>
      </footer>

      <style jsx>{`
        .spinner {
          border: 3px solid rgba(0, 128, 0, 0.3);
          border-radius: 50%;
          border-top: 3px solid #008000;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default App;
