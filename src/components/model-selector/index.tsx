import { buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { type ProviderId } from "../../../shared/providers";
import { useLastProvider } from "./hooks/use-last-provider";
import { useProviderStatuses } from "./hooks/use-provider-statuses";
import { useRecentModels } from "./hooks/use-recent-models";
import { useStarredModels } from "./hooks/use-starred-models";
import { ModelBrowser } from "./model-browser";
import { ProviderSidebar } from "./provider-sidebar";
import type { ModelSelectorProps } from "./types";

export function ModelSelector({
  models,
  selectedModelId,
  onValueChange,
  disabled = false,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { lastProvider, setLastProvider } = useLastProvider();
  const [selectedProvider, setSelectedProvider] = useState<ProviderId | null>(
    null,
  );
  const { starredModels, toggleStar } = useStarredModels();
  const { recentModelIds, addToRecent } = useRecentModels();
  const [providerStatuses, setProviderStatuses] = useState<
    Map<ProviderId, ProviderStatus>
  >(new Map());

  // Restore last provider when opening
  useEffect(() => {
    if (isOpen && lastProvider) {
      setSelectedProvider(lastProvider);
    }
  }, [isOpen, lastProvider]);

  // Check provider statuses
  useEffect(() => {
    async function checkStatuses() {
      const statuses = new Map<ProviderId, ProviderStatus>();

      // Check each provider
      for (const [providerId, keyName] of Object.entries(PROVIDER_KEY_MAP)) {
        const pid = providerId as ProviderId;

        if (LOCAL_PROVIDERS.includes(pid)) {
          // For local providers, check if we have any models from them
          const hasModels = models.some((m) => m.provider === pid);
          statuses.set(pid, hasModels ? "connected" : "unreachable");
        } else if (keyName) {
          // For online providers, check if API key exists
          try {
            const key = await window.wisteria.keys.get(keyName);
            statuses.set(pid, key ? "connected" : "no-api-key");
          } catch {
            statuses.set(pid, "no-api-key");
          }
        }
      }

      setProviderStatuses(statuses);
    }

    checkStatuses();
  }, [models]);

  // Convert starred models to a Set for quick lookup
  const starredModelIds = useMemo(() => {
    return new Set(starredModels.map((m) => m.modelId));
  }, [starredModels]);

  // Handle provider selection
  const handleSelectProvider = (provider: ProviderId | null) => {
    setSelectedProvider(provider);
    if (provider) {
      setLastProvider(provider);
    }
  };

  // Handle model selection
  const handleSelectModel = (modelId: string) => {
    onValueChange(modelId);
    addToRecent(modelId);
    setIsOpen(false);
  };

  // Handle star toggle
  const handleToggleStar = (modelId: string, provider: ProviderId) => {
    toggleStar(modelId, provider);
  };

  // Get selected model info
  const selectedModel = models.find((m) => m.id === selectedModelId);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        role="combobox"
        aria-expanded={isOpen}
        disabled={disabled}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-fit min-w-[150px] max-w-[250px] justify-between",
          "text-sm font-normal",
        )}
      >
        <span className="truncate">
          {selectedModel?.name || "Select Model..."}
        </span>
        <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent
        className="w-[750px] h-[550px] p-0 overflow-hidden"
        align="center"
      >
        <div className="flex h-full">
          {/* Left sidebar - Provider selection */}
          <div className="w-[200px] border-r bg-muted/30 shrink-0">
            <ProviderSidebar
              models={models}
              selectedProvider={selectedProvider}
              onSelectProvider={handleSelectProvider}
              providerStatuses={providerStatuses}
            />
          </div>

          {/* Right panel - Model browser */}
          <div className="flex-1 min-w-0">
            <ModelBrowser
              models={models}
              selectedProvider={selectedProvider}
              selectedModelId={selectedModelId}
              starredModelIds={starredModelIds}
              recentModelIds={recentModelIds}
              onSelectModel={handleSelectModel}
              onToggleStar={handleToggleStar}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
