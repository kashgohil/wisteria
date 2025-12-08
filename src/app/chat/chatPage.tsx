"use client";

import { ThinkingBlock } from "@/components/chat/thinking-block";
import { ModeSelector } from "@/components/mode-selector";
import { ModelSelector } from "@/components/model-selector";
import { useChatContext } from "@/components/providers/chat-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import "highlight.js/styles/github-dark.css"; // or your preferred theme
import { Flower, Paperclip, PauseCircle, Send } from "lucide-react";
import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

export default function ChatPage({
	chatId: initialChatId,
}: {
	chatId?: string;
}) {
	const {
		messages,
		sendMessage,
		status,
		stop,
		error,
		input,
		setInput,
		model,
		setModel,
		chatId,
		initializeChat,
	} = useChatContext();

	// Initialize/switch chat when chatId changes
	// Only re-initialize if the initialChatId from the URL differs from the current chatId
	useEffect(() => {
		// Skip if we're already on the correct chat (e.g., after URL update via history.replaceState)
		if (initialChatId === chatId) {
			return;
		}
		initializeChat(initialChatId);
	}, [initialChatId, chatId, initializeChat]);

	const submitMessage = () => {
		if (input.trim()) {
			sendMessage({ text: input });
			setInput("");
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		submitMessage();
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			submitMessage();
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setInput(e.target.value);
	};

	return (
		<>
			<div className="w-full h-full overflow-y-auto pb-36">
				<div
					className={`relative p-4 md:p-6 flex flex-col gap-6 items-center justify-center w-full lg:max-w-1/2 md:max-w-2/3 sm:max-w-full mx-auto ${
						messages.length === 0 && "h-full"
					}`}
				>
					{input.trim() === "" && messages.length === 0 && (
						<Flower className="text-wisteria-500 h-[40%] w-[40%] opacity-30 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
					)}
					{messages.map((message) => (
						<div
							key={message.id}
							className={`rounded-xl ${
								message.role === "assistant"
									? "w-full"
									: "bg-wisteria-500/10 border border-wisteria-500/20 px-5 max-w-[85%] backdrop-blur-sm ml-auto"
							}`}
						>
							<div className="prose prose-lg dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:my-5 prose-headings:mt-8 prose-headings:mb-4 prose-headings:font-semibold prose-ul:my-5 prose-ol:my-5 prose-li:my-2 prose-pre:my-5 prose-blockquote:my-5 prose-blockquote:border-wisteria-500 prose-blockquote:pl-5 prose-blockquote:italic prose-a:text-wisteria-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-code:text-wisteria-300">
								{message.parts.map((part, partIndex) => {
									if (part.type === "reasoning") {
										return (
											<ThinkingBlock
												key={partIndex}
												reasoning={part.text}
												isStreaming={part.state === "streaming"}
											/>
										);
									}
									if (part.type === "text") {
										return (
											<ReactMarkdown
												key={partIndex}
												remarkPlugins={[remarkGfm]}
												rehypePlugins={[rehypeHighlight]}
												components={{
													code: (props) => {
														const { inline, className, children } = props as {
															inline?: boolean;
															className?: string;
															children: React.ReactNode;
														};
														const match = /language-(\w+)/.exec(
															className || "",
														);
														return !inline && match ? (
															<div className="relative group my-4 rounded-lg overflow-hidden border border-white/10">
																<div className="flex items-center justify-between bg-black-500 px-4 py-2.5 text-xs text-white-500">
																	<span className="font-medium">
																		{match[1]}
																	</span>
																	<button
																		onClick={() =>
																			navigator.clipboard.writeText(
																				String(children),
																			)
																		}
																		className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-white-200 px-2 py-1 rounded hover:bg-white/10"
																	>
																		Copy
																	</button>
																</div>
																<pre className="!mt-0 !rounded-t-none !bg-black-600 p-4 overflow-x-auto">
																	<code
																		className={`${className} text-sm leading-relaxed`}
																	>
																		{children}
																	</code>
																</pre>
															</div>
														) : (
															<code className="bg-wisteria-500/20 text-wisteria-300 px-1.5 py-0.5 rounded-md text-[0.9em] font-mono">
																{children}
															</code>
														);
													},
												}}
											>
												{part.text}
											</ReactMarkdown>
										);
									}
									// Handle other part types (images, tool calls, etc.)
									return null;
								})}
							</div>
						</div>
					))}
					{status === "streaming" && (
						<div className="text-accent">
							<p className="text-sm">Thinking...</p>
						</div>
					)}
					{status === "error" && (
						<div>
							<p className="text-sm text-red-500">
								Error: {error?.message || "Something went wrong"}
							</p>
						</div>
					)}
				</div>
			</div>
			<div className="flex flex-col gap-4 absolute bottom-2 left-0 right-0">
				<div className="p-4 border border-wisteria-500 rounded-lg w-full lg:max-w-1/2 md:max-w-2/3 sm:max-w-full mx-auto relative bg-accent/10 backdrop-blur-3xl">
					<form
						onSubmit={handleSubmit}
						className="flex flex-col gap-4"
					>
						<Textarea
							className="border-none outline-none focus-within:outline-none resize-none min-h-[2.75rem] p-0 !ring-0 shadow-none"
							placeholder="Type your message here..."
							id="message"
							value={input}
							onChange={handleInputChange}
							onKeyDown={handleKeyDown}
							disabled={status === "streaming"}
						/>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<ModelSelector
									value={model}
									onValueChange={setModel}
								/>
								<ModeSelector />
							</div>

							<div className="flex items-center gap-2">
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											className="bg-transparent hover:bg-accent border-accent"
											variant="outline"
											interactive
											size="icon"
											type="button"
										>
											<Paperclip />
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										<p>Attach a file</p>
									</TooltipContent>
								</Tooltip>
								{status !== "streaming" ? (
									<Button
										type="submit"
										size="icon"
										disabled={!input.trim()}
										className="bg-wisteria-500 hover:bg-wisteria-600 text-accent-foreground"
									>
										<Send className="h-4 w-4" />
									</Button>
								) : (
									<Button
										size="icon"
										onClick={stop}
										disabled={!input.trim()}
										className="bg-wisteria-500 hover:bg-wisteria-600 text-accent-foreground"
									>
										<PauseCircle className="h-4 w-4" />
									</Button>
								)}
							</div>
						</div>
					</form>
				</div>
			</div>
		</>
	);
}
