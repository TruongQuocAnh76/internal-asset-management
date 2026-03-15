export class ChatRoomNotFoundError extends Error {
  constructor(message = 'Chat room not found') {
    super(message);
    this.name = 'ChatRoomNotFoundError';
  }
}

export class MessageNotFoundError extends Error {
  constructor(message = 'Message not found') {
    super(message);
    this.name = 'MessageNotFoundError';
  }
}

export class ParticipantNotFoundError extends Error {
  constructor(message = 'One or more participants not found') {
    super(message);
    this.name = 'ParticipantNotFoundError';
  }
}

export class DirectChatExistsError extends Error {
  constructor(message = 'Direct chat between the two users already exists') {
    super(message);
    this.name = 'DirectChatExistsError';
  }
}
