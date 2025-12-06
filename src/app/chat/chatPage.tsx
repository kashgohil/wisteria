"use client";

import { ModeSelector } from "@/components/mode-selector";
import { ModelSelector } from "@/components/model-selector";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import "highlight.js/styles/github-dark.css"; // or your preferred theme
import { Flower, Paperclip, PauseCircle, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

export default function ChatPage({ chatId }: { chatId?: string }) {
	const [model, setModel] = useState("google/gemini-2.5-flash-lite");
	const [input, setInput] = useState("");

	const modelRef = useRef(model);
	const chatIdRef = useRef(chatId);

	useEffect(() => {
		modelRef.current = model;
	}, [model]);

	useEffect(() => {
		chatIdRef.current = chatId;
	}, [chatId]);

	const { messages, sendMessage, setMessages, status, stop, error } = useChat({
		transport: new DefaultChatTransport({
			api: "/api/chat",
			prepareSendMessagesRequest: async ({ messages }) => {
				return {
					body: {
						messages,
						model: modelRef.current,
						chatId: chatIdRef.current,
					},
				};
			},
		}),
		onError: (error) => {
			console.error("Chat error:", error);
		},
	});

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

	useEffect(() => {
		console.log("chatId", chatId);
		if (messages.length === 0 && chatId) {
			fetch(`/api/chat/${chatId}`)
				.then((res) => res.json())
				.then((data) => setMessages(data))
				.catch((error) => console.error("Failed to load messages:", error));
		}
	}, [chatId, messages.length, setMessages]);

	console.log({ messages, status });

	return (
		<>
			<div className="w-full h-full overflow-y-auto">
				<div
					className={`relative pb-40 p-4 flex flex-col gap-4 items-center justify-center w-full lg:max-w-1/2 sm:max-w-full mx-auto ${
						messages.length === 0 && "h-full"
					}`}
				>
					{input.trim() === "" && messages.length === 0 && (
						<Flower className="text-wisteria-500 h-[40%] w-[40%] opacity-30 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
					)}
					{messages.map((message) => (
						<div
							key={message.id}
							className={`p-4 rounded-lg ${
								message.role === "assistant"
									? "w-full"
									: "bg-accent/10 max-w-2/3 backdrop-blur-sm ml-auto"
							}`}
						>
							<div className="prose prose-sm dark:prose-invert max-w-none">
								{message.parts.map((part, partIndex) => {
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
															<div className="relative">
																<div className="flex items-center justify-between bg-gray-800 px-4 py-2 text-xs text-gray-300 rounded-t-md">
																	<span>{match[1]}</span>
																	<button
																		onClick={() =>
																			navigator.clipboard.writeText(
																				String(children),
																			)
																		}
																		className="hover:text-white"
																	>
																		Copy
																	</button>
																</div>
																<pre className="!mt-0 !rounded-t-none">
																	<code className={className}>{children}</code>
																</pre>
															</div>
														) : (
															<code className="bg-gray-800 px-1 py-0.5 rounded text-sm">
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
				<div className="p-4 border border-wisteria-500 rounded-lg w-full lg:max-w-1/2 sm:max-w-full mx-auto relative bg-accent/10 backdrop-blur-3xl">
					<form
						onSubmit={handleSubmit}
						className="flex flex-col gap-4"
					>
						<Textarea
							className="border-none outline-none focus-within:outline-none resize-none min-h-[2.75rem] py-2.5 px-0 !ring-0 shadow-none"
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
