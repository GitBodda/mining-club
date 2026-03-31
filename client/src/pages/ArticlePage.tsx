import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollAwareStatusBar } from "@/components/ScrollAwareStatusBar";
import { safeAreaTop } from "@/lib/nativeServices";

interface Article {
  id: string;
  title: string;
  description: string;
  icon?: string;
  image?: string;
  createdAt: string;
}

export function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const { data: article, isLoading, error } = useQuery<Article>({
    queryKey: [`/api/articles/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/articles/${id}`);
      if (!res.ok) throw new Error('Article not found');
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
        <Button onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ScrollAwareStatusBar />
      {/* Fixed navigation bar — always visible */}
      <header className="fixed top-0 left-0 right-0 z-[50] bg-card/80 backdrop-blur-lg border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center">
          <motion.button
            onClick={() => navigate("/")}
            className="w-11 h-11 rounded-2xl liquid-glass flex items-center justify-center hover-elevate transition-all mr-3"
            whileTap={{ scale: 0.95 }}
            type="button"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div className="flex items-center gap-3 flex-1">
            {article.icon && <span className="text-2xl">{article.icon}</span>}
            <h1 className="font-bold text-lg truncate">{article.title}</h1>
          </div>
        </div>
      </header>

      {/* Article Content */}
      <main className="max-w-4xl mx-auto px-4 py-8" style={{ paddingTop: `calc(3.5rem + ${safeAreaTop} + 2rem)` }}>
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="prose prose-slate dark:prose-invert max-w-none"
        >
          {/* Featured Image */}
          {article.image && (
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-64 object-cover rounded-xl mb-8"
            />
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold mb-6 flex items-center gap-3">
            {article.icon && <span className="text-4xl">{article.icon}</span>}
            {article.title}
          </h1>

          {/* Content with HTML support */}
          <div
            className="text-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: article.description }}
          />

          {/* Back Button */}
          <div className="mt-12 pt-8 border-t border-border">
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </motion.article>
      </main>
    </div>
  );
}
