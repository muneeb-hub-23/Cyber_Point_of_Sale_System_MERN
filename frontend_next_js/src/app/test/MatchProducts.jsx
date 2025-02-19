'use client'
import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import axios from "axios";

const ProductCameraCapture = () => {
    const webcamRef = useRef(null);
    const [result, setResult] = useState(null);

    const captureImage = () => {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
            sendImageToApi(imageSrc);
        }
    };

    const sendImageToApi = async (base64Image) => {
        try {
            // Log the image for debugging

            const response = await axios.post("http://localhost:5000/search_product", {
                image: base64Image,  // Make sure base64Image includes "data:image/jpeg;base64,"
            });

            if (response.data.match) {
                setResult(`Matched Product: ${response.data.product_name}`);
            } else {
                setResult("No matching product found.");
            }
        } catch (error) {
            console.error("Error matching product:", error);
            setResult("An error occurred during product matching.");
        }
    };

    return (
        <div className="flex flex-col items-center">
            <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width={350}
                height={350}
                className="border-2 border-rose-500 rounded-lg"
            />
            <button
                onClick={captureImage}
                className="mt-4 bg-rose-500 text-white py-2 px-4 rounded"
            >
                Capture and Match Product
            </button>
            {result && <p className="mt-4 text-lg text-gray-800">{result}</p>}
        </div>
    );
};

export default ProductCameraCapture;
