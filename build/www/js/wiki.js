// simple client-side script to reload when any wiki update occurs
// requires socket.io client library

if (typeof io !== 'undefined') {
    const socket = io();
    socket.on('wiki:update', function (data) {
        // naive approach: full reload to reflect changes
        console.log('Wiki updated, reloading page');
        location.reload();
    });
}
