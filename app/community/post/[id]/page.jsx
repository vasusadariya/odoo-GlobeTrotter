"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Clock, User, Eye, Tag as TagIcon, Loader } from "lucide-react";
import Button from "../../../../components/ui/Button_1";

export default function PostPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPostData = async () => {
      try {
        const response = await fetch(`/api/community/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Post not found");
          } else {
            throw new Error("Something went wrong");
          }
        }
        
        const data = await response.json();
        setPost(data.post);
        
        // Record view after a short delay
        setTimeout(() => {
          recordView();
        }, 5000);
      } catch (err) {
        console.error("Error fetching post:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPostData();
  }, [id]);

  const recordView = async () => {
    try {
      await fetch(`/api/community/${id}/view`, {
        method: "POST",
      });
    } catch (err) {
      console.error("Error recording view:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader className="w-8 h-8 animate-spin text-primary-600" />
          <p className="mt-2 text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">
            {error}
          </h2>
          <p className="text-red-600 mb-4">
            The post you're looking for might have been removed or doesn't exist.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push('/community')}
          >
            Return to Community
          </Button>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back button */}
      <Link href="/community">
        <Button variant="ghost" className="mb-6 hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Community
        </Button>
      </Link>

      {/* Post header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {post.title}
        </h1>
        
        <div className="flex flex-wrap items-center text-sm text-gray-500 gap-y-2">
          <div className="flex items-center mr-4">
            <User className="w-4 h-4 mr-1" />
            <span>{post.author?.name || "Unknown user"}</span>
          </div>
          
          <div className="flex items-center mr-4">
            <Clock className="w-4 h-4 mr-1" />
            <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
          </div>
          
          <div className="flex items-center">
            <Eye className="w-4 h-4 mr-1" />
            <span>{post.views} views</span>
          </div>
        </div>
      </div>

      {/* Cover image */}
      <div className="aspect-w-16 aspect-h-9 mb-8 rounded-lg overflow-hidden">
        <Image
          src={post.coverImage}
          alt={post.title}
          width={1200}
          height={675}
          className="object-cover"
          priority
        />
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-8">
        <TagIcon className="w-5 h-5 text-gray-400" />
        {post.tags.map((tag) => (
          <span
            key={tag}
            className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Post content */}
      <div 
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Author box */}
      <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-100">
        <div className="flex items-center">
          {post.author?.image ? (
            <Image
              src={post.author.image}
              alt={post.author.name}
              width={48}
              height={48}
              className="rounded-full"
            />
          ) : (
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary-600" />
            </div>
          )}
          
          <div className="ml-4">
            <h3 className="font-medium">
              {post.author?.name || "Unknown user"}
            </h3>
            <p className="text-sm text-gray-500">Community Member</p>
          </div>
        </div>
      </div>
    </div>
  );
}