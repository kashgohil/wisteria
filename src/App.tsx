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

	const [newProjectName, setNewProjectName] = useState("");
	const [newChatName, setNewChatName] = useState("");
	const [systemPrompt, setSystemPrompt] = useState("");
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
	const noDragRegionStyle: CSSProperties & { WebkitAppRegion?: string } = {
		WebkitAppRegion: "no-drag",
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
				setSelectedModelId(`${proj.model_provider}:${proj.model_id}`);
			} else {
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

	const createProject = async () => {
		const name = newProjectName.trim();
		if (!name) return;
		setStatus("Creating project…");
		const proj = await window.wisteria.projects.create(name);
		setNewProjectName("");
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

	const persistModelSelection = async (value: string) => {
		setSelectedModelId(value);
		const [provider, ...rest] = value.split(":");
		await updateProjectMeta({
			model_provider: provider,
			model_id: rest.join(":"),
		});
	};

	const saveOpenRouter = async () => {
		await window.wisteria.keys.set("openrouter_api_key", openRouterKey.trim());
	};

	const sendMessage = async () => {
		if (!input.trim() || !selectedChatId || !activeProject) return;
		if (!selectedModelId) {
			setStatus("Pick a model first");
			return;
		}
		const [provider, ...rest] = selectedModelId.split(":");
		const modelId = rest.join(":");
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
				provider: provider as "ollama" | "lmstudio" | "openrouter",
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
		selectedModelId ? ` • Model: ${selectedModelId}` : ""
	}`;

	return (
		<div className="flex h-screen flex-col bg-wisteria-bg text-wisteria-text">
			<header
				className="flex shrink-0 items-center justify-between gap-3 border-b border-wisteria-border bg-wisteria-header px-6 py-3 pl-[80px] shadow-md"
				style={dragRegionStyle}
			>
				<div className="flex items-center gap-3">
					<div className="text-sm font-bold text-wisteria-text">Wisteria</div>
					{activeProject && (
						<>
							<div className="h-4 w-px bg-wisteria-border" />
							<div className="text-sm text-wisteria-textSubtle">
								{activeProject.name}
							</div>
							{selectedChatId && (
								<>
									<div className="h-4 w-px bg-wisteria-border" />
									<div className="text-sm text-wisteria-textSubtle">
										{chats.find((c) => c.id === selectedChatId)?.name}
									</div>
								</>
							)}
						</>
					)}
				</div>
				<div
					className="flex items-center gap-2"
					style={noDragRegionStyle}
				>
					<Button
						type="button"
						variant="outline"
						size="sm"
						aria-pressed={theme === "dark"}
						onClick={() =>
							setTheme((prev) => (prev === "light" ? "dark" : "light"))
						}
						className="border-wisteria-border bg-wisteria-panelStrong/80 text-xs font-semibold text-wisteria-text shadow-sm hover:border-wisteria-accentStrong hover:bg-wisteria-highlight"
					>
						{theme === "light" ? "🌙" : "☀️"}
					</Button>
					<div className="rounded-lg border border-wisteria-borderStrong bg-wisteria-panel/80 px-3 py-1.5 text-xs text-wisteria-text">
						{formattedStatus}
					</div>
				</div>
			</header>

			<div className="flex flex-1 overflow-hidden">
				<aside className="w-80 shrink-0 overflow-y-auto border-r border-wisteria-border bg-wisteria-panel/50 p-4">
					<div className="flex flex-col gap-4">
						<section className="rounded-xl border border-wisteria-border bg-wisteria-panel/80 p-4 shadow-inner shadow-black/20">
							<div className="text-sm font-semibold text-wisteria-text">
								Projects
							</div>
							<div className="mt-3 space-y-2">
								{projects.map((p) => (
									<div
										key={p.id}
										className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 transition ${
											p.id === selectedProjectId
												? "border-wisteria-accentStrong bg-wisteria-highlight"
												: "border-wisteria-border bg-wisteria-panelStrong/60 hover:border-wisteria-borderStrong"
										}`}
										onClick={() => void selectProject(p.id)}
									>
										<div className="min-w-0 flex-1">
											<div className="text-sm font-semibold text-wisteria-text truncate">
												{p.name}
											</div>
											<div className="text-xs text-wisteria-textMuted">
												{chats.filter((c) => c.project_id === p.id).length} chat
												{chats.filter((c) => c.project_id === p.id).length !== 1
													? "s"
													: ""}
											</div>
										</div>
										<Button
											variant="ghost"
											size="sm"
											className="ml-2 shrink-0 text-xs text-wisteria-textSubtle hover:text-wisteria-danger"
											onClick={(e) => {
												e.stopPropagation();
												void deleteProject(p.id);
											}}
										>
											Delete
										</Button>
									</div>
								))}
								{projects.length === 0 && (
									<div className="rounded-lg border border-dashed border-wisteria-borderStrong bg-wisteria-panelStrong/60 px-3 py-2 text-xs text-wisteria-textMuted">
										No projects yet.
									</div>
								)}
							</div>
							<div className="mt-3 flex gap-2">
								<Input
									className="w-full border-wisteria-border bg-wisteria-panelStrong text-sm text-wisteria-text focus-visible:ring-wisteria-accentStrong"
									value={newProjectName}
									onChange={(e) => setNewProjectName(e.target.value)}
									placeholder="New project name"
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											void createProject();
										}
									}}
								/>
								<Button
									onClick={() => void createProject()}
									disabled={!newProjectName.trim()}
									className="bg-wisteria-accent text-white hover:bg-wisteria-accentSoft"
								>
									Add
								</Button>
							</div>
						</section>

						<section className="rounded-xl border border-wisteria-border bg-wisteria-panel/80 p-4 shadow-inner shadow-black/20">
							<div className="text-sm font-semibold text-wisteria-text">
								Chats
							</div>
							<div className="mt-3 space-y-2">
								{chats
									.filter((c) => c.project_id === selectedProjectId)
									.map((c) => (
										<div
											key={c.id}
											className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 transition ${
												c.id === selectedChatId
													? "border-wisteria-accentStrong bg-wisteria-highlight"
													: "border-wisteria-border bg-wisteria-panelStrong/60 hover:border-wisteria-borderStrong"
											}`}
											onClick={() => void selectChat(c.id)}
										>
											<div className="min-w-0 flex-1 truncate text-sm font-semibold text-wisteria-text">
												{c.name}
											</div>
											<Button
												variant="ghost"
												size="sm"
												className="ml-2 shrink-0 text-xs text-wisteria-textSubtle hover:text-wisteria-danger"
												onClick={(e) => {
													e.stopPropagation();
													void deleteChat(c.id);
												}}
											>
												Delete
											</Button>
										</div>
									))}
								{selectedProjectId &&
									chats.filter((c) => c.project_id === selectedProjectId)
										.length === 0 && (
										<div className="rounded-lg border border-dashed border-wisteria-borderStrong bg-wisteria-panelStrong/60 px-3 py-2 text-xs text-wisteria-textMuted">
											No chats for this project.
										</div>
									)}
							</div>
							<div className="mt-3 flex gap-2">
								<Input
									className="w-full border-wisteria-border bg-wisteria-panelStrong text-sm text-wisteria-text focus-visible:ring-wisteria-accentStrong"
									value={newChatName}
									onChange={(e) => setNewChatName(e.target.value)}
									placeholder="New chat title"
									disabled={!selectedProjectId}
									onKeyDown={(e) => {
										if (e.key === "Enter" && selectedProjectId) {
											void createChat();
										}
									}}
								/>
								<Button
									onClick={() => void createChat()}
									disabled={!newChatName.trim() || !selectedProjectId}
									className="bg-wisteria-accent text-white hover:bg-wisteria-accentSoft"
								>
									Add
								</Button>
							</div>
						</section>

						{activeProject && (
							<section className="rounded-xl border border-wisteria-border bg-wisteria-panel/80 p-4 shadow-inner shadow-black/20">
								<div className="text-sm font-semibold text-wisteria-text">
									System prompt
								</div>
								<Textarea
									className="mt-2 w-full border-wisteria-border bg-wisteria-panelStrong text-sm text-wisteria-text focus-visible:ring-wisteria-accentStrong"
									value={systemPrompt}
									onChange={(e) => setSystemPrompt(e.target.value)}
									onBlur={() => void persistSystemPrompt()}
									placeholder="Shared system prompt for all chats in this project"
									rows={4}
								/>
								<Button
									variant="link"
									size="sm"
									className="mt-2 text-xs font-semibold text-wisteria-accentStrong"
									onClick={() => void persistSystemPrompt()}
								>
									Save prompt
								</Button>
							</section>
						)}
					</div>
				</aside>

				<main className="flex flex-1 flex-col overflow-hidden">
					<div className="flex-1 overflow-y-auto p-6">
						<div className="mx-auto max-w-4xl space-y-4">
							{messages.length === 0 && (
								<div className="flex h-full items-center justify-center">
									<div className="rounded-lg border border-dashed border-wisteria-borderStrong bg-wisteria-panelStrong/60 px-6 py-4 text-center text-sm text-wisteria-textMuted">
										No messages yet. Start a conversation below.
									</div>
								</div>
							)}
							{messages.map((msg) => (
								<div
									key={msg.id}
									className="space-y-1"
								>
									<div className="flex items-center gap-3 text-xs text-wisteria-textSubtle">
										<span className="font-semibold capitalize text-wisteria-accentStrong">
											{msg.role}
										</span>
										<span>
											{new Date(msg.created_at).toLocaleTimeString([], {
												hour: "2-digit",
												minute: "2-digit",
											})}
										</span>
									</div>
									<div
										className={`whitespace-pre-wrap rounded-xl border px-4 py-3 text-sm leading-relaxed ${
											msg.role === "user"
												? "border-wisteria-borderStrong bg-wisteria-bubbleUser"
												: "border-wisteria-border bg-wisteria-panelStrong"
										}`}
									>
										{msg.content}
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="border-t border-wisteria-border bg-wisteria-panel/50 p-4">
						<div className="mx-auto max-w-4xl space-y-3">
							<div className="flex gap-3">
								<Select
									value={selectedModelId || undefined}
									onValueChange={(value) => void persistModelSelection(value)}
								>
									<SelectTrigger className="shrink-0 w-fit border-wisteria-border bg-wisteria-panelStrong text-sm text-wisteria-text focus-visible:ring-wisteria-accentStrong">
										<SelectValue placeholder="Pick a model…" />
									</SelectTrigger>
									<SelectContent className="border-wisteria-border bg-wisteria-panelStrong text-wisteria-text">
										{models.map((m) => (
											<SelectItem
												key={`${m.provider}:${m.id}`}
												value={`${m.provider}:${m.id}`}
											>
												[{m.provider}] {m.label}
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
										className="w-full border-wisteria-border bg-wisteria-panelStrong text-sm text-wisteria-text focus-visible:ring-wisteria-accentStrong resize-none"
									/>
								</div>
								<Button
									onClick={() => void sendMessage()}
									disabled={!input.trim() || isSending || !selectedChatId}
									className="shrink-0 self-end bg-wisteria-accent text-white hover:bg-wisteria-accentSoft"
								>
									{isSending ? "Sending…" : "Send"}
								</Button>
							</div>
							{activeProject && (
								<div className="flex items-center gap-2 text-xs text-wisteria-textMuted">
									<span>OpenRouter API key:</span>
									<Input
										className="flex-1 border-wisteria-border bg-wisteria-panelStrong text-xs text-wisteria-text focus-visible:ring-wisteria-accentStrong"
										value={openRouterKey}
										onChange={(e) => setOpenRouterKey(e.target.value)}
										placeholder="sk-..."
										type="password"
									/>
									<Button
										variant="outline"
										size="sm"
										className="border-wisteria-borderStrong text-xs font-semibold text-wisteria-text hover:border-wisteria-accentStrong"
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
