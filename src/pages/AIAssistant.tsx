
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/Spinner";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const AIAssistant = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("generate");
  
  // État pour l'entrée utilisateur
  const [prompt, setPrompt] = useState("");
  const [contentTitle, setContentTitle] = useState("");
  const [contentType, setContentType] = useState("general");
  const [tone, setTone] = useState("professionnel");
  const [length, setLength] = useState("moyen");
  
  // État pour le contenu généré
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Requête pour charger les contenus sauvegardés
  const { data: savedContents, isLoading: isLoadingSaved } = useQuery({
    queryKey: ['ai-contents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_contents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Mutation pour sauvegarder un contenu
  const saveContentMutation = useMutation({
    mutationFn: async ({ title, content, type }) => {
      const { data, error } = await supabase
        .from('ai_contents')
        .insert({
          user_id: user?.id,
          title,
          content,
          type,
        })
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Contenu sauvegardé avec succès");
      queryClient.invalidateQueries({ queryKey: ['ai-contents'] });
      setContentTitle("");
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la sauvegarde: ${error.message}`);
    }
  });

  // Mutation pour supprimer un contenu
  const deleteContentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_contents')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contenu supprimé");
      queryClient.invalidateQueries({ queryKey: ['ai-contents'] });
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    }
  });

  // Fonction pour générer du contenu
  const generateContent = async () => {
    if (!prompt.trim()) {
      toast.error("Veuillez entrer une demande");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('https://jcznmyitjnwdimmjypki.supabase.co/functions/v1/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.session()?.access_token}`,
        },
        body: JSON.stringify({ 
          prompt, 
          type: contentType,
          tone,
          length
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      
      setGeneratedContent(data.generatedText);
    } catch (error: any) {
      console.error("Erreur lors de la génération:", error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Fonction pour sauvegarder un contenu
  const handleSaveContent = () => {
    if (!contentTitle.trim()) {
      toast.error("Veuillez entrer un titre pour le contenu");
      return;
    }

    if (!generatedContent.trim()) {
      toast.error("Aucun contenu à sauvegarder");
      return;
    }

    saveContentMutation.mutate({
      title: contentTitle,
      content: generatedContent,
      type: contentType
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assistant IA</h1>
          <p className="text-muted-foreground">
            Générez du contenu avec l'aide de l'intelligence artificielle
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full md:w-auto grid-cols-2">
          <TabsTrigger value="generate">Générer du contenu</TabsTrigger>
          <TabsTrigger value="saved">Contenus sauvegardés</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Générateur de contenu</CardTitle>
              <CardDescription>
                Décrivez ce que vous souhaitez générer, et l'IA vous proposera un contenu adapté.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="content-type">Type de contenu</Label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger id="content-type">
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Général</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="proposition">Proposition commerciale</SelectItem>
                      <SelectItem value="rapport">Rapport</SelectItem>
                      <SelectItem value="lettre">Lettre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tone">Ton</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger id="tone">
                      <SelectValue placeholder="Sélectionnez un ton" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professionnel">Professionnel</SelectItem>
                      <SelectItem value="amical">Amical</SelectItem>
                      <SelectItem value="formel">Formel</SelectItem>
                      <SelectItem value="persuasif">Persuasif</SelectItem>
                      <SelectItem value="informel">Informel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="length">Longueur</Label>
                  <Select value={length} onValueChange={setLength}>
                    <SelectTrigger id="length">
                      <SelectValue placeholder="Sélectionnez une longueur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="court">Court</SelectItem>
                      <SelectItem value="moyen">Moyen</SelectItem>
                      <SelectItem value="long">Long</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="prompt">Votre demande</Label>
                <Textarea 
                  id="prompt"
                  placeholder="Décrivez ce que vous souhaitez générer..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
              
              <Button 
                onClick={generateContent}
                disabled={isGenerating || !prompt.trim()}
                className="w-full"
              >
                {isGenerating ? <Spinner className="mr-2" /> : null}
                {isGenerating ? "Génération en cours..." : "Générer du contenu"}
              </Button>
            </CardContent>
          </Card>

          {generatedContent && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Contenu généré</CardTitle>
                  <CardDescription>
                    Modifiez le texte selon vos besoins avant de l'enregistrer
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre du contenu</Label>
                  <Input 
                    id="title"
                    placeholder="Entrez un titre pour sauvegarder ce contenu"
                    value={contentTitle}
                    onChange={(e) => setContentTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="generated">Contenu</Label>
                  <Textarea 
                    id="generated"
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                    className="min-h-[300px]"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSaveContent} 
                  disabled={!contentTitle.trim() || !generatedContent.trim() || saveContentMutation.isPending}
                  className="w-full"
                >
                  {saveContentMutation.isPending ? <Spinner className="mr-2" /> : null}
                  {saveContentMutation.isPending ? "Sauvegarde..." : "Sauvegarder ce contenu"}
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="saved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contenus sauvegardés</CardTitle>
              <CardDescription>
                Historique de vos contenus générés et sauvegardés
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSaved ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : savedContents && savedContents.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Titre</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date de création</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {savedContents.map((content) => (
                        <TableRow key={content.id}>
                          <TableCell className="font-medium">{content.title}</TableCell>
                          <TableCell>{content.type}</TableCell>
                          <TableCell>
                            {format(new Date(content.created_at), 'dd/MM/yyyy HH:mm')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  // Ouvrir le contenu dans l'onglet de génération
                                  setActiveTab("generate");
                                  setContentTitle(content.title);
                                  setGeneratedContent(content.content);
                                  setContentType(content.type || "general");
                                }}
                              >
                                Éditer
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => deleteContentMutation.mutate(content.id)}
                                disabled={deleteContentMutation.isPending}
                              >
                                Supprimer
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun contenu sauvegardé trouvé.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAssistant;
