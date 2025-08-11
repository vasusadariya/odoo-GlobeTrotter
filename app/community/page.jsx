"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Search, Filter, ArrowUpDown, Plus } from "lucide-react";
import Button from '../../components/ui/Button_1';

const TAGS = [
  "solo travel", "family", "culture", "adventure", "budget", 
  "luxury", "nature", "food", "photography", "village", "city", "beach"
];

export default function CommunityPage() {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("latest");
  const [selectedTags, setSelectedTags] = useState([]);
  const [isTagsDropdownOpen, setIsTagsDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  
  const sortDropdownRef = useRef(null);
  const tagsDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setIsSortDropdownOpen(false);
      }
      if (tagsDropdownRef.current && !tagsDropdownRef.current.contains(event.target)) {
        setIsTagsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [sortOrder, selectedTags]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let url = `/api/community?sort=${sortOrder}`;
      
      if (selectedTags.length > 0) {
        url += `&tags=${selectedTags.join(",")}`;
      }
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      
      const data = await response.json();
      setPosts(data.posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPosts();
  };

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchPosts();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleTagToggle = (tag) => {
    setSelectedTags(prevTags => 
      prevTags.includes(tag)
        ? prevTags.filter(t => t !== tag)
        : [...prevTags, tag]
    );
  };

  const handleSortChange = (order) => {
    setSortOrder(order);
    setIsSortDropdownOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Community Posts</h1>
        
        {status === "authenticated" && (
          <Link href="/community/create">
            <Button variant="primary" className="flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Create Post
            </Button>
          </Link>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <form onSubmit={handleSearch} className="w-full md:w-2/3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search posts..."
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <button 
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-600 hover:text-primary-800"
            >
              Search
            </button>
          </div>
        </form>

        <div className="flex gap-2">
          {/* Sort Dropdown */}
          <div className="relative" ref={sortDropdownRef}>
            <Button
              variant="outline"
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              className="flex items-center"
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              {sortOrder === "latest" ? "Latest" : "Oldest"}
            </Button>
            
            {isSortDropdownOpen && (
              <div className="absolute right-0 z-10 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg">
                <div className="py-1">
                  <button
                    className={`block px-4 py-2 text-sm w-full text-left ${
                      sortOrder === "latest" ? "bg-gray-100" : ""
                    }`}
                    onClick={() => handleSortChange("latest")}
                  >
                    Latest
                  </button>
                  <button
                    className={`block px-4 py-2 text-sm w-full text-left ${
                      sortOrder === "oldest" ? "bg-gray-100" : ""
                    }`}
                    onClick={() => handleSortChange("oldest")}
                  >
                    Oldest
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tags Filter Dropdown */}
          <div className="relative" ref={tagsDropdownRef}>
            <Button
              variant="outline"
              onClick={() => setIsTagsDropdownOpen(!isTagsDropdownOpen)}
              className={`flex items-center ${selectedTags.length > 0 ? 'text-primary-600 border-primary-600' : ''}`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter {selectedTags.length > 0 && `(${selectedTags.length})`}
            </Button>
            
            {isTagsDropdownOpen && (
              <div className="absolute right-0 z-10 mt-2 w-60 bg-white border border-gray-200 rounded-md shadow-lg">
                <div className="py-1 px-2">
                  <div className="mb-2 px-2 py-1 text-sm font-medium text-gray-700">
                    Filter by tags:
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {TAGS.map((tag) => (
                      <label key={tag} className="flex items-center px-2 py-1 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag)}
                          onChange={() => handleTagToggle(tag)}
                          className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{tag}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between">
                    <button
                      className="text-sm text-gray-500 hover:text-gray-700"
                      onClick={() => setSelectedTags([])}
                    >
                      Clear all
                    </button>
                    <button
                      className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                      onClick={() => setIsTagsDropdownOpen(false)}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="bg-gray-100 rounded-lg overflow-hidden h-64 animate-pulse"></div>
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {posts.map((post) => (
            <Link key={post._id} href={`/community/post/${post._id}`} className="group">
              <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="aspect-w-16 aspect-h-9 relative h-48">
                  <Image 
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 line-clamp-2 mb-1 group-hover:text-primary-600">
                    {post.title}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span 
                        key={tag} 
                        className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {post.tags.length > 2 && (
                      <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                        +{post.tags.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
          <p className="text-gray-500">
            {selectedTags.length > 0 || searchTerm 
              ? "Try adjusting your search or filters"
              : "Be the first one to create a post"}
          </p>
          {status === "authenticated" && (
            <Link href="/community/create">
              <Button variant="primary" className="mt-4">Create a Post</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}