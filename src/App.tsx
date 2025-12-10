import { AppSidebar } from "@/components/app-sidebar";
import { ModelSelector } from "@/components/model-selector";
import { ProviderSelector } from "@/components/provider-selector";
import { SettingsDialog } from "@/components/settings-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import "./index.css";

type Project = Awaited<
	ReturnType<typeof window.wisteria.projects.list>
>[number];

type Chat = Awaited<ReturnType<typeof window.wisteria.chats.list>>[number];

type Message = Awaited<
	ReturnType<typeof window.wisteria.messages.list>
>[number];

type ModelOption = { id: string; label: string; provider: string };
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

function App() {
	const [projects, setProjects] = useState<Project[]>([]);
	const [chats, setChats] = useState<Chat[]>([]);
	const [temporaryChats, setTemporaryChats] = useState<TemporaryChat[]>([]);
	const [messages, setMessages] = useState<Message[]>([]);
	const [models, setModels] = useState<ModelOption[]>([]);

	const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
		null,
	);
	const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

	const [systemPrompt, setSystemPrompt] = useState("");
	const [selectedProvider, setSelectedProvider] = useState("ollama");
	const [selectedModelId, setSelectedModelId] = useState("");
	const [status, setStatus] = useState("Ready");
	const [input, setInput] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [theme, setTheme] = useState<ThemeMode>("light");
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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
			void finalizeAssistantMessage(payload.requestId, payload.content);
		});
		const offError = window.wisteria.models.onStreamError((payload) => {
			void handleStreamError(payload.requestId, payload.error);
		});
		return () => {
			offChunk();
			offDone();
			offError();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const activeProject = useMemo(
		() => projects.find((p) => p.id === selectedProjectId) ?? null,
		[projects, selectedProjectId],
	);

	const uniqueProviders = useMemo(
		() => Array.from(new Set(models.map((m) => m.provider))).sort(),
		[models],
	);

	const filteredModels = useMemo(
		() => models.filter((m) => m.provider === selectedProvider),
		[models, selectedProvider],
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

	const handleProviderChange = (value: string) => {
		setSelectedProvider(value);
		setSelectedModelId(""); // Reset model when provider changes
	};

	const handleModelChange = (value: string) => {
		setSelectedModelId(value);
	};

	const sendMessage = async () => {
		if (!input.trim() || !selectedChatId) return;
		if (!selectedProvider || !selectedModelId) {
			setStatus("Pick a provider and model first");
			return;
		}

		const messageContent = input.trim();
		const modelId = selectedModelId;
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

		const history = [
			...(activeProject?.system_prompt
				? [{ role: "system" as const, content: activeProject.system_prompt }]
				: []),
			...messages.map((m) => ({ role: m.role, content: m.content })),
			{ role: "user" as const, content: userMessage.content },
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
				provider: selectedProvider as "ollama" | "lmstudio" | "openrouter",
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

	return (
		<div className="flex h-screen flex-col bg-primary/20 text-foreground relative grainy-bg">
			<header
				className="flex items-center justify-between gap-4 top-0 right-0 p-4"
				style={dragRegionStyle}
			></header>

			<div className="flex flex-1 overflow-hidden p-2 gap-2">
				<AppSidebar
					projects={projects}
					chats={allChatsForDisplay}
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
				/>

				<main className="flex-1 border rounded-lg bg-background overflow-y-auto relative">
					<div className="overflow-y-auto p-8 h-full pb-40">
						<div className="mx-auto max-w-3xl space-y-6">
							{messages.length === 0 && (
								<div className="flex h-full items-center justify-center">
									<div className="rounded-lg border border-dashed bg-muted/30 px-6 py-4 text-center text-sm text-muted-foreground">
										No messages yet. Start a conversation below.
									</div>
								</div>
							)}
							{messages.map((msg) => (
								<div
									key={msg.id}
									className={`space-y-2 ${
										msg.role === "user" ? "flex flex-col items-end" : "w-full"
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
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
						<div className="mx-auto max-w-4xl space-y-4 backdrop-blur-2xl border bg-wisteria-bubbleUser rounded-lg flex flex-col px-4 py-3">
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
									<ProviderSelector
										providers={uniqueProviders}
										selectedProvider={selectedProvider}
										onValueChange={handleProviderChange}
									/>
									<ModelSelector
										models={filteredModels}
										selectedModelId={selectedModelId}
										onValueChange={handleModelChange}
										disabled={!selectedProvider}
									/>
								</div>

								<Button
									onClick={() => void sendMessage()}
									disabled={!input.trim() || isSending || !selectedChatId}
									className="shrink-0 self-end"
								>
									{isSending ? "Sending…" : "Send"}
								</Button>
							</div>
						</div>
					</div>
				</main>
				<SettingsDialog
					open={isSettingsOpen}
					onOpenChange={setIsSettingsOpen}
					providers={uniqueProviders}
				/>
			</div>
		</div>
	);
}

export default App;
