import type { Socket } from 'node:net';
import type { TcpServerEvents } from './server.ts';

export const handleTcpConnection = (socket: Socket, events: TcpServerEvents): void => {
  const clientLabel = `${socket.remoteAddress ?? 'unknown'}:${socket.remotePort ?? '0'}`;
  events.emit('connect', { clientLabel });

  let buffer = Buffer.alloc(0);

  socket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);

    while (buffer.length >= 2) {
      const expectedLength = buffer.readUInt16BE(0);

      if (!expectedLength) {
        events.emit('error', { clientLabel, error: new Error('Invalid MLI') });
        buffer = buffer.subarray(2);
        continue;
      }

      if (buffer.length < expectedLength + 2) break;

      const message = buffer.subarray(0, expectedLength + 2);
      buffer = buffer.subarray(expectedLength + 2);

      events.emit('message', { socket, message, clientLabel });
    }
  });

  socket.on('close', () => {
    events.emit('disconnect', { clientLabel });
  });

  socket.on('error', (err) => {
    events.emit('error', { clientLabel, error: err });
    socket.destroy();
  });
};
