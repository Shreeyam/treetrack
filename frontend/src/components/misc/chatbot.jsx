// src/components/ChatBot.jsx
import React, { useState } from "react";
// Adjust these imports if your project structure is different.
// If you don't have a Card component, you can simply use <div> elements with the provided Tailwind classes.
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoaderCircle } from "lucide-react"; // Assuming you have a loader component

const ChatBot = ({ isOpen, currentProject, nodes, dependencies, handleGenerativeEdit, handleAcceptNodeChanges, handleRejectNodeChanges }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false); // Add loading state
    const [pendingChanges, setPendingChanges] = useState(null); // State to hold pending changes

    // Function to handle sending a message
    const handleSendMessage = (event) => {
        event.preventDefault();
        if (!input.trim() || isLoading || pendingChanges) return; // Prevent sending if loading or changes pending

        // Add the user's message to the chat
        const userMessage = { text: input, sender: "user" };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setInput("");
        setIsLoading(true); // Set loading to true
        setPendingChanges(null); // Clear any previous pending changes

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
                user_input: userMessage.text, // Use the captured user message text
                project_id: currentProject,
                current_state: { tasks: nodeData, dependencies: dependencyData },
            }),
        })
            .then((response) => response.json())
            .then((json) => {
                // Add bot summary message
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { text: json.data.summary, sender: "bot" },
                ]);
                // Store the proposed changes
                setPendingChanges(json.data);
                handleGenerativeEdit(json.data);
            })
            .catch((error) => {
                console.error("Error:", error);
                // Optionally add an error message to the chat
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { text: "Sorry, something went wrong.", sender: "bot" },
                ]);
            })
            .finally(() => {
                setIsLoading(false); // Set loading to false regardless of success or error
            });
    };

    // Function to accept the proposed changes
    const handleAcceptChanges = () => {
        if (!pendingChanges) return;
        setMessages((prevMessages) => [
            ...prevMessages,
            { text: "Changes applied.", sender: "system" }, // Optional system message
        ]);
        setPendingChanges(null); // Clear pending changes
        handleAcceptNodeChanges();
    };

    // Function to reject the proposed changes
    const handleRejectChanges = () => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { text: "Changes discarded.", sender: "system" }, // Optional system message
        ]);
        setPendingChanges(null); // Clear pending changes
        handleRejectNodeChanges();
    };

    return (
        (isOpen) && (
            // Fixed positioning to ensure the chatbot card remains in view at the bottom-right of the page
            < div className="fixed bottom-4 right-4 z-50" >
                <Card className="w-96 shadow-lg p-4">
                    <CardContent className="bg-white h-80 px-0 overflow-y-auto">
                        {messages.length === 0 ? (
                            <p className="text-gray-500 text-sm">Start chatting...</p>
                        ) : (
                            messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`my-1 rounded text-sm p-2 transition-all duration-300 ease-in-out ${msg.sender === "user"
                                        ? "bg-primary/10 text-right ml-auto max-w-[80%]"
                                        : msg.sender === "bot"
                                            ? "bg-gray-100 text-left mr-auto max-w-[80%]"
                                            : "bg-white-100 text-center mx-auto max-w-[90%] text-xs italic" // System message style
                                        }`}
                                >
                                    {msg.text}
                                </div>
                            ))
                        )}
                        {/* Show loading indicator */}
                        {isLoading && (
                            <div className="my-1 rounded text-sm p-2 bg-gray-100 text-left mr-auto max-w-[80%] italic text-gray-500 flex items-center transition-opacity duration-300 ease-in-out"> {/* Added flex, items-center and transition */}
                                <LoaderCircle className="animate-spin mr-2 h-4 w-4" /> Generating... {/* Added margin, size */}
                            </div>
                        )}
                        {/* Show Accept/Reject buttons if there are pending changes */}
                        {pendingChanges && !isLoading && (
                            <div className="mt-2 flex justify-end space-x-2">
                                <Button variant="destructive" size="sm" onClick={handleRejectChanges}>
                                    Reject
                                </Button>
                                <Button variant="default" size="sm" onClick={handleAcceptChanges}>
                                    Accept
                                </Button>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="px-0 pt-4"> {/* Added pt-4 for spacing */}
                        <Input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 w-full mr-2"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !isLoading && !pendingChanges) { // Prevent Enter if loading or changes pending
                                    handleSendMessage(e);
                                }
                            }}
                            disabled={isLoading || !!pendingChanges} // Disable input while loading or changes pending
                        />
                        <Button type="primary" onClick={handleSendMessage} disabled={isLoading || !!pendingChanges}> {/* Disable button while loading or changes pending */}
                            Send
                        </Button>
                    </CardFooter>
                </Card>
            </div >
        )
    );
};

export default ChatBot;
