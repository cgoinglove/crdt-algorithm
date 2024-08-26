import { EventBus } from './event-bus';
import { Operation } from 'rga';

type EventType = {
  commit: {
    author: string;
    operations: Operation[];
    version:string
  };
};

export const MockSocket = new EventBus<EventType>();
