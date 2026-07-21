import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { resolveBurgerImage } from "@/data/burgers";

interface AdminBurger {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  ingredients: string[];
  sort_order: number;
  is_active: boolean;
}

interface Props {
  sessionToken: string;
  onSessionExpired: () => void;
}

const blankDraft = {
  name: "",
  description: "",
  price: 0,
  image_url: "",
  ingredients: "",
  sort_order: 999,
};

export const AdminBurgerManager = ({ sessionToken, onSessionExpired }: Props) => {
  const { toast } = useToast();
  const [burgers, setBurgers] = useState<AdminBurger[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | "new" | null>(null);
  const [uploadingId, setUploadingId] = useState<number | "new" | null>(null);
  const [drafts, setDrafts] = useState<Record<number, AdminBurger>>({});
  const [newDraft, setNewDraft] = useState({ ...blankDraft });

  const invoke = async (action: string, payload: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke("admin-manage-burgers", {
      body: { token: sessionToken, action, ...payload },
    });
    if (error || !data?.success) {
      const msg = data?.error || error?.message || "Request failed";
      if (msg.toLowerCase().includes("session") || msg.toLowerCase().includes("expired")) {
        onSessionExpired();
      }
      throw new Error(msg);
    }
    return data;
  };

  const fetchBurgers = async () => {
    setLoading(true);
    try {
      const data = await invoke("list");
      setBurgers(data.burgers || []);
      const map: Record<number, AdminBurger> = {};
      (data.burgers || []).forEach((b: AdminBurger) => { map[b.id] = { ...b }; });
      setDrafts(map);
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => { fetchBurgers(); /* eslint-disable-next-line */ }, []);

  const fileToBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleUpload = async (id: number | "new", file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB", variant: "destructive" });
      return;
    }
    setUploadingId(id);
    try {
      const base64 = await fileToBase64(file);
      const data = await invoke("upload-image", { fileBase64: base64, contentType: file.type });
      if (id === "new") {
        setNewDraft((d) => ({ ...d, image_url: data.url }));
      } else {
        setDrafts((d) => ({ ...d, [id]: { ...d[id], image_url: data.url } }));
      }
      toast({ title: "Image uploaded" });
    } catch (e) {
      toast({ title: "Upload failed", description: e instanceof Error ? e.message : "Error", variant: "destructive" });
    }
    setUploadingId(null);
  };

  const handleSave = async (id: number) => {
    const d = drafts[id];
    if (!d) return;
    setSavingId(id);
    try {
      await invoke("update", {
        id,
        name: d.name,
        description: d.description,
        price: d.price,
        image_url: d.image_url,
        ingredients: d.ingredients,
        sort_order: d.sort_order,
      });
      toast({ title: "Saved", description: `${d.name} updated.` });
      fetchBurgers();
    } catch (e) {
      toast({ title: "Save failed", description: e instanceof Error ? e.message : "Error", variant: "destructive" });
    }
    setSavingId(null);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await invoke("delete", { id });
      toast({ title: "Deleted", description: `${name} removed.` });
      fetchBurgers();
    } catch (e) {
      toast({ title: "Delete failed", description: e instanceof Error ? e.message : "Error", variant: "destructive" });
    }
  };

  const handleCreate = async () => {
    if (!newDraft.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    setSavingId("new");
    try {
      await invoke("create", {
        name: newDraft.name,
        description: newDraft.description,
        price: newDraft.price,
        image_url: newDraft.image_url,
        ingredients: newDraft.ingredients.split(",").map((s) => s.trim()).filter(Boolean),
        sort_order: newDraft.sort_order,
      });
      toast({ title: "Burger added!" });
      setNewDraft({ ...blankDraft });
      fetchBurgers();
    } catch (e) {
      toast({ title: "Create failed", description: e instanceof Error ? e.message : "Error", variant: "destructive" });
    }
    setSavingId(null);
  };

  const updateDraft = (id: number, patch: Partial<AdminBurger>) => {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add new burger */}
      <div className="bg-card rounded-xl p-6 shadow-md border-2 border-dashed border-accent/40">
        <h3 className="text-lg font-bold text-card-foreground mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-accent" /> Add New Burger
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={newDraft.name} onChange={(e) => setNewDraft({ ...newDraft, name: e.target.value })} placeholder="Spicy Chicken Deluxe" />
            </div>
            <div>
              <Label>Price ($)</Label>
              <Input type="number" step="0.01" min="0" value={newDraft.price}
                onChange={(e) => setNewDraft({ ...newDraft, price: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={2} value={newDraft.description}
                onChange={(e) => setNewDraft({ ...newDraft, description: e.target.value })}
                placeholder="Short, mouthwatering description..." />
            </div>
            <div>
              <Label>Ingredients (comma-separated)</Label>
              <Input value={newDraft.ingredients}
                onChange={(e) => setNewDraft({ ...newDraft, ingredients: e.target.value })}
                placeholder="Brioche bun, Beef patty, Cheese, Lettuce" />
            </div>
          </div>
          <div className="space-y-3">
            <Label>Photo</Label>
            <div className="bg-muted rounded-lg p-4 flex flex-col items-center gap-3">
              {newDraft.image_url ? (
                <img src={newDraft.image_url} alt="preview" className="w-32 h-32 object-cover rounded-full" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-background flex items-center justify-center text-muted-foreground text-xs">No photo</div>
              )}
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload("new", e.target.files[0])} />
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-background border border-input rounded-md text-sm hover:bg-accent/10">
                  {uploadingId === "new" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Upload Photo
                </span>
              </label>
            </div>
          </div>
        </div>
        <Button onClick={handleCreate} disabled={savingId === "new"}
          className="mt-4 w-full gradient-accent text-accent-foreground font-bold">
          {savingId === "new" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add Burger
        </Button>
      </div>

      {/* Existing burgers */}
      {burgers.map((b) => {
        const d = drafts[b.id] || b;
        const previewImage = resolveBurgerImage(b.id, d.image_url);
        return (
          <div key={b.id} className="bg-card rounded-xl p-6 shadow-md border border-border">
            <div className="grid md:grid-cols-[160px_1fr] gap-6">
              <div className="flex flex-col items-center gap-3">
                <img src={previewImage} alt={d.name} className="w-32 h-32 object-cover rounded-full" />
                <label className="cursor-pointer w-full">
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleUpload(b.id, e.target.files[0])} />
                  <span className="w-full inline-flex justify-center items-center gap-2 px-3 py-2 bg-background border border-input rounded-md text-xs hover:bg-accent/10">
                    {uploadingId === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    Change Photo
                  </span>
                </label>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
                  <div>
                    <Label>Name</Label>
                    <Input value={d.name} onChange={(e) => updateDraft(b.id, { name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Price ($)</Label>
                    <Input type="number" step="0.01" min="0" value={d.price}
                      onChange={(e) => updateDraft(b.id, { price: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea rows={2} value={d.description}
                    onChange={(e) => updateDraft(b.id, { description: e.target.value })} />
                </div>
                <div>
                  <Label>Ingredients (comma-separated)</Label>
                  <Input value={d.ingredients.join(", ")}
                    onChange={(e) => updateDraft(b.id, { ingredients: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => handleSave(b.id)} disabled={savingId === b.id}
                    className="bg-green-600 hover:bg-green-700 text-white flex-1">
                    {savingId === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => handleDelete(b.id, b.name)}
                    className="text-red-600 border-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
