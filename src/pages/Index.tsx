import { useState } from 'react';
import { Leaf, Loader2 } from 'lucide-react';
import { ImageUpload } from '@/components/ImageUpload';
import { IngredientResults, Ingredient } from '@/components/IngredientResults';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<Ingredient[] | null>(null);
  const { toast } = useToast();

  const analyzeIngredients = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setResults(null);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        try {
          const { data, error } = await supabase.functions.invoke('analyze-ingredients', {
            body: { image: base64Image },
          });

          if (error) throw error;

          setResults(data.ingredients);
          toast({
            title: 'Analysis Complete',
            description: `Found ${data.ingredients.length} ingredients`,
          });
        } catch (error: any) {
          console.error('Analysis error:', error);
          toast({
            title: 'Analysis Failed',
            description: error.message || 'Failed to analyze ingredients',
            variant: 'destructive',
          });
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(selectedImage);
    } catch (error) {
      console.error('Error reading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to read image file',
        variant: 'destructive',
      });
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-gradient-hero animate-fade-in">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm shadow-soft sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">EatWise</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!results ? (
          <div className="space-y-8 animate-fade-in">
            {/* Hero Section */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <h2 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent animate-scale-in">
                Know What You're Eating
              </h2>
              <p className="text-lg text-muted-foreground">
                Upload a photo of any ingredient list and get instant AI-powered insights about what's
                healthy and what to avoid
              </p>
            </div>

            {/* Upload Section */}
            <ImageUpload
              onImageSelect={setSelectedImage}
              selectedImage={selectedImage}
              onClear={() => setSelectedImage(null)}
            />

            {/* Analyze Button */}
            {selectedImage && (
              <div className="flex justify-center animate-scale-in">
                <Button
                  variant="hero"
                  size="lg"
                  onClick={analyzeIngredients}
                  disabled={isAnalyzing}
                  className="min-w-[200px] shadow-elegant hover-scale"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze Ingredients'
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <IngredientResults ingredients={results} />
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                size="lg" 
                onClick={handleReset}
                className="shadow-soft hover-scale"
              >
                Analyze Another Product
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>EatWise - Your nutrition coach for better food choices</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
