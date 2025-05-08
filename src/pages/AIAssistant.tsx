
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/Spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface AIContent {
  id: string;
  title: string;
  content: string;
  type: string;
  created_at: string;
  updated_at: string;
}

const AIAssistant = () => {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState("general");
  const queryClient = useQueryClient();

  // Fetch existing AI contents
  const { data: aiContents, isLoading: isLoadingContents } = useQuery({
    queryKey: ["ai-contents"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("ai_contents")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        toast.error("Erreur lors du chargement des contenus");
        throw error;
      }
      
      return data as AIContent[];
    },
  });

  // Generate content mutation
  const { mutate: generateContent, isPending: isGenerating } = useMutation({
    mutationFn: async () => {
      if (!prompt || !title) {
        toast.error("Veuillez saisir un titre et une requête");
        return;
      }
      
      try {
        const response = await fetch("/api/generate-content", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ prompt, contentType }),
        });
        
        if (!response.ok) {
          throw new Error("Erreur lors de la génération du contenu");
        }
        
        const data = await response.json();
        
        // Save to Supabase
        const { error } = await supabase.from("ai_contents").insert({
          title,
          content: data.content,
          type: contentType,
          user_id: user?.id,
        });
        
        if (error) throw error;
        
        return { title, content: data.content, type: contentType };
      } catch (error) {
        console.error("Error generating content:", error);
        toast.error("Erreur lors de la génération du contenu");
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Contenu généré avec succès");
      setPrompt("");
      setTitle("");
      queryClient.invalidateQueries({ queryKey: ["ai-contents"] });
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erreur lors de la génération du contenu");
    },
  });

  // Delete content mutation
  const { mutate: deleteContent } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ai_contents")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      toast.success("Contenu supprimé avec succès");
      queryClient.invalidateQueries({ queryKey: ["ai-contents"] });
    },
    onError: () => {
      toast.error("Erreur lors de la suppression du contenu");
    },
  });

  const handleGenerateContent = () => {
    generateContent();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Assistant IA</h1>
      <p className="text-muted-foreground">
        Générez du contenu pour vos projets, factures, ou autres besoins avec notre assistant IA.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Générer du contenu</CardTitle>
          <CardDescription>
            Décrivez ce que vous souhaitez générer et notre IA créera le contenu pour vous.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <label htmlFor="title" className="text-sm font-medium">Titre</label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre du contenu"
              disabled={isGenerating}
            />
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="contentType" className="text-sm font-medium">Type de contenu</label>
            <Select value={contentType} onValueChange={setContentType} disabled={isGenerating}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">Général</SelectItem>
                <SelectItem value="invoice">Facture</SelectItem>
                <SelectItem value="project">Projet</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="prompt" className="text-sm font-medium">Requête</label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Décrivez ce que vous souhaitez générer..."
              disabled={isGenerating}
              rows={4}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleGenerateContent} 
            disabled={isGenerating || !prompt || !title}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Génération en cours...
              </>
            ) : (
              "Générer le contenu"
            )}
          </Button>
        </CardFooter>
      </Card>

      <h2 className="text-2xl font-bold mt-8">Mes contenus générés</h2>
      {isLoadingContents ? (
        <div className="flex justify-center p-8">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {aiContents && aiContents.length > 0 ? (
            aiContents.map((content) => (
              <Card key={content.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span>{content.title}</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteContent(content.id)}
                    >
                      Supprimer
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Type: {content.type} • {new Date(content.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-40 overflow-y-auto whitespace-pre-wrap text-sm">
                    {content.content}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-2">
              <CardContent className="p-8 text-center text-muted-foreground">
                Aucun contenu généré. Utilisez le formulaire ci-dessus pour créer votre premier contenu.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
