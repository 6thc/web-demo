import { Card, CardContent } from "../ui/card";

interface PlaceholderScreenProps {
  title: string;
  description: string;
}

export function PlaceholderScreen({ title, description }: PlaceholderScreenProps) {
  return (
    <div className="bg-muted/30 min-h-screen pb-20">
      <div className="px-4 pt-8 pb-4">
        <h1 className="text-2xl font-semibold mb-2">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      
      <div className="px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
              <div className="w-8 h-8 bg-muted-foreground/20 rounded-full"></div>
            </div>
            <h3 className="font-medium mb-2">Coming Soon</h3>
            <p className="text-sm text-muted-foreground">
              This feature is currently under development and will be available soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}