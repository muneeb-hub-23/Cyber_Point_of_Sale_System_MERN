"use client";
import { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import apiaddress from "@/apirequests/apiaddress";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useGlobalState } from "@/js/globaluser";
import { useParams } from "next/navigation";
import Menu from '@/components/Menu'
import { useRouter } from "next/navigation";
import LoginPage from "@/app/authentication/login/page";

const UploadPictures = () => {
  const router = useRouter();
  const param = useParams();
  const { id } = param;
  const { user } = useGlobalState();
  
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [totalImages, setTotalImages] = useState(0);
  const [product, setProduct] = useState(null);
  
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const response = await fetch(`${apiaddress}/management/products/getproductbyid`, {
          method: "GET",
          headers: { id },
        });
        const data = await response.json();
        if (data) {
          setProduct(data); // Save product data (name, itemCode, etc.)
        } else {
          toast.error("Failed to fetch product details.");
        }
      } catch (error) {
        toast.error("An error occurred while fetching product details.");
      }
    };

    fetchProductData();
  }, [id]);

  const handleFileChange = (e) => {
    setSelectedImages(Array.from(e.target.files));
    setTotalImages(e.target.files.length);
    setUploadedCount(0);
    setUploadProgress(0);
  };

  const handleUpload = async () => {
    if (selectedImages.length === 0) {
      toast.warning("Please select images to upload.");
      return;
    }

    const formData = new FormData();
    selectedImages.forEach((image) => formData.append("images", image));
    formData.append("productId", id); // Adding productId
    formData.append("userId", user._id); // Adding userId

    try {
      const response = await fetch(`${apiaddress}/management/products/uploadpictures/${id}`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Images uploaded successfully!");
        setUploadedCount(totalImages);
        setUploadProgress(100);
        router.push('/management/pendingproducts');
      } else {
        toast.error(data.message || "Failed to upload images.");
      }
    } catch (error) {
      toast.error("An error occurred during the upload.");
    }
  };
if(user){
  return (
    <Menu>
      <DefaultLayout>
        <ToastContainer />
        <div className="mx-auto max-w-270">
          <Breadcrumb pageName="Upload Product Pictures" />
        </div>
        <div className="min-h-[100vh] flex flex-col items-center">
          <div className="rounded-sm border border-stroke w-full max-w-2xl text-center bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6 mt-10">
            <h2 className="text-lg font-bold mb-5">Upload Pictures for Product</h2>

            {product && (
              <div className="mb-5">
                <p className="text-sm font-semibold">Product Name: <span className="text-gray-600">{product.name}</span></p>
                <p className="text-sm font-semibold">Item Code: <span className="text-gray-600">{product.itemCode}</span></p>
              </div>
            )}

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-100 file:text-rose-600 hover:file:bg-rose-200"
            />

            <button
              onClick={handleUpload}
              className="mt-5 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-4 rounded transition duration-300"
            >
              Upload Pictures
            </button>

            {totalImages > 0 && (
              <div className="mt-5 w-full">
                <div className="flex justify-between text-sm mb-1">
                  <span>Uploading: {uploadedCount}/{totalImages} images</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-3 w-full bg-gray-200 rounded">
                  <div
                    style={{ width: `${uploadProgress}%` }}
                    className="h-full bg-rose-500 rounded transition-all duration-300"
                  ></div>
                </div>
              </div>
            )}

            {selectedImages.length > 0 && (
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`preview-${index}`}
                      className="w-full h-auto rounded-md"
                    />
                    <div className="absolute top-0 right-0 p-2 bg-black bg-opacity-50 text-white text-xs rounded-full cursor-pointer"
                      onClick={() => setSelectedImages((prevImages) => prevImages.filter((_, i) => i !== index))}
                    >
                      X
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DefaultLayout>
    </Menu>
  );
}else{
  return(
    <LoginPage />
  )
}
};

export default UploadPictures;
