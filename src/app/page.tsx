"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Zap, BookOpen, BarChart, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Landing() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [uploading, setUploading] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Document uploaded successfully!');
      router.push(`/reader/${response.data.id}`);
    } catch (error) {
      console.error('Upload error:', error);
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    multiple: false,
  });

  return (
    <div className="min-h-screen hero-gradient">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-manrope font-bold">FlowRead</h1>
          </motion.div>

          <div className="flex items-center gap-4">
            <Button
              data-testid="library-nav-button"
              variant="ghost"
              onClick={() => router.push('/library')}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Library
            </Button>
            <Button
              data-testid="theme-toggle-button"
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-6 pt-32 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <h2 className="text-6xl md:text-8xl font-manrope font-bold tracking-tight mb-6">
            Read at the
            <br />
            <span className="text-primary">Speed of Thought</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Boost your reading speed with color-coded syllables and advanced reading techniques.
            Train your brain to process text faster than ever before.
          </p>

          {/* Upload Zone */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card
              {...getRootProps()}
              data-testid="file-upload-zone"
              className={`
                p-12 cursor-pointer border-2 border-dashed transition-all duration-200
                ${isDragActive
                  ? 'border-primary bg-primary/5 scale-105'
                  : 'border-border hover:border-primary/50 hover:bg-accent/50'
                }
                ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input {...getInputProps()} disabled={uploading} />
              <Upload className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h3 className="text-2xl font-manrope font-semibold mb-2">
                {uploading ? 'Uploading...' : isDragActive ? 'Drop your file here' : 'Upload Your Document'}
              </h3>
              <p className="text-muted-foreground">
                Drag & drop or click to upload PDF, DOCX, or TXT files
              </p>
            </Card>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-20"
        >
          <Card className="p-6 backdrop-blur-xl bg-card/50 border-border/50">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-manrope font-semibold mb-2">Speed Control</h3>
            <p className="text-muted-foreground">
              Adjust reading speed from 50-1000 WPM in real-time while maintaining comprehension.
            </p>
          </Card>

          <Card className="p-6 backdrop-blur-xl bg-card/50 border-border/50">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-manrope font-semibold mb-2">Color Patterns</h3>
            <p className="text-muted-foreground">
              Multiple preset patterns plus custom colors to optimize your reading experience.
            </p>
          </Card>

          <Card className="p-6 backdrop-blur-xl bg-card/50 border-border/50">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <BarChart className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-manrope font-semibold mb-2">Track Progress</h3>
            <p className="text-muted-foreground">
              Monitor your reading statistics, bookmarks, and improvement over time.
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
