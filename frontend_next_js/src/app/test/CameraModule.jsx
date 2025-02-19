
import { useEffect, useRef, useState } from "react";
import { useGlobalState } from "@/js/globaluser";

export default function CameraCapture() {
  const { user, setUser } = useGlobalState();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraDenied, setIsCameraDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [matchedPerson, setMatchedPerson] = useState(null);
  const [urduName, setUrduName] = useState(null);
  const speechRef = useRef(window.speechSynthesis);

  useEffect(() => {
    const initializeCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraDenied(false);
        }
      } catch (error) {
        setIsCameraDenied(true);
        setErrorMessage("Camera access denied. Please check your settings.");
      }
    };
    initializeCamera();

    const intervalId = setInterval(() => {
      captureImage();
    }, 3000); // Send image every 3 seconds

    return () => clearInterval(intervalId);
  }, []);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      // Resize canvas for compression (optional, e.g., half size)
      canvas.width = videoRef.current.videoWidth / 2;
      canvas.height = videoRef.current.videoHeight / 2;

      // Draw the video frame to the canvas
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      // Compress image to reduce size (quality set to 0.7)
      const imageData = canvas.toDataURL("image/jpeg", 0.7);
      sendImage(imageData);
    }
  };

  const sendImage = async (imageData) => {
    try {
      const response = await fetch(`http://localhost:5000/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });

      const result = await response.json();
      if (response.ok && result.match) {
        setUser({ ...user, username: result.name });
        setMatchedPerson(result.name);
        setErrorMessage("");

        // Translate the name to Urdu and then speak it
        const translatedName = await translateToUrdu(result.name);
        setUrduName(translatedName); // For display or debug
        speakName(translatedName);
      } else {
        setMatchedPerson(null);
        setUser({ ...user, username: "" });
        setErrorMessage("No Match");
      }
    } catch (error) {
      setErrorMessage("Error occurred");
    }
  };

  const speakName = (name) => {
    if (speechRef.current.speaking) {
      speechRef.current.cancel(); // Cancel any ongoing speech
    }

    const utterance = new SpeechSynthesisUtterance(name);

    // Select an Urdu-speaking female voice
    const voices = speechRef.current.getVoices();
    utterance.voice = voices.find((voice) =>
      voice.lang.includes("ur") && voice.name.toLowerCase().includes("female")
    ) || voices.find((voice) => voice.lang.includes("ur"));

    speechRef.current.speak(utterance);
  };

  return (
    <div>
      {isCameraDenied ? (
        <p>{errorMessage}</p>
      ) : (
        <div>
          <video ref={videoRef} autoPlay playsInline className="w-full h-auto bg-gray-200" />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          {matchedPerson && <p className="text-green-500 mt-1 text-sm">{matchedPerson}</p>}
          {errorMessage && <p className="text-red-500 mt-1 text-sm">{errorMessage}</p>}
        </div>
      )}
    </div>
  );
}
