export const nodeTypeCodeStr = (params: {
    export?: boolean,
}) => (
`
${params.export ? 'export ' : ''}type NodeTypes = {
    /** The root node */
    DOCUMENT: DOCUMENT,
    /** Represents a single page */
    CANVAS: CANVAS,
    /** A node of fixed size containing other nodes */
    FRAME: FRAME,
    /** A logical grouping of nodes */
    GROUP: GROUP,
    /** A vector network, consisting of vertices and edges */
    VECTOR: VECTOR,
    /** A group that has a boolean operation applied to it */
    BOOLEAN_OPERATION: BOOLEAN_OPERATION,
    /** A regular star shape */
    STAR: STAR,
    /** A straight line */
    LINE: LINE,
    /** An ellipse */
    ELLIPSE: ELLIPSE,
    /** A regular n-sided polygon */
    REGULAR_POLYGON: REGULAR_POLYGON,
    /** A rectangle */
    RECTANGLE: RECTANGLE,
    /** A text box */
    TEXT: TEXT,
    /** A rectangular region of the canvas that can be exported */
    SLICE: SLICE,
    /** A node that can have instances created of it that share the same properties */
    COMPONENT: COMPONENT,
    /** An instance of a component, changes to the component result in the same changes applied to the instance */
    INSTANCE: INSTANCE,
};

${params.export ? 'export ' : ''}type NodeType = keyof NodeTypes;
`);

export const nodeInterfaceCodeStr = (params: {
    export?: boolean,
    nodeBaseInterface?: string,
}) => (
`
${params.export ? 'export ' : ''}type Node<NType extends NodeType = NodeType> = ${params.nodeBaseInterface || '{}'} & NodeTypes[NType];
`);

export const isNodeTypeCodeStr = (params: {
    export?: boolean,
}) => (
`
${params.export ? 'export ' : ''}function isNodeType<NType extends NodeType, R = Node<NType>>(node: Node<any>, type: NType): node is R {
    return node.type === type;
}
`);

export function appendFooterCode(params: (
    Parameters<typeof nodeTypeCodeStr> &
    Parameters<typeof nodeInterfaceCodeStr> &
    Parameters<typeof isNodeTypeCodeStr>
)[0]) {
    const footer = [
        nodeTypeCodeStr(params),
        nodeInterfaceCodeStr(params),
        isNodeTypeCodeStr(params),
    ].join('\n');

    return footer;
}