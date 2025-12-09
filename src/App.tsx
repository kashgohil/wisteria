import { useEffect, useMemo, useRef, useState } from "react";
import "./index.css";

type Project = Awaited<
	ReturnType<typeof window.wisteria.projects.list>
>[number];
type Chat = Awaited<ReturnType<typeof window.wisteria.chats.list>>[number];
type Message = Awaited<
	ReturnType<typeof window.wisteria.messages.list>
>[number];
type ModelOption = { id: string; label: string; provider: string };

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

	const composerRef = useRef<HTMLTextAreaElement | null>(null);

	useEffect(() => {
		void bootstrap();
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

		try {
			const response = await window.wisteria.models.send({
				provider: provider as "ollama" | "lmstudio" | "openrouter",
				model: modelId,
				messages: history,
			});
			const assistantMsg = await window.wisteria.messages.append(
				selectedChatId,
				"assistant",
				response.content || "(empty response)",
			);
			setMessages((prev) => [...prev, assistantMsg]);
			setStatus("Ready");
		} catch (err) {
			console.error(err);
			setStatus("Failed to send");
			const errorMsg = await window.wisteria.messages.append(
				selectedChatId,
				"assistant",
				`(Error) ${String(err)}`,
			);
			setMessages((prev) => [...prev, errorMsg]);
		} finally {
			setIsSending(false);
			composerRef.current?.focus();
		}
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
		<div className="min-h-screen bg-slate-950 text-slate-100">
			<header className="flex items-start justify-between gap-3 border-b border-slate-800 bg-slate-900/80 px-6 py-4 shadow-lg shadow-black/30">
				<div className="space-y-1">
					<div className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
						Wisteria
					</div>
					<h1 className="text-xl font-bold text-slate-50">Local + BYOK Chat</h1>
					<p className="text-sm text-slate-400">
						Projects group chats, models are selectable, data stays local.
					</p>
				</div>
				<div className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-200">
					{formattedStatus}
				</div>
			</header>

			<div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-6 py-6 lg:grid-cols-[320px_1fr]">
				<aside className="flex flex-col gap-4">
					<section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-inner shadow-black/20">
						<div className="text-sm font-semibold text-slate-100">Projects</div>
						<div className="mt-3 space-y-2">
							{projects.map((p) => (
								<div
									key={p.id}
									className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 transition ${
										p.id === selectedProjectId
											? "border-indigo-500/70 bg-indigo-950/40"
											: "border-slate-800 bg-slate-900/40 hover:border-slate-700"
									}`}
									onClick={() => void selectProject(p.id)}
								>
									<div>
										<div className="text-sm font-semibold text-slate-100">
											{p.name}
										</div>
										<div className="text-xs text-slate-500">
											Chats: {chats.filter((c) => c.project_id === p.id).length}
										</div>
									</div>
									<button
										className="text-xs text-slate-400 hover:text-rose-400"
										onClick={(e) => {
											e.stopPropagation();
											void deleteProject(p.id);
										}}
									>
										Delete
									</button>
								</div>
							))}
							{projects.length === 0 && (
								<div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 px-3 py-2 text-xs text-slate-500">
									No projects yet.
								</div>
							)}
						</div>
						<div className="mt-3 flex gap-2">
							<input
								className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-transparent transition focus:ring-indigo-500"
								value={newProjectName}
								onChange={(e) => setNewProjectName(e.target.value)}
								placeholder="New project name"
							/>
							<button
								onClick={() => void createProject()}
								disabled={!newProjectName.trim()}
								className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
							>
								Add
							</button>
						</div>
					</section>

					{activeProject && (
						<section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-inner shadow-black/20">
							<div className="text-sm font-semibold text-slate-100">
								System prompt
							</div>
							<textarea
								className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-transparent transition focus:ring-indigo-500"
								value={systemPrompt}
								onChange={(e) => setSystemPrompt(e.target.value)}
								onBlur={() => void persistSystemPrompt()}
								placeholder="Shared system prompt for all chats in this project"
								rows={5}
							/>
							<button
								className="mt-2 text-xs font-semibold text-indigo-300 underline-offset-2 hover:underline"
								onClick={() => void persistSystemPrompt()}
							>
								Save prompt
							</button>
						</section>
					)}

					{activeProject && (
						<section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-inner shadow-black/20">
							<div className="text-sm font-semibold text-slate-100">
								Model selection
							</div>
							<select
								className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-transparent transition focus:ring-indigo-500"
								value={selectedModelId}
								onChange={(e) => void persistModelSelection(e.target.value)}
							>
								<option value="">Pick a model…</option>
								{models.map((m) => (
									<option
										key={`${m.provider}:${m.id}`}
										value={`${m.provider}:${m.id}`}
									>
										[{m.provider}] {m.label}
									</option>
								))}
							</select>
							<div className="mt-2 text-xs text-slate-500">
								Ollama/LM Studio auto-detected. OpenRouter needs an API key.
							</div>
							<input
								className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-transparent transition focus:ring-indigo-500"
								value={openRouterKey}
								onChange={(e) => setOpenRouterKey(e.target.value)}
								placeholder="OpenRouter API key"
							/>
							<button
								className="mt-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-600 disabled:opacity-60"
								onClick={() => void saveOpenRouter()}
								disabled={!openRouterKey.trim()}
							>
								Save key
							</button>
						</section>
					)}
				</aside>

				<main className="flex flex-col gap-4">
					<section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-inner shadow-black/20">
						<div className="text-sm font-semibold text-slate-100">
							Chats in project
						</div>
						<div className="mt-3 flex flex-wrap gap-2">
							{chats
								.filter((c) => c.project_id === selectedProjectId)
								.map((c) => (
									<div
										key={c.id}
										className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
											c.id === selectedChatId
												? "border-indigo-500/70 bg-indigo-950/40 text-indigo-100"
												: "border-slate-800 bg-slate-900/40 text-slate-200 hover:border-slate-700"
										}`}
										onClick={() => void selectChat(c.id)}
									>
										<span>{c.name}</span>
										<button
											className="text-[11px] text-slate-400 hover:text-rose-400"
											onClick={(e) => {
												e.stopPropagation();
												void deleteChat(c.id);
											}}
										>
											Delete
										</button>
									</div>
								))}
							{selectedProjectId &&
								chats.filter((c) => c.project_id === selectedProjectId)
									.length === 0 && (
									<div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 px-3 py-2 text-xs text-slate-500">
										No chats for this project.
									</div>
								)}
						</div>
						<div className="mt-3 flex gap-2">
							<input
								className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-transparent transition focus:ring-indigo-500"
								value={newChatName}
								onChange={(e) => setNewChatName(e.target.value)}
								placeholder="New chat title"
								disabled={!selectedProjectId}
							/>
							<button
								onClick={() => void createChat()}
								disabled={!newChatName.trim() || !selectedProjectId}
								className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
							>
								New chat
							</button>
						</div>
					</section>

					<section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-inner shadow-black/20">
						<div className="text-sm font-semibold text-slate-100">
							Conversation
						</div>
						<div
							className="mt-3 flex max-h-[55vh] flex-col gap-3 overflow-y-auto pr-1"
							aria-live="polite"
						>
							{messages.map((msg) => (
								<div
									key={msg.id}
									className="space-y-1"
								>
									<div className="flex items-center gap-3 text-xs text-slate-400">
										<span className="font-semibold capitalize text-indigo-300">
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
										className={`max-w-3xl whitespace-pre-wrap rounded-xl border px-4 py-3 text-sm leading-relaxed ${
											msg.role === "user"
												? "border-slate-700 bg-slate-800"
												: "border-slate-800 bg-slate-900"
										}`}
									>
										{msg.content}
									</div>
								</div>
							))}
							{messages.length === 0 && (
								<div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 px-3 py-2 text-xs text-slate-500">
									No messages yet.
								</div>
							)}
						</div>

						<div className="mt-4 space-y-2 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
							<label
								htmlFor="chat-input"
								className="sr-only"
							>
								Chat input
							</label>
							<textarea
								id="chat-input"
								ref={composerRef}
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={handleComposerKey}
								placeholder="Type a message and hit Enter to send"
								rows={3}
								disabled={!selectedChatId || isSending}
								className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-transparent transition focus:ring-indigo-500 disabled:opacity-60"
							/>
							<div className="flex justify-end">
								<button
									onClick={() => void sendMessage()}
									disabled={!input.trim() || isSending || !selectedChatId}
									className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
								>
									{isSending ? "Sending…" : "Send"}
								</button>
							</div>
						</div>
					</section>
				</main>
			</div>
		</div>
	);
}

export default App;
