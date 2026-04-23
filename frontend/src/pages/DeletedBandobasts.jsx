import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Trash2, RotateCcw, Trash, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

export default function DeletedBandobasts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    const { data } = await api.get("/bandobasts/deleted");
    setItems(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const restore = async (id) => {
    await api.post(`/bandobasts/${id}/restore`);
    toast.success("Restored");
    load();
  };
  const purge = async (id) => {
    if (!window.confirm("Permanently delete this bandobast? This cannot be undone.")) return;
    await api.delete(`/bandobasts/${id}/permanent`);
    toast.success("Permanently deleted");
    load();
  };

  return (
    <div className="max-w-[1600px] mx-auto" data-testid="deleted-page">
      <button onClick={() => navigate("/")} className="text-sm text-[#6B7280] hover:text-[#2E3192] flex items-center gap-1 mb-2">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-3xl sm:text-4xl tracking-tight">Deleted Bandobasts</h1>
          <p className="mt-1 text-sm text-[#6B7280]">Soft-deleted bandobasts. Restore or permanently remove.</p>
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-md shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-[#F9FAFB]">
            <TableRow>
              <TableHead>Year</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-[#6B7280]">Loading...</TableCell></TableRow>
            )}
            {!loading && items.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-[#6B7280]">No deleted bandobasts.</TableCell></TableRow>
            )}
            {items.map((b) => (
              <TableRow key={b.id} data-testid={`deleted-row-${b.id}`}>
                <TableCell className="font-semibold">{b.year}</TableCell>
                <TableCell>{new Date(b.date).toLocaleDateString()}</TableCell>
                <TableCell className="font-medium">{b.name}</TableCell>
                <TableCell>
                  <Badge className={b.status === "deployed" ? "bg-[#138808]/15 text-[#0E6306]" : "bg-gray-100 text-gray-800"}>
                    {b.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => restore(b.id)} data-testid={`restore-${b.id}`}>
                      <RotateCcw className="w-3 h-3 mr-1" /> Restore
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#DC2626] hover:bg-[#B91C1C] text-white"
                      onClick={() => purge(b.id)}
                      data-testid={`purge-${b.id}`}
                    >
                      <Trash className="w-3 h-3 mr-1" /> Delete Permanently
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
