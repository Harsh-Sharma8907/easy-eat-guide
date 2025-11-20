import { CheckCircle2, AlertTriangle, Info, Volume2, VolumeX } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { speakText, stopSpeaking } from '@/utils/textToSpeech';
import { useToast } from '@/components/ui/use-toast';

export interface Ingredient {
  name: string;
  status: 'good' | 'bad';
  explanation: string;
}

interface IngredientResultsProps {
  ingredients: Ingredient[];
}

export const IngredientResults = ({ ingredients }: IngredientResultsProps) => {
  const { toast } = useToast();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const goodIngredients = ingredients.filter((ing) => ing.status === 'good');
  const badIngredients = ingredients.filter((ing) => ing.status === 'bad');

  const generateSpeechText = () => {
    let text = 'Analysis complete. ';
    
    if (goodIngredients.length > 0) {
      text += `Found ${goodIngredients.length} good ingredient${goodIngredients.length > 1 ? 's' : ''}: `;
      text += goodIngredients.map(ing => ing.name).join(', ') + '. ';
    }
    
    if (badIngredients.length > 0) {
      text += `Found ${badIngredients.length} concerning ingredient${badIngredients.length > 1 ? 's' : ''}: `;
      text += badIngredients.map(ing => ing.name).join(', ') + '. ';
    }
    
    return text;
  };

  const handleSpeak = async () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    try {
      setIsSpeaking(true);
      const speechText = generateSpeechText();
      await speakText(speechText);
      setIsSpeaking(false);
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
      toast({
        title: 'Speech Error',
        description: 'Unable to play audio. Please check your browser settings.',
        variant: 'destructive',
      });
    }
  };

  // Auto-speak when results appear
  useEffect(() => {
    const autoSpeak = async () => {
      try {
        const speechText = generateSpeechText();
        await speakText(speechText);
      } catch (error) {
        console.error('Auto-speech error:', error);
      }
    };
    
    autoSpeak();
    
    return () => stopSpeaking();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center animate-scale-in">
        <div className="flex items-center justify-center gap-3 mb-2">
          <h2 className="text-2xl font-bold">Analysis Results</h2>
          <Button
            onClick={handleSpeak}
            variant="outline"
            size="icon"
            className="shadow-soft hover:shadow-card transition-smooth"
          >
            {isSpeaking ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-muted-foreground">
          {goodIngredients.length} good • {badIngredients.length} concerning
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Good Ingredients */}
        <Card className="p-6 bg-success-light border-success/20 shadow-card hover-scale transition-smooth">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <h3 className="text-lg font-semibold text-success">Good Ingredients</h3>
          </div>
          <div className="space-y-3">
            {goodIngredients.length > 0 ? (
              goodIngredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 bg-card rounded-lg border border-success/10 shadow-soft hover:shadow-card transition-smooth"
                >
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{ingredient.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{ingredient.explanation}</p>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{ingredient.explanation}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No good ingredients found</p>
            )}
          </div>
        </Card>

        {/* Bad Ingredients */}
        <Card className="p-6 bg-warning-light border-warning/20 shadow-card hover-scale transition-smooth">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <h3 className="text-lg font-semibold text-warning">Concerning Ingredients</h3>
          </div>
          <div className="space-y-3">
            {badIngredients.length > 0 ? (
              badIngredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 bg-card rounded-lg border border-warning/10 shadow-soft hover:shadow-card transition-smooth"
                >
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{ingredient.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{ingredient.explanation}</p>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{ingredient.explanation}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No concerning ingredients found</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
