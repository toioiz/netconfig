import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ConfigViewerProps {
  config: string;
  title?: string;
}

export function ConfigViewer({ config, title }: ConfigViewerProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(config);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "Configuration has been copied.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = config.split("\n");

  return (
    <div className="rounded-md border bg-card">
      {title && (
        <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
          <h3 className="text-sm font-medium">{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
            data-testid="button-copy-config"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>
      )}
      <div className="max-h-96 overflow-auto">
        <pre className="p-4 text-sm">
          <code className="font-mono">
            {lines.map((line, index) => (
              <div key={index} className="flex">
                <span className="mr-4 inline-block w-8 select-none text-right text-muted-foreground">
                  {index + 1}
                </span>
                <span className="flex-1">{line || " "}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
