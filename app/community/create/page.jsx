"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Image as ImageIcon, Loader, X } from "lucide-react";
import Button from '../../../components/ui/Button_1';
import dynamic from "next/dynamic";
import Image from "next/image";

// Import the rich text editor component dynamically to prevent SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

const TAGS = [
  "solo travel", "family", "culture", "adventure", "budget", 
  "luxury", "nature", "food", "photography", "village", "city", "beach"
];

export default function CreatePostPage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/auth/login?callbackUrl=/community/create");
    },
  });

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    coverImage: "",
    tags: [],
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader className="w-8 h-8 animate-spin text-primary-600" />
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleContentChange = (content) => {
    setFormData({ ...formData, content });
    
    // Clear error when typing
    if (errors.content) {
      setErrors({ ...errors, content: null });
    }
  };

  const handleTagToggle = (tag) => {
    const updatedTags = formData.tags.includes(tag)
      ? formData.tags.filter((t) => t !== tag)
      : [...formData.tags, tag];
    
    setFormData({ ...formData, tags: updatedTags });
    
    // Clear error when selecting tags
    if (errors.tags) {
      setErrors({ ...errors, tags: null });
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors({ 
        ...errors, 
        coverImage: "Please select an image file (PNG, JPG, JPEG)" 
      });
      return;
    }

    // Max file size: 5MB
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ 
        ...errors, 
        coverImage: "Image size must be less than 5MB" 
      });
      return;
    }

    try {
      setUploadingImage(true);
      
      // Create form data for Cloudinary upload
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("upload_preset", "mindbend_alumni_gallery"); 
      
      // Upload image to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dsh447lvk/image/upload`, 
        {
          method: "POST",
          body: uploadData,
        }
      );
      
      if (!response.ok) {
        throw new Error("Image upload failed");
      }
      
      const data = await response.json();
      
      // Update form with secure image URL
      setFormData((prevData) => ({ ...prevData, coverImage: data.secure_url }));
      
      // Clear any previous errors
      if (errors.coverImage) {
        setErrors({ ...errors, coverImage: null });
      }
    } catch (error) {
      console.error("Image upload error:", error);
      setErrors({ ...errors, coverImage: "Failed to upload image. Please try again." });
    } finally {
      setUploadingImage(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title?.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }
    
    if (!formData.content?.trim()) {
      newErrors.content = "Content is required";
    } else if (formData.content.replace(/<[^>]*>/g, "").length < 10) {
      newErrors.content = "Content must be at least 10 characters";
    }
    
    if (!formData.coverImage) {
      newErrors.coverImage = "Cover image is required";
    }
    
    if (!formData.tags?.length) {
      newErrors.tags = "Please select at least one tag";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch("/api/community", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create post");
      }
      
      const data = await response.json();
      
      // Redirect to the new post
      router.push(`/community/post/${data.postId}`);
    } catch (error) {
      console.error("Submit error:", error);
      setErrors({ ...errors, submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Post</h1>
        <p className="text-gray-600 mt-2">
          Share your travel experiences with the community
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Cover Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cover Image*
          </label>
          
          {!formData.coverImage ? (
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors
                ${errors.coverImage ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />
              
              <div className="space-y-2">
                {uploadingImage ? (
                  <div className="flex flex-col items-center">
                    <Loader className="w-8 h-8 animate-spin text-primary-600" />
                    <p className="text-sm text-gray-500 mt-2">Uploading image...</p>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="w-10 h-10 mx-auto text-gray-400" />
                    <p className="text-sm text-gray-500">
                      Click to upload a cover image for your post
                    </p>
                    <p className="text-xs text-gray-400">
                      PNG, JPG, JPEG (max 5MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
                <Image 
                  src={formData.coverImage} 
                  alt="Cover preview" 
                  width={800} 
                  height={450} 
                  className="object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, coverImage: "" }))}
                className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {errors.coverImage && (
            <p className="mt-1 text-sm text-red-600">{errors.coverImage}</p>
          )}
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title*
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors
              ${errors.title ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-200 focus:border-primary-500'}`}
            placeholder="Enter a compelling title for your post"
            maxLength={100}
          />
          <div className="mt-1 flex justify-between">
            {errors.title ? (
              <p className="text-sm text-red-600">{errors.title}</p>
            ) : (
              <span className="text-xs text-gray-400">
                Be descriptive and engaging
              </span>
            )}
            <span className="text-xs text-gray-400">
              {formData.title ? formData.title.length : 0}/100
            </span>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags* (Select at least one)
          </label>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagToggle(tag)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors
                  ${formData.tags.includes(tag)
                    ? 'bg-primary-100 text-primary-800 border-primary-200 border'
                    : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                  }`}
              >
                {tag}
              </button>
            ))}
          </div>
          {errors.tags && (
            <p className="mt-1 text-sm text-red-600">{errors.tags}</p>
          )}
        </div>

        {/* Content - Rich Text Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content*
          </label>
          <div className={`border rounded-lg overflow-hidden transition-colors
            ${errors.content ? 'border-red-300' : 'border-gray-300'}`}>
            <ReactQuill
              value={formData.content}
              onChange={handleContentChange}
              placeholder="Share your travel story here..."
              theme="snow"
              modules={{
                toolbar: [
                  [{ header: [1, 2, 3, false] }],
                  ["bold", "italic", "underline", "strike"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["link", "image"],
                  ["clean"],
                ],
              }}
              className="h-64"
            />
          </div>
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content}</p>
          )}
        </div>

        {/* Form Error */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errors.submit}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <Loader className="w-4 h-4 animate-spin mr-2" />
                Posting...
              </div>
            ) : (
              "Publish Post"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}