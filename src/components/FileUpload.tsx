import { useState } from "react";
import { Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';

interface FileUploadProps {
  onUploadComplete: () => void;
}

const FileUpload = ({ onUploadComplete }: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      let reviews: any[] = [];

      // Parse Excel, CSV or JSON
      if (file.name.endsWith('.json')) {
        const text = await file.text();
        reviews = JSON.parse(text);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        reviews = XLSX.utils.sheet_to_json(worksheet);
      } else if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const review: any = {};
          headers.forEach((header, index) => {
            review[header] = values[index];
          });
          reviews.push(review);
        }
      }

      // Insert reviews into database
      const reviewsData = reviews.map(r => ({
        product_name: r.product_name || r.productName || r.product || 'Unknown Product',
        review_text: r.review_text || r.reviewText || r.review || r.text || '',
        rating: parseInt(r.rating) || 5,
        sentiment: null,
        analyzed: false,
      }));

      const { error } = await supabase
        .from('reviews')
        .insert(reviewsData);

      if (error) throw error;

      toast({
        title: "Upload Successful",
        description: `Uploaded ${reviews.length} reviews successfully`,
      });

      onUploadComplete();
      
      // Reset input
      event.target.value = '';
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Failed to upload reviews. Please check the file format.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-primary/10 rounded-full">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-1">Upload Review Data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Support for Excel, CSV, and JSON files
            </p>
            <label htmlFor="file-upload">
              <Button disabled={isUploading} asChild>
                <span className="cursor-pointer gap-2">
                  <Upload className="h-4 w-4" />
                  {isUploading ? "Uploading..." : "Choose File"}
                </span>
              </Button>
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".csv,.json,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
          </div>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        <p className="font-semibold mb-2">Expected format:</p>
        <code className="block bg-muted p-2 rounded">
          Excel/CSV: product_name, review_text, rating<br />
          JSON: {`[{"product_name": "...", "review_text": "...", "rating": 5}]`}
        </code>
      </div>
    </div>
  );
};

export default FileUpload;
