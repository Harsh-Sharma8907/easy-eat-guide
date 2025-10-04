import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface Ingredient {
  name: string;
  status: 'good' | 'bad';
  explanation: string;
}

interface IngredientResultsProps {
  ingredients: Ingredient[];
}

export const IngredientResults = ({ ingredients }: IngredientResultsProps) => {
  const goodIngredients = ingredients.filter((ing) => ing.status === 'good');
  const badIngredients = ingredients.filter((ing) => ing.status === 'bad');

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Analysis Results</h2>
        <p className="text-muted-foreground">
          {goodIngredients.length} good • {badIngredients.length} concerning
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Good Ingredients */}
        <Card className="p-6 bg-success-light border-success/20">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <h3 className="text-lg font-semibold text-success">Good Ingredients</h3>
          </div>
          <div className="space-y-3">
            {goodIngredients.length > 0 ? (
              goodIngredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 bg-card rounded-lg border border-success/10"
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
        <Card className="p-6 bg-warning-light border-warning/20">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <h3 className="text-lg font-semibold text-warning">Concerning Ingredients</h3>
          </div>
          <div className="space-y-3">
            {badIngredients.length > 0 ? (
              badIngredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 bg-card rounded-lg border border-warning/10"
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
