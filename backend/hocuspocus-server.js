// import { Server } from '@hocuspocus/server'
// import { SQLite } from '@hocuspocus/extension-sqlite'

// const server = new Server({
//     port: 1234,

//     async onConnect() {
//         console.log('🔮')
//     },
//     async onAuthenticate(data) {
//         const { token } = data;

//         // Example test if a user is authenticated with a token passed from the client
//         if (token !== "super-secret-token") {
//             throw new Error("Not authorized!");
//         }
//     },
//     extensions: [
//         new SQLite({
//             database: 'yjs.db',
//         }),
//     ],
// });
// export default server;
