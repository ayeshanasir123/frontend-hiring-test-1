import Pusher from 'pusher-js';

const notification = new Pusher('d44e3d910d38a928e0be', {
    cluster: 'eu',
    authEndpoint: 'https://frontend-test-api.aircall.dev/pusher/auth',
});

export const subscribeToCallUpdates = (callback) => {
    const channel = notification.subscribe('private-aircall');
    channel.bind('update-call', (data) => {
        callback(data);
    });
};