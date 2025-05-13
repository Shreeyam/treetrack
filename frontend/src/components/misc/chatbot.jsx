// src/components/ChatBot.jsx
import React, { useState, useRef, useEffect } from "react";
// Adjust these imports if your project structure is different.
// If you don't have a Card component, you can simply use <div> elements with the provided Tailwind classes.
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"; // Added CardTitle
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoaderCircle, Send, X, User, Bot } from "lucide-react"; // Added Send, X, User, Bot icons

const ChatBot = ({ isOpen, onClose, currentProject, nodes, dependencies, handleGenerativeEdit, handleAcceptNodeChanges, handleRejectNodeChanges }) => { // Added onClose prop
    const [messages, setMessages] = useState([
        { text: "Hi! How can I help with your project?", sender: "bot" } // Initial bot message
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [pendingChanges, setPendingChanges] = useState(null);
    const messagesEndRef = useRef(null); // Ref for scrolling
    const textareaRef = useRef(null); // Ref for input focus

    // Function to scroll to the bottom of the messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Scroll to bottom whenever messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-focus the input field when the chatbot opens
    useEffect(() => {
        if (isOpen && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isOpen]);

    // Function to handle sending a message
    const handleSendMessage = (event) => {
        event.preventDefault();
        if (!input.trim() || isLoading || pendingChanges) return;

        const userMessage = { text: input, sender: "user" };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setInput("");
        setIsLoading(true);
        setPendingChanges(null);

        const nodeData = nodes.map((node) => ({
            id: node.id,
            title: node.data.label,
            posX: node.position.x,
            posY: node.position.y,
            completed: node.data.completed,
            project_id: currentProject,
            color: node.data.color,
            locked: node.locked,
            draft: 0
        }));

        const dependencyData = dependencies.map((dependency) => ({
            id: dependency.id,
            from_task: dependency.source,
            to_task: dependency.target,
            project_id: dependency.project_id,
        }));

        fetch("/api/generate", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_input: userMessage.text, // Keep the latest input separate for clarity if needed
                chat_history: messages, // Send the whole message history
                project_id: currentProject,
                current_state: { tasks: nodeData, dependencies: dependencyData },
            }),
        })
            .then((response) => {
                if (!response.ok) {
                    // Handle HTTP errors
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then((json) => {
                if (json.data && json.data.summary) {
                    // Add the bot's summary message regardless
                    setMessages((prevMessages) => [
                        ...prevMessages,
                        { text: json.data.summary, sender: "bot" },
                    ]);

                    // Check if changes are actually required
                    if (json.data.no_changes_required) {
                        // No changes needed, just display the summary
                        setPendingChanges(null); // Ensure no pending changes UI
                    } else {
                        // Changes are proposed, show accept/reject
                        setPendingChanges(json.data);
                        handleGenerativeEdit(json.data);
                    }
                } else {
                    // Handle cases where the expected data is missing
                    throw new Error("Invalid response format from server.");
                }
            })
            .catch((error) => {
                console.error("Error:", error);
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { text: `Sorry, something went wrong: ${error.message}`, sender: "error" }, // Use 'error' sender type
                ]);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    // Function to accept the proposed changes
    const handleAcceptChanges = () => {
        if (!pendingChanges) return;
        setMessages((prevMessages) => [
            ...prevMessages,
            { text: "Changes applied.", sender: "system" },
        ]);
        setPendingChanges(null);
        handleAcceptNodeChanges();
    };

    // Function to reject the proposed changes
    const handleRejectChanges = () => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { text: "Changes discarded.", sender: "system" },
        ]);
        setPendingChanges(null);
        handleRejectNodeChanges();
    };

    return (
        (isOpen) && (
            <div className="fixed bottom-4 right-4 z-50">
                {/* Increased width, added flex column layout */}
                <Card className="w-[400px] shadow-lg flex flex-col max-h-[60vh] py-0">
                    {/* Added CardHeader with title and close button */}
                    <CardHeader className="flex flex-row items-center justify-between p-3 [.border-b]:pb-3 border-b">
                        <CardTitle className="text-base font-semibold">Project Assistant</CardTitle>
                        <Button variant="link" size="icon" onClick={onClose} className="h-6 w-6">
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    {/* Adjusted padding, height, added flex-grow and space-y-2 */}
                    <CardContent className="flex-grow bg-white p-3 overflow-y-auto space-y-2 !gap-0"> {/* Added space-y-2 */}
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                // Adjusted conditional classes for full width on system/error
                                className={`flex items-start gap-2 text-sm ${
                                    msg.sender === "user" ? "ml-auto flex-row-reverse max-w-[85%]" :
                                    msg.sender === "bot" ? "mr-auto max-w-[85%]" :
                                    "w-full" // System and error messages take full width
                                }`}
                            >
                                {/* Icon based on sender */}
                                <span className={`flex-shrink-0 p-1.5 rounded-full ${
                                    msg.sender === 'user' ? 'bg-primary/10 text-primary' :
                                    msg.sender === 'bot' ? 'bg-gray-200 text-gray-700' :
                                    'hidden' // Hide icon for system/error
                                }`}>
                                    {msg.sender === 'user' ? <User size={16} /> : msg.sender === 'bot' ? <Bot size={16} /> : null}
                                </span>
                                {/* Message bubble styling */}
                                <div
                                    // Added w-full for system/error messages to ensure inner div spans
                                    className={`rounded-lg px-3 py-2 ${
                                        msg.sender === "user"
                                            ? "bg-primary/10"
                                            : msg.sender === "bot"
                                                ? "bg-gray-100 text-gray-900"
                                                : msg.sender === "system"
                                                    ? "bg-blue-100 text-blue-400 text-xs italic text-center w-full" // System message style
                                                    : "bg-destructive/10 text-destructive w-full" // Error message style
                                    }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="flex items-center justify-center p-2 text-gray-500">
                                <LoaderCircle className="animate-spin mr-2 h-4 w-4" /> Thinking...
                            </div>
                        )}
                        {/* Accept/Reject buttons */}
                        {pendingChanges && !isLoading && (
                            // Added w-full to the container div for buttons
                            <div className="mt-2 p-2 bg-warning/10 border border-warning/20 rounded-md flex justify-end space-x-2 w-full">
                                <span className="text-sm text-warning mr-auto self-center">Apply proposed changes?</span>
                                <Button variant="destructive" size="sm" onClick={handleRejectChanges}>
                                    Reject
                                </Button>
                                <Button variant="default" size="sm" onClick={handleAcceptChanges}>
                                    Accept
                                </Button>
                            </div>
                        )}
                        {/* Element to scroll to */}
                        <div ref={messagesEndRef} />
                    </CardContent>
                    {/* Adjusted padding and added border-t */}
                    <CardFooter className="p-3 border-t [.border-t]:pt-3">
                        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
                            <Textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your request..."
                                className="flex-1 min-h-0 height-auto"
                                ref={textareaRef} /* Add the ref to the input element */
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey && !isLoading && !pendingChanges) { // Prevent Enter if loading or changes pending, allow shift+enter for newline
                                        e.preventDefault(); // Prevent default newline on Enter
                                        handleSendMessage(e);
                                    }
                                }}
                                disabled={isLoading || !!pendingChanges}
                                rows={1}
                            />
                            {/* Replaced text button with icon button */}
                            <Button type="submit" size="icon" disabled={isLoading || !!pendingChanges || !input.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            </div>
        )
    );
};

export default ChatBot;
