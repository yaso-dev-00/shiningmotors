"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { X, Camera, Video, MapPin, Tag, Smile } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { Layout } from "@/components/Layout";

const CreatePost = () => {
  const { toast } = useToast();
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [postContent, setPostContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<
    { file: File; preview: string; type: "image" | "video" }[]
  >([]);
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newMediaFiles = files.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith("image/")
          ? ("image" as const)
          : ("video" as const),
      }));
      setMediaFiles((prev) => [...prev, ...newMediaFiles]);
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags((prev) => [...prev, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate post content
    if (!postContent.trim() && mediaFiles.length === 0) {
      toast({
        title: "Empty Post",
        description: "Please add some text or media to your post.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Post Created!",
      description: "Your post has been published successfully.",
    });

    // Redirect to the social page after posting
    router.push("/social" as any);
  };

  return (
    <Layout>
      {/* <Header /> */}

      <main className="container mx-auto px-4 pb-20 pt-6">
        <div className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow">
          <h1 className="mb-6 text-2xl font-bold">Create Post</h1>

          <form onSubmit={handleSubmit}>
            <div className="mb-6 flex">
              <Avatar className="mr-4 h-10 w-10">
                <img
                  src="https://i.pravatar.cc/150?img=68"
                  alt="User"
                  className="h-full w-full object-cover"
                />
              </Avatar>
              <Textarea
                placeholder="What's on your mind?"
                className="min-h-[120px] resize-none"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
              />
            </div>

            {/* Media Preview */}
            {mediaFiles.length > 0 && (
              <div className="mb-6">
                <h2 className="mb-2 text-sm font-semibold text-gray-700">
                  Media
                </h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {mediaFiles.map((media, index) => (
                    <div
                      key={index}
                      className="group relative aspect-square overflow-hidden rounded-md"
                    >
                      {media.type === "image" ? (
                        <img
                          src={media.preview}
                          alt={`Media ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <video
                          src={media.preview}
                          className="h-full w-full object-cover"
                          controls
                        />
                      )}
                      <button
                        type="button"
                        className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => handleRemoveMedia(index)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location Input */}
            <div className="mb-6">
              <div className="flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-gray-500" />
                <Input
                  placeholder="Add location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="border-0 p-0 shadow-none focus-visible:ring-0"
                />
              </div>
            </div>

            {/* Tags Input */}
            <div className="mb-6">
              <div className="flex items-center">
                <Tag className="mr-2 h-5 w-5 text-gray-500" />
                <div className="flex grow flex-wrap items-center gap-2">
                  {tags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center rounded-full bg-gray-100 px-3 py-1"
                    >
                      <span className="text-sm">#{tag}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-4 w-4 p-0"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  ))}
                  <div className="flex">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add tags"
                      className="border-0 p-0 text-sm focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    {tagInput && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-1 p-0"
                        onClick={handleAddTag}
                      >
                        Add
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Hidden file inputs */}
            <input
              type="file"
              ref={imageInputRef}
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
            />
            <input
              type="file"
              ref={videoInputRef}
              className="hidden"
              accept="video/*"
              onChange={handleImageSelect}
            />

            {/* Action Buttons */}
            <div className="mb-6 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex items-center"
                onClick={() => imageInputRef.current?.click()}
              >
                <Camera className="mr-2 h-4 w-4" /> Photo
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex items-center"
                onClick={() => videoInputRef.current?.click()}
              >
                <Video className="mr-2 h-4 w-4" /> Video
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex items-center"
              >
                <Smile className="mr-2 h-4 w-4" /> Feeling/Activity
              </Button>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" className="bg-sm-red hover:bg-sm-red-light">
                Post
              </Button>
            </div>
          </form>
        </div>
      </main>

      {/* <BottomNav activeItem="home" /> */}
      <Footer />
    </Layout>
  );
};

export default CreatePost;
