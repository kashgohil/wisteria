import { AppSidebar } from "@/components/app-sidebar";
import { ImageLightbox } from "@/components/image-lightbox";
import { MediaUploadDialog } from "@/components/media-upload-dialog";
import { MediaView } from "@/components/media-view";
import { MessageAttachment } from "@/components/message-attachment";
import { ModelSelector } from "@/components/model-selector";
import { SettingsDialog } from "@/components/settings-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Sidebar } from "lucide-react";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import type { ContentPart, ModelInfo, ResponseImage } from "../shared/models";
import type { ProviderId } from "../shared/providers";
import "./index.css";
import { cn } from "./lib/utils";

type Project = Awaited<
  ReturnType<typeof window.wisteria.projects.list>
>[number];

type Chat = Awaited<ReturnType<typeof window.wisteria.chats.list>>[number];

type Message = Awaited<
  ReturnType<typeof window.wisteria.messages.list>
>[number];

type Attachment = Awaited<
  ReturnType<typeof window.wisteria.attachments.list>
>[number];

type ThemeMode = "light" | "dark";

// Temporary chat type (not persisted in DB)
type TemporaryChat = {
  id: string;
  project_id: string | null;
  name: string;
  created_at: number;
};

// Generate a chat name from the first message
function generateChatName(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return "New Chat";

  // Take first 50 characters, or up to the first newline/question mark
  const maxLength = 50;
  let name = trimmed.split(/[\n?]/)[0].trim();

  if (name.length > maxLength) {
    name = name.substring(0, maxLength).trim();
    // Try to cut at a word boundary
    const lastSpace = name.lastIndexOf(" ");
    if (lastSpace > maxLength * 0.7) {
      name = name.substring(0, lastSpace);
    }
    name += "...";
  }

  return name || "New Chat";
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(",")[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function App() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [temporaryChats, setTemporaryChats] = useState<TemporaryChat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const [systemPrompt, setSystemPrompt] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedProvider, setSelectedProvider] =
    useState<ProviderId>("ollama");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [status, setStatus] = useState("Ready");
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"chat" | "media">("chat");
  const [existingAttachmentIds, setExistingAttachmentIds] = useState<string[]>(
    [],
  );
  const [messageAttachments, setMessageAttachments] = useState<
    Record<string, Attachment[]>
  >({});
  const [lightboxImage, setLightboxImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);
  const streamMeta = useRef<
    Record<string, { chatId: string; completed: boolean }>
  >({});

  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const dragRegionStyle: CSSProperties & { WebkitAppRegion?: string } = {
    WebkitAppRegion: "drag",
    WebkitUserSelect: "none",
  };

  const applyTheme = useCallback((value: ThemeMode) => {
    document.documentElement.setAttribute("data-theme", value);
    window.localStorage.setItem("wisteria-theme", value);
  }, []);

  useEffect(() => {
    void bootstrap();
    setTimeout(() => setLoading(false), 4000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem("wisteria-theme");
    const prefersDark = window.matchMedia?.(
      "(prefers-color-scheme: dark)",
    ).matches;
    const initial =
      saved === "dark" || saved === "light"
        ? (saved as ThemeMode)
        : prefersDark
          ? "dark"
          : "light";
    setTheme(initial);
    applyTheme(initial);
  }, [applyTheme]);

  useEffect(() => {
    applyTheme(theme);
  }, [applyTheme, theme]);

  useEffect(() => {
    const offChunk = window.wisteria.models.onStreamChunk((payload) => {
      setStatus("Streaming…");
      setMessages((prev) =>
        prev.map((m) =>
          m.id === payload.requestId ? { ...m, content: payload.content } : m,
        ),
      );
    });
    const offDone = window.wisteria.models.onStreamDone((payload) => {
      void finalizeAssistantMessage(payload.requestId, payload.content, payload.images);
    });
    const offError = window.wisteria.models.onStreamError((payload) => {
      void handleStreamError(payload.requestId, payload.error);
    });
    return () => {
      offChunk();
      offDone();
      offError();
    };
  }, []);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const uniqueProviders = useMemo<ProviderId[]>(
    () =>
      Array.from(new Set(models.map((m) => m.provider))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [models],
  );

  const bootstrap = async () => {
    setStatus("Loading…");
    const [proj, modelList, allChats] = await Promise.all([
      window.wisteria.projects.list(),
      window.wisteria.models.list(),
      window.wisteria.chats.listAll(),
    ]);
    setProjects(proj);
    setModels(modelList);
    setChats(allChats);
    if (allChats.length > 0) {
      // If there are chats, select the first one (could be standalone or project chat)
      await selectChat(allChats[0].id);
      // Set the project if the chat belongs to one
      if (allChats[0].project_id) {
        setSelectedProjectId(allChats[0].project_id);
        const projForChat = proj.find((p) => p.id === allChats[0].project_id);
        if (projForChat) {
          setSystemPrompt(projForChat.system_prompt ?? "");
        }
      } else {
        setSelectedProjectId(null);
        setSystemPrompt("");
      }
    } else if (proj.length > 0) {
      await selectProject(proj[0].id);
    } else {
      setSelectedProjectId(null);
      setStatus("Ready");
    }
  };

  const refreshProjects = async (selectId?: string | null) => {
    const proj = await window.wisteria.projects.list();
    setProjects(proj);
    const allChats = await window.wisteria.chats.listAll();
    setChats(allChats);
    const target = selectId ?? selectedProjectId ?? proj[0]?.id ?? null;
    if (target) {
      await selectProject(target);
    } else if (allChats.length > 0) {
      // If no project selected but there are chats, select the first one
      await selectChat(allChats[0].id);
      if (allChats[0].project_id) {
        setSelectedProjectId(allChats[0].project_id);
        const projForChat = proj.find((p) => p.id === allChats[0].project_id);
        if (projForChat) {
          setSystemPrompt(projForChat.system_prompt ?? "");
        }
      } else {
        setSelectedProjectId(null);
        setSystemPrompt("");
      }
    }
  };

  const selectProject = async (projectId: string | null) => {
    setSelectedProjectId(projectId);
    if (projectId) {
      const list = projects.length
        ? projects
        : await window.wisteria.projects.list();
      const proj = list.find((p) => p.id === projectId);
      if (proj) {
        setSystemPrompt(proj.system_prompt ?? "");
      }
    } else {
      setSystemPrompt("");
    }
    const chatList = await window.wisteria.chats.list(projectId);
    setChats(chatList);
    if (chatList.length > 0) {
      await selectChat(chatList[0].id);
    } else {
      setSelectedChatId(null);
      setMessages([]);
    }
    setStatus("Ready");
  };

  const handleCreateProject = async (data: {
    name: string;
    systemPrompt?: string;
  }) => {
    setStatus("Creating project…");
    const proj = await window.wisteria.projects.create(data.name);

    // Update project with system prompt if provided
    if (data.systemPrompt) {
      await window.wisteria.projects.update(proj.id, {
        system_prompt: data.systemPrompt,
      });
    }

    await refreshProjects(proj.id);
    setStatus("Ready");
  };

  const updateProjectMeta = async (data: Partial<Project>) => {
    if (!selectedProjectId) return;
    const updated = await window.wisteria.projects.update(selectedProjectId, {
      name: data.name,
      system_prompt: data.system_prompt,
    });
    if (updated) {
      setProjects((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p)),
      );
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!projectId) return;
    await window.wisteria.projects.delete(projectId);
    await refreshProjects(null);
  };

  const selectChat = async (chatId: string) => {
    setSelectedChatId(chatId);

    // Check if it's a temporary chat
    const tempChat = temporaryChats.find((c) => c.id === chatId);
    if (tempChat) {
      setMessages([]);
      if (tempChat.project_id) {
        setSelectedProjectId(tempChat.project_id);
        const proj = projects.find((p) => p.id === tempChat.project_id);
        if (proj) {
          setSystemPrompt(proj.system_prompt ?? "");
        }
      } else {
        setSelectedProjectId(null);
        setSystemPrompt("");
      }
      return;
    }

    // Regular chat - load messages
    const msgs = await window.wisteria.messages.list(chatId);
    setMessages(msgs);

    // Load attachments for all messages
    const attachmentsMap: Record<string, Attachment[]> = {};
    for (const msg of msgs) {
      const msgAttachments = await window.wisteria.attachments.getByMessage(
        msg.id,
      );
      if (msgAttachments.length > 0) {
        attachmentsMap[msg.id] = msgAttachments;
      }
    }
    setMessageAttachments(attachmentsMap);

    // Update selected project based on the chat
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      if (chat.project_id) {
        setSelectedProjectId(chat.project_id);
        const proj = projects.find((p) => p.id === chat.project_id);
        if (proj) {
          setSystemPrompt(proj.system_prompt ?? "");
        }
      } else {
        setSelectedProjectId(null);
        setSystemPrompt("");
      }
    }
  };

  const createChat = async () => {
    // Create a temporary chat (not persisted yet)
    const tempChat: TemporaryChat = {
      id: crypto.randomUUID(),
      project_id: selectedProjectId,
      name: "New Chat",
      created_at: Date.now(),
    };
    setTemporaryChats((prev) => [...prev, tempChat]);
    setSelectedChatId(tempChat.id);
    setMessages([]);
    setStatus("Ready");
  };

  const persistChat = async (chatId: string, name: string) => {
    // Create the chat in the database
    const chat = await window.wisteria.chats.create(selectedProjectId, name);
    // Remove from temporary chats
    setTemporaryChats((prev) => prev.filter((c) => c.id !== chatId));
    // Refresh chats list
    const allChats = await window.wisteria.chats.listAll();
    setChats(allChats);
    // Update selected chat ID to the persisted chat
    setSelectedChatId(chat.id);
    return chat.id;
  };

  const deleteChat = async (chatId: string) => {
    // Check if it's a temporary chat
    const isTemporaryChat = temporaryChats.some((c) => c.id === chatId);
    if (isTemporaryChat) {
      setTemporaryChats((prev) => prev.filter((c) => c.id !== chatId));
      // Select another chat if available
      const remainingTempChats = temporaryChats.filter((c) => c.id !== chatId);
      const allChats = await window.wisteria.chats.listAll();
      if (remainingTempChats.length > 0) {
        await selectChat(remainingTempChats[0].id);
      } else if (allChats.length > 0) {
        await selectChat(allChats[0].id);
        if (allChats[0].project_id) {
          setSelectedProjectId(allChats[0].project_id);
          const proj = projects.find((p) => p.id === allChats[0].project_id);
          if (proj) {
            setSystemPrompt(proj.system_prompt ?? "");
          }
        } else {
          setSelectedProjectId(null);
          setSystemPrompt("");
        }
      } else {
        setSelectedChatId(null);
        setMessages([]);
      }
      return;
    }

    // Regular chat - delete from database
    await window.wisteria.chats.delete(chatId);
    const allChats = await window.wisteria.chats.listAll();
    setChats(allChats);
    if (allChats.length > 0) {
      await selectChat(allChats[0].id);
      // Update selected project if the chat belongs to one
      if (allChats[0].project_id) {
        setSelectedProjectId(allChats[0].project_id);
        const proj = projects.find((p) => p.id === allChats[0].project_id);
        if (proj) {
          setSystemPrompt(proj.system_prompt ?? "");
        }
      } else {
        setSelectedProjectId(null);
        setSystemPrompt("");
      }
    } else if (temporaryChats.length > 0) {
      await selectChat(temporaryChats[0].id);
    } else {
      setSelectedChatId(null);
      setMessages([]);
    }
  };

  const persistSystemPrompt = async () => {
    await updateProjectMeta({ system_prompt: systemPrompt });
  };

  const handleModelChange = (value: string) => {
    setSelectedModelId(value);
    const model = models.find((m) => m.id === value);
    if (model) {
      setSelectedProvider(model.provider);
    }
  };

  const sendMessage = async () => {
    // Allow sending if there's text OR attachments (new or existing)
    const hasMedia = attachments.length > 0 || existingAttachmentIds.length > 0;
    if ((!input.trim() && !hasMedia) || !selectedChatId) return;
    if (!selectedProvider || !selectedModelId) {
      setStatus("Pick a provider and model first");
      return;
    }

    const messageContent = input.trim() || "(media only)";
    const modelId = selectedModelId;
    const filesToUpload = [...attachments];
    const existingToReuse = [...existingAttachmentIds];
    setIsSending(true);
    setStatus("Sending…");

    // Check if this is a temporary chat
    const isTemporaryChat = temporaryChats.some((c) => c.id === selectedChatId);
    let actualChatId = selectedChatId;

    if (isTemporaryChat) {
      // Generate name from the first message and persist the chat
      const chatName = generateChatName(messageContent);
      actualChatId = await persistChat(selectedChatId, chatName);
    }

    const userMessage = await window.wisteria.messages.append(
      actualChatId,
      "user",
      messageContent,
    );
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAttachments([]);
    setExistingAttachmentIds([]);

    const currentContentParts: ContentPart[] = [
      { type: "text", text: userMessage.content },
    ];

    // Track uploaded attachments to update UI immediately
    const uploadedAttachments: Attachment[] = [];

    // Upload new attachments if any
    if (filesToUpload.length > 0) {
      try {
        setStatus("Uploading attachments…");
        for (const file of filesToUpload) {
          const buffer = await file.arrayBuffer();
          const uploaded = await window.wisteria.attachments.upload(
            actualChatId,
            userMessage.id,
            buffer,
            file.name,
            file.type,
          );
          uploadedAttachments.push(uploaded);

          if (file.type.startsWith("image/")) {
            const base64 = await blobToBase64(file);
            currentContentParts.push({
              type: "image",
              source: {
                type: "base64",
                media_type: file.type,
                data: base64,
              },
            });
          }
        }
      } catch (err) {
        console.error("Failed to upload attachments:", err);
        setStatus(`Error uploading files: ${String(err)}`);
        setIsSending(false);
        return;
      }
    }

    // Copy existing attachments to this message
    if (existingToReuse.length > 0) {
      try {
        setStatus("Copying media…");
        for (const attachmentId of existingToReuse) {
          // Get the attachment details
          const existingAttachments = await window.wisteria.attachments.list();
          const attachment = existingAttachments.find(
            (a) => a.id === attachmentId,
          );
          if (attachment) {
            // Get the file path and read the file
            const response = await fetch(`media://${attachment.file_path}`);
            const blob = await response.blob();
            const buffer = await blob.arrayBuffer();
            const uploaded = await window.wisteria.attachments.upload(
              actualChatId,
              userMessage.id,
              buffer,
              attachment.file_name,
              attachment.mime_type,
            );
            uploadedAttachments.push(uploaded);

            if (attachment.mime_type.startsWith("image/")) {
              const base64 = await blobToBase64(blob);
              currentContentParts.push({
                type: "image",
                source: {
                  type: "base64",
                  media_type: attachment.mime_type,
                  data: base64,
                },
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to copy attachments:", err);
        // Don't fail the message, just log the error
      }
    }

    // Update messageAttachments state so uploaded files show immediately
    if (uploadedAttachments.length > 0) {
      setMessageAttachments((prev) => ({
        ...prev,
        [userMessage.id]: uploadedAttachments,
      }));
    }

    // Construct history with attachments
    const historyPromises = messages.map(async (m) => {
      const msgAttachments = messageAttachments[m.id];
      if (!msgAttachments || msgAttachments.length === 0) {
        return { role: m.role, content: m.content };
      }

      const contentParts: ContentPart[] = [
        { type: "text", text: m.content || "" },
      ];

      for (const att of msgAttachments) {
        if (att.mime_type.startsWith("image/")) {
          try {
            const response = await fetch(`media://${att.file_path}`);
            const blob = await response.blob();
            const base64 = await blobToBase64(blob);
            contentParts.push({
              type: "image",
              source: {
                type: "base64",
                media_type: att.mime_type,
                data: base64,
              },
            });
          } catch (e) {
            console.error("Failed to load attachment for history", e);
          }
        }
      }
      return { role: m.role, content: contentParts };
    });

    const previousMessages = await Promise.all(historyPromises);

    const history = [
      ...(activeProject?.system_prompt
        ? [{ role: "system" as const, content: activeProject.system_prompt }]
        : []),
      ...previousMessages,
      { role: "user" as const, content: currentContentParts },
    ];

    const requestId = crypto.randomUUID();
    const placeholder: Message = {
      id: requestId,
      chat_id: actualChatId,
      role: "assistant",
      content: "",
      created_at: Date.now(),
    };
    streamMeta.current[requestId] = {
      chatId: actualChatId,
      completed: false,
    };
    setMessages((prev) => [...prev, placeholder]);

    try {
      const response = await window.wisteria.models.send({
        provider: selectedProvider,
        model: modelId,
        messages: history,
        stream: true,
        requestId,
      });
      if (!streamMeta.current[requestId]?.completed) {
        await finalizeAssistantMessage(requestId, response.content);
      }
    } catch (err) {
      console.error(err);
      if (!streamMeta.current[requestId]?.completed) {
        await handleStreamError(requestId, String(err));
      }
    } finally {
      composerRef.current?.focus();
    }
  };

  const finalizeAssistantMessage = async (
    requestId: string,
    content: string,
    images?: ResponseImage[],
  ) => {
    const meta = streamMeta.current[requestId];
    if (!meta) return;
    streamMeta.current[requestId] = { ...meta, completed: true };
    const finalContent = content || "(empty response)";
    const persisted = await window.wisteria.messages.append(
      meta.chatId,
      "assistant",
      finalContent,
    );
    setMessages((prev) =>
      prev.map((m) => (m.id === requestId ? persisted : m)),
    );

    // Save images from model response as attachments
    if (images && images.length > 0) {
      const savedAttachments: Attachment[] = [];
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        try {
          // Convert base64 to ArrayBuffer
          const binaryString = atob(img.data);
          const bytes = new Uint8Array(binaryString.length);
          for (let j = 0; j < binaryString.length; j++) {
            bytes[j] = binaryString.charCodeAt(j);
          }
          const buffer = bytes.buffer;

          // Generate filename from mime type
          const ext = img.mime_type.split("/")[1] || "png";
          const fileName = `generated_${Date.now()}_${i}.${ext}`;

          const attachment = await window.wisteria.attachments.upload(
            meta.chatId,
            persisted.id,
            buffer,
            fileName,
            img.mime_type,
          );
          savedAttachments.push(attachment);
        } catch (err) {
          console.error("Failed to save model-generated image:", err);
        }
      }

      if (savedAttachments.length > 0) {
        setMessageAttachments((prev) => ({
          ...prev,
          [persisted.id]: savedAttachments,
        }));
      }
    }

    setStatus("Ready");
    setIsSending(false);
    delete streamMeta.current[requestId];
  };

  const handleStreamError = async (requestId: string, error: string) => {
    const meta = streamMeta.current[requestId];
    if (!meta) return;
    streamMeta.current[requestId] = { ...meta, completed: true };
    const errorMsg = await window.wisteria.messages.append(
      meta.chatId,
      "assistant",
      `(Error) ${error}`,
    );
    setMessages((prev) => prev.map((m) => (m.id === requestId ? errorMsg : m)));
    setStatus("Failed to send");
    setIsSending(false);
    delete streamMeta.current[requestId];
  };

  const handleComposerKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const formattedStatus = `${status}${
    selectedProvider && selectedModelId
      ? ` • ${selectedProvider}:${selectedModelId}`
      : ""
  }`;

  // Combine persisted chats and temporary chats for display
  const allChatsForDisplay = useMemo(() => {
    return [...chats, ...temporaryChats];
  }, [chats, temporaryChats]);

  if (loading) {
    return (
      <div
        className="flex h-screen flex-col bg-primary/20 grainy-bg items-center justify-center text-center text-[#A891C5] font-oleo"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}background.png)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundBlendMode: "lighten",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
        }}
      >
        <div className="text-8xl ">Wisteria</div>
        <div className="text-xl">
          Chat with LLM of your choice, Safely and Privately.
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen flex-col bg-primary/20 text-foreground relative grainy-bg"
      style={{
        backgroundImage: `url(${
          theme === "dark"
            ? `${import.meta.env.BASE_URL}background-dark.png`
            : `${import.meta.env.BASE_URL}background.png`
        })`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundBlendMode: theme === "dark" ? "darken" : "",
        backgroundColor:
          theme === "dark" ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.6)",
      }}
    >
      <header
        className="flex items-center justify-center font-oleo font-bold tracking-wider text-sm! gap-4 top-0 right-0 p-2 text-center"
        style={dragRegionStyle}
      >
        Wisteria
      </header>

      <div className="flex flex-1 overflow-hidden px-2 pb-2 gap-2">
        <AppSidebar
          projects={projects}
          chats={allChatsForDisplay}
          models={models}
          selectedProjectId={selectedProjectId}
          selectedChatId={selectedChatId}
          activeProject={activeProject}
          systemPrompt={systemPrompt}
          setSystemPrompt={setSystemPrompt}
          theme={theme}
          setTheme={setTheme}
          formattedStatus={formattedStatus}
          onSelectProject={selectProject}
          onDeleteProject={deleteProject}
          onCreateProject={handleCreateProject}
          onSelectChat={selectChat}
          onDeleteChat={deleteChat}
          onCreateChat={createChat}
          onPersistSystemPrompt={persistSystemPrompt}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onViewAllMedia={() => setCurrentView("media")}
          className={cn(isSidebarOpen ? "flex" : "hidden")}
        />

        <main className="flex-1 border rounded-lg bg-background/30 backdrop-blur-3xl overflow-y-auto relative">
          {currentView === "media" ? (
            <MediaView onClose={() => setCurrentView("chat")} />
          ) : (
            <>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="absolute top-4 left-4"
              >
                <Sidebar />
              </Button>
              <div className="overflow-y-auto p-8 h-full pb-40">
                {messages.length === 0 && (
                  <div className="flex h-full items-center justify-center">
                    <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-4 text-center text-sm text-muted-foreground">
                      No messages yet. Start a conversation below.
                    </div>
                  </div>
                )}
                <div className="mx-auto max-w-3xl space-y-6">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`space-y-2 ${
                        msg.role === "user"
                          ? "flex flex-col items-end"
                          : "w-full"
                      }`}
                    >
                      <div
                        className={`rounded-lg px-4 py-3 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-wisteria-bubbleUser max-w-[80%]"
                            : msg.role === "assistant"
                              ? "w-full markdown-content"
                              : "w-full"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <ReactMarkdown
                            key={`${msg.id}-${msg.content.length}`}
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                          >
                            {msg.content || ""}
                          </ReactMarkdown>
                        ) : (
                          msg.content
                        )}

                        {/* Render attachments if any */}
                        {messageAttachments[msg.id] && (
                          <div className="mt-3 space-y-2">
                            {messageAttachments[msg.id].map((attachment) => (
                              <MessageAttachment
                                key={attachment.id}
                                attachment={attachment}
                                onImageClick={() => {
                                  setLightboxImage({
                                    src: `media://${attachment.file_path}`,
                                    alt: attachment.file_name,
                                  });
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
                <div className="mx-auto max-w-4xl space-y-4 backdrop-blur-2xl border bg-background rounded-lg flex flex-col px-4 py-3">
                  <Textarea
                    id="chat-input"
                    ref={composerRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleComposerKey}
                    placeholder="Type a message and hit Enter to send"
                    rows={4}
                    disabled={!selectedChatId || isSending}
                    className="w-full border-none ring-0! p-1 outline-none shadow-none bg-transparent text-sm resize-none"
                  />

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMediaDialogOpen(true)}
                        disabled={!selectedChatId || isSending}
                        className="shrink-0"
                        title="Add media"
                      >
                        <Paperclip className="h-4 w-4" />
                        {(attachments.length > 0 ||
                          existingAttachmentIds.length > 0) && (
                          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-wisteria-accent text-xs text-white">
                            {attachments.length + existingAttachmentIds.length}
                          </span>
                        )}
                      </Button>
                      <ModelSelector
                        models={models}
                        selectedModelId={selectedModelId}
                        onValueChange={handleModelChange}
                      />
                    </div>

                    <Button
                      onClick={() => void sendMessage()}
                      disabled={
                        (!input.trim() &&
                          attachments.length === 0 &&
                          existingAttachmentIds.length === 0) ||
                        isSending ||
                        !selectedChatId
                      }
                      className="shrink-0 self-end"
                    >
                      {isSending ? "Sending…" : "Send"}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
        <SettingsDialog
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          providers={uniqueProviders}
        />
        <MediaUploadDialog
          open={isMediaDialogOpen}
          onOpenChange={setIsMediaDialogOpen}
          selectedFiles={attachments}
          onFilesChange={setAttachments}
          existingAttachments={existingAttachmentIds}
          onExistingAttachmentsChange={setExistingAttachmentIds}
        />
        {lightboxImage && (
          <ImageLightbox
            imageSrc={lightboxImage.src}
            imageAlt={lightboxImage.alt}
            onClose={() => setLightboxImage(null)}
          />
        )}
      </div>
    </div>
  );
}

// function Background() {
// 	return (
// 		<div
// 			className="flex h-screen flex-col bg-primary/20 text-foreground relative grainy-bg items-center justify-center text-center"
// 			style={{
// 				backgroundImage: `url(${import.meta.env.BASE_URL}background.png)`,
// 				backgroundSize: "cover",
// 				backgroundPosition: "center",
// 				backgroundRepeat: "no-repeat",
// 				backgroundBlendMode: "lighten",
// 				backgroundColor: "rgba(0, 0, 0, 0.6)",
// 			}}
// 		>
// 			<div className="text-8xl font-oleo text-[#A891C5]">Wisteria</div>
// 			<div className="text-xl font-oleo text-[#A891C5]">
// 				Chat with LLM of your choice, Safely and Privately.
// 			</div>
// 		</div>
// 	);
// }

export default App;
