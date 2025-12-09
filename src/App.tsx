import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

function App() {
	const [projects, setProjects] = useState<Project[]>([]);
	const [chats, setChats] = useState<Chat[]>([]);
	const [messages, setMessages] = useState<Message[]>([]);
	const [models, setModels] = useState<ModelOption[]>([]);

	const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
		null,
	);
	const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

	const [newChatName, setNewChatName] = useState("");
	const [systemPrompt, setSystemPrompt] = useState("");
	const [selectedProvider, setSelectedProvider] = useState("ollama");
	const [selectedModelId, setSelectedModelId] = useState("");
	const [status, setStatus] = useState("Ready");
	const [input, setInput] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [openRouterKey, setOpenRouterKey] = useState("");
	const [theme, setTheme] = useState<ThemeMode>("light");
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
		const [proj, modelList, savedKey] = await Promise.all([
			window.wisteria.projects.list(),
			window.wisteria.models.list(),
			window.wisteria.keys.get("openrouter_api_key"),
		]);
		setProjects(proj);
		setModels(modelList);
		if (savedKey) setOpenRouterKey(savedKey);
		if (proj.length > 0) {
			await selectProject(proj[0].id);
		} else {
			setStatus("Ready");
		}
	};

	const refreshProjects = async (selectId?: string | null) => {
		const proj = await window.wisteria.projects.list();
		setProjects(proj);
		const target = selectId ?? selectedProjectId ?? proj[0]?.id ?? null;
		if (target) {
			await selectProject(target);
		}
	};

	const selectProject = async (projectId: string) => {
		setSelectedProjectId(projectId);
		const list = projects.length
			? projects
			: await window.wisteria.projects.list();
		const proj = list.find((p) => p.id === projectId);
		if (proj) {
			setSystemPrompt(proj.system_prompt ?? "");
			if (proj.model_id && proj.model_provider) {
				setSelectedProvider(proj.model_provider);
				setSelectedModelId(proj.model_id);
			} else {
				setSelectedProvider("");
				setSelectedModelId("");
			}
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
		modelProvider?: string;
		modelId?: string;
	}) => {
		setStatus("Creating project…");
		const proj = await window.wisteria.projects.create(data.name);

		// Update project with additional fields if provided
		if (data.systemPrompt || data.modelProvider || data.modelId) {
			await window.wisteria.projects.update(proj.id, {
				system_prompt: data.systemPrompt,
				model_provider: data.modelProvider,
				model_id: data.modelId,
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
			model_provider: data.model_provider,
			model_id: data.model_id,
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
		const msgs = await window.wisteria.messages.list(chatId);
		setMessages(msgs);
	};

	const createChat = async () => {
		if (!selectedProjectId) return;
		const name = newChatName.trim();
		if (!name) return;
		setStatus("Creating chat…");
		const chat = await window.wisteria.chats.create(selectedProjectId, name);
		setNewChatName("");
		const chatList = await window.wisteria.chats.list(selectedProjectId);
		setChats(chatList);
		await selectChat(chat.id);
		setStatus("Ready");
	};

	const deleteChat = async (chatId: string) => {
		await window.wisteria.chats.delete(chatId);
		if (!selectedProjectId) return;
		const chatList = await window.wisteria.chats.list(selectedProjectId);
		setChats(chatList);
		if (chatList.length > 0) {
			await selectChat(chatList[0].id);
		} else {
			setSelectedChatId(null);
			setMessages([]);
		}
	};

	const persistSystemPrompt = async () => {
		await updateProjectMeta({ system_prompt: systemPrompt });
	};

	const persistProviderSelection = async (value: string) => {
		setSelectedProvider(value);
		setSelectedModelId(""); // Reset model when provider changes
		await updateProjectMeta({
			model_provider: value,
			model_id: "",
		});
	};

	const persistModelSelection = async (value: string) => {
		setSelectedModelId(value);
		await updateProjectMeta({
			model_provider: selectedProvider,
			model_id: value,
		});
	};

	const saveOpenRouter = async () => {
		await window.wisteria.keys.set("openrouter_api_key", openRouterKey.trim());
	};

	const sendMessage = async () => {
		if (!input.trim() || !selectedChatId || !activeProject) return;
		if (!selectedProvider || !selectedModelId) {
			setStatus("Pick a provider and model first");
			return;
		}
		const modelId = selectedModelId;
		setIsSending(true);
		setStatus("Sending…");
		const userMessage = await window.wisteria.messages.append(
			selectedChatId,
			"user",
			input.trim(),
		);
		setMessages((prev) => [...prev, userMessage]);
		setInput("");

		const history = [
			...(activeProject.system_prompt
				? [{ role: "system" as const, content: activeProject.system_prompt }]
				: []),
			...messages.map((m) => ({ role: m.role, content: m.content })),
			{ role: "user" as const, content: userMessage.content },
		];

		const requestId = crypto.randomUUID();
		const placeholder: Message = {
			id: requestId,
			chat_id: selectedChatId,
			role: "assistant",
			content: "",
			created_at: Date.now(),
		};
		streamMeta.current[requestId] = {
			chatId: selectedChatId,
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

	return (
		<div className="flex h-screen flex-col bg-wisteria-accent/20 text-wisteria-text relative">
			<header
				className="flex items-center justify-between gap-4 top-0 right-0 p-4"
				style={dragRegionStyle}
			></header>
			<div>
				<div className="flex items-center gap-3">
					{activeProject && (
						<>
							<div className="h-3 w-px bg-wisteria-border/60" />
							<div className="text-sm text-wisteria-textSubtle font-medium">
								{activeProject.name}
							</div>
							{selectedChatId && (
								<>
									<div className="h-3 w-px bg-wisteria-border/60" />
									<div className="text-sm text-wisteria-textSubtle font-medium">
										{chats.find((c) => c.id === selectedChatId)?.name}
									</div>
								</>
							)}
						</>
					)}
				</div>
			</div>
			<div className="flex flex-1 overflow-hidden p-2 gap-2">
				<AppSidebar
					projects={projects}
					chats={chats}
					selectedProjectId={selectedProjectId}
					selectedChatId={selectedChatId}
					activeProject={activeProject}
					newChatName={newChatName}
					setNewChatName={setNewChatName}
					systemPrompt={systemPrompt}
					setSystemPrompt={setSystemPrompt}
					theme={theme}
					setTheme={setTheme}
					formattedStatus={formattedStatus}
					models={models}
					uniqueProviders={uniqueProviders}
					onSelectProject={selectProject}
					onDeleteProject={deleteProject}
					onCreateProject={handleCreateProject}
					onSelectChat={selectChat}
					onDeleteChat={deleteChat}
					onCreateChat={createChat}
					onPersistSystemPrompt={persistSystemPrompt}
				/>

				<main className="flex flex-1 border rounded-lg bg-wisteria-bg flex-col overflow-hidden">
					<div className="flex-1 overflow-y-auto p-8">
						<div className="mx-auto max-w-4xl space-y-6">
							{messages.length === 0 && (
								<div className="flex h-full items-center justify-center">
									<div className="rounded-lg border border-dashed border-wisteria-border bg-wisteria-panelStrong/30 px-6 py-4 text-center text-sm text-wisteria-textMuted">
										No messages yet. Start a conversation below.
									</div>
								</div>
							)}
							{messages.map((msg) => (
								<div
									key={msg.id}
									className="space-y-2"
								>
									<div className="flex items-center gap-2 text-xs text-wisteria-textMuted">
										<span className="font-medium capitalize text-wisteria-accent">
											{msg.role}
										</span>
										<span>·</span>
										<span>
											{new Date(msg.created_at).toLocaleTimeString([], {
												hour: "2-digit",
												minute: "2-digit",
											})}
										</span>
									</div>
									<div
										className={`whitespace-pre-wrap rounded-lg px-4 py-3 text-sm leading-relaxed ${
											msg.role === "user"
												? "bg-wisteria-bubbleUser"
												: "bg-wisteria-panel"
										}`}
									>
										{msg.content}
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="border-t border-wisteria-border bg-wisteria-panel/30 p-5 backdrop-blur-sm">
						<div className="mx-auto max-w-4xl space-y-4">
							<div className="flex gap-3">
								<Select
									value={selectedProvider || undefined}
									onValueChange={(value) =>
										void persistProviderSelection(value)
									}
								>
									<SelectTrigger className="shrink-0 w-fit border border-wisteria-border bg-wisteria-panel text-sm text-wisteria-text focus-visible:ring-1 focus-visible:ring-wisteria-accent focus-visible:border-wisteria-accent">
										<SelectValue placeholder="Provider…" />
									</SelectTrigger>
									<SelectContent className="border border-wisteria-border bg-wisteria-panel text-wisteria-text shadow-lg">
										{uniqueProviders.map((provider) => (
											<SelectItem
												key={provider}
												value={provider}
											>
												{provider}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Select
									value={selectedModelId || undefined}
									onValueChange={(value) => void persistModelSelection(value)}
									disabled={!selectedProvider}
								>
									<SelectTrigger className="shrink-0 w-fit border border-wisteria-border bg-wisteria-panel text-sm text-wisteria-text focus-visible:ring-1 focus-visible:ring-wisteria-accent focus-visible:border-wisteria-accent disabled:opacity-50">
										<SelectValue placeholder="Model…" />
									</SelectTrigger>
									<SelectContent className="border border-wisteria-border bg-wisteria-panel text-wisteria-text shadow-lg">
										{filteredModels.map((m) => (
											<SelectItem
												key={m.id}
												value={m.id}
											>
												{m.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<div className="flex-1">
									<label
										htmlFor="chat-input"
										className="sr-only"
									>
										Chat input
									</label>
									<Textarea
										id="chat-input"
										ref={composerRef}
										value={input}
										onChange={(e) => setInput(e.target.value)}
										onKeyDown={handleComposerKey}
										placeholder="Type a message and hit Enter to send"
										rows={4}
										disabled={!selectedChatId || isSending}
										className="w-full border border-wisteria-border bg-wisteria-panel text-sm text-wisteria-text focus-visible:ring-1 focus-visible:ring-wisteria-accent focus-visible:border-wisteria-accent resize-none"
									/>
								</div>
								<Button
									onClick={() => void sendMessage()}
									disabled={!input.trim() || isSending || !selectedChatId}
									className="shrink-0 self-end bg-wisteria-accent font-medium text-white hover:bg-wisteria-accentSoft transition-colors disabled:opacity-50"
								>
									{isSending ? "Sending…" : "Send"}
								</Button>
							</div>
							{activeProject && (
								<div className="flex items-center gap-2 text-xs text-wisteria-textMuted">
									<span>OpenRouter API key:</span>
									<Input
										className="flex-1 border border-wisteria-border bg-wisteria-panel text-xs text-wisteria-text focus-visible:ring-1 focus-visible:ring-wisteria-accent focus-visible:border-wisteria-accent"
										value={openRouterKey}
										onChange={(e) => setOpenRouterKey(e.target.value)}
										placeholder="sk-..."
										type="password"
									/>
									<Button
										variant="outline"
										size="sm"
										className="border border-wisteria-border text-xs font-medium text-wisteria-text hover:border-wisteria-accent hover:bg-wisteria-highlight transition-colors"
										onClick={() => void saveOpenRouter()}
										disabled={!openRouterKey.trim()}
									>
										Save
									</Button>
								</div>
							)}
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}

export default App;
