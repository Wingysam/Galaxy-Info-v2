declare type Serialized = {
    bigints: string[];
    objects: string[];
    arrays: string[];
    dates: string[];
    errors: string[];
    data: any;
};
export declare function serialize(data: Object): Serialized;
export declare function deserialize(serialized: Serialized): any;
export {};
