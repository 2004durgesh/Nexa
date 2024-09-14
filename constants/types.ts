// Type definitions
export interface User {
    _id: number;
    name?: string;
    avatar?: string; // Optional, if avatars are used
}

export interface Message {
    _id: string | number;
    text: string;
    createdAt: number | Date;
    user: User;
}

export enum Role {
    user = 'user',
    model = 'model',
}

export interface Part {
    text?: string;
    inlineData?: object; // Define this further if needed
}

export interface Content {
    role: Role;
    parts: Part[];
}

export interface ExploreItem {
    id: string;
    category: string;
    bgColor: string;
    title: string;
    prompt: string;
    image: string;
  }