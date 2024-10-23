import { useState, useEffect, useRef } from 'react';

const useSpeechRecognition = (onResultCallback) => {
    const [listening, setListening] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const recognitionRef = useRef(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            setIsSupported(true);
        } else {
            console.warn('Speech recognition not supported in this browser.');
            setIsSupported(false);
        }
    }, []);

    const startListening = () => {
        if (!isSupported || listening) return;

        recognitionRef.current.onstart = () => {
            setListening(true);
        };

        recognitionRef.current.onresult = (event) => {
            const currentTranscript = Array.from(event.results)
                .slice(event.resultIndex)
                .map(result => result[0].transcript)
                .join('');
            if (onResultCallback) {
                onResultCallback(currentTranscript);
            }
        };

        recognitionRef.current.onerror = (event) => {
            console.error('Speech recognition error:', event);
            stopListening();
        };

        recognitionRef.current.onend = () => {
            setListening(false);
            // Restart listening if the session is still active
            if (listening) {
                recognitionRef.current.start();
            }
        };

        recognitionRef.current.start();
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setListening(false);
    };

    return {
        listening,
        isSupported,
        startListening,
        stopListening,
    };
};

export default useSpeechRecognition;
