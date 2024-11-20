import { EventBus } from './event-bus';
import { Operation } from 'rga';

type EventType = {
  push: {
    version: string;
    operations: Operation[];
  };
  pushRequest: {
    ignoreVersions: string[];
  };
};

export const MockSocket = new EventBus<EventType>();
