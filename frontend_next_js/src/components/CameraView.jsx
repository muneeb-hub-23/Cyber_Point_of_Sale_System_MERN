import { useEffect, useRef } from "react";
import apiaddress from "@/apirequests/apiaddress";

export default function CameraView() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const initializeCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Camera access denied.", error);
      }
    };
    initializeCamera();

    const captureAndSendImage = async () => {
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
    
            // Now send the captured image directly to the backend
            try {
                const response = await fetch(`http://localhost:4000/authentication/loginbyfaceid`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ image: imageData }), // Send base64 image
                });
    
                // Handle the response
                const data = await response.json();
                console.log("Response:", data);
    
                if (response.ok) {
                    // Handle successful match or any other success response
                    console.log("Face match result:", JSON.parse(data));
                } else {
                    // Handle errors or no match case
                    console.error("Error during face recognition:", JSON.parse(data.error));
                }
            } catch (error) {
                console.error("Error sending image:", error);
            }
        }
    };
    
      

    const intervalId = setInterval(captureAndSendImage, 3000);

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline className="w-full h-auto bg-gray-200" />
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
