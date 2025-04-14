// src/components/ChatBot.jsx
import React, { useState } from "react";
// Adjust these imports if your project structure is different.
// If you don't have a Card component, you can simply use <div> elements with the provided Tailwind classes.
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoaderCircle } from "lucide-react"; // Assuming you have a loader component
const ChatBot = ({ currentProject, nodes, dependencies, handleGenerativeEdit }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false); // Add loading state

    // Function to handle sending a message
    const handleSendMessage = (event) => {
        console.log("Sending message:", input);
        event.preventDefault();
        if (!input.trim() || isLoading) return; // Prevent sending if loading

        // Add the user's message to the chat
        const userMessage = { text: input, sender: "user" };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setInput("");
        setIsLoading(true); // Set loading to true

        const nodeData = nodes.map((node) => ({
            id: node.id,
            title: node.title,
            posX: node.position.X,
            posY: node.position.Y,
            completed: node.completed,
            project_id: node.project_id,
            color: node.color,
            locked: node.locked,
            draft: 0
        }));

        const dependencyData = dependencies.map((dependency) => ({
            id: dependency.id,
            from_task: dependency.source,
            to_task: dependency.target,
            project_id: dependency.project_id,
        }));

        console.log("Node data:", nodeData);
        console.log("Dependency data:", dependencyData);
        console.log("Current project ID:", currentProject);

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
                console.log("Response from server:", json);
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { text: json.data.summary, sender: "bot" },
                ]);
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

    return (
        // Fixed positioning to ensure the chatbot card remains in view at the bottom-right of the page
        <div className="fixed bottom-4 right-4 z-50">
            <Card className="w-96 shadow-lg p-4">
                <CardContent className="bg-white h-80 px-0 overflow-y-auto">
                    {messages.length === 0 ? (
                        <p className="text-gray-500 text-sm">Start chatting...</p>
                    ) : (
                        messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`my-1 rounded text-sm p-2 transition-all duration-300 ease-in-out ${msg.sender === "user" // Added transition classes
                                    ? "bg-primary/10 text-right ml-auto max-w-[80%]" // Style user messages
                                    : "bg-gray-100 text-left mr-auto max-w-[80%]" // Style bot messages
                                    }`}
                            >
                                {msg.text}
                            </div>
                        ))
                    )}
                    {/* Show loading indicator */}
                    {isLoading && (
                        <div className="my-1 rounded text-sm p-2 bg-gray-100 text-left mr-auto max-w-[80%] italic text-gray-500 flex items-center transition-opacity duration-300 ease-in-out"> {/* Added flex, items-center and transition */}
                            <LoaderCircle className="animate-spin mr-2 h-4 w-4"/> Generating... {/* Added margin, size */}
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
                            if (e.key === "Enter" && !isLoading) { // Prevent Enter key submission while loading
                                handleSendMessage(e);
                            }
                        }}
                        disabled={isLoading} // Disable input while loading
                    />
                    <Button type="primary" onClick={handleSendMessage} disabled={isLoading}> {/* Disable button while loading */}
                        Send
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default ChatBot;
