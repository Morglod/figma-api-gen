export type PropType = {
    name: string,
    type: string,
    desc: string,
    default: string,
    enumValues: string[],
    isEnum: boolean,
    optional: boolean,
    mayBeNull?: boolean,
};

export type ObjectType = {
    extends: string,
    name: string,
    desc: string,
    props: PropType[],
    enumValues: string[],
    isEnum: boolean,
};
