declare type Serialized = [
    'object' | 'array' | 'bigint' | 'date' | 'error' | 'undefined' | 'native',
    any?
];
export declare function serialize(data: any): Serialized;
export declare function deserialize(serialized: Serialized): any;
export {};
