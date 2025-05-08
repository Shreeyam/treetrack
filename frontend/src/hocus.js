import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";

// Function to create and initialize a Hocuspocus provider
export const initializeHocusProvider = (projectId) => {
  console.log(`Initializing Hocuspocus provider for project: ${projectId}`);
  
  // Connect it to the backend
  const provider = new HocuspocusProvider({
    url: `ws://localhost:3001/collaboration/${projectId}`,
    name: `projectdocument.${projectId}`,
  });

  // Define `tasks` as an Array
  const tasks = provider.document.getArray("tasks");

  // Listen for changes
  tasks.observe(() => {
    console.log("tasks were modified");
  });
  tasks.push(["buy milk"]);
  // Return provider and tasks for external use
  return { provider, tasks };
};

// If we want to run the original script code when this module is imported
// const defaultProvider = new HocuspocusProvider({
//   url: "ws://localhost:3001/collaboration/5",
//   name: "example-document2",
// });

// // Define `tasks` as an Array
// const tasks = defaultProvider.document.getArray("tasks");

// // Listen for changes
// tasks.observe(() => {
//   console.log("tasks were modified");
// });

// // Add a new task
// tasks.push(["buy milk"]);
// tasks.push(["buy milk"]);
// tasks.push(["buy milk"]);
// tasks.push(["buy milk"]);

//export { initializeHocusProvider };
